import base64
import sys

import cv2
import json
import numpy as np
from ntpath import isdir
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import IntegrityError
from django.utils import dateformat
from django.db.models import F
from django.db.models.functions import Concat
from django.db.models import Value as V
from django.db.models import CharField
from django.db.models import Q

import uuid
import os
import subprocess
import shutil
from macroblocks.macroblocks_extractor import MacroblocksExtractor
from . import models
from . import serializers
from . import tasks
from .frames_extractor import FramesExtractor

from macroblocks import tasks as macroblocks_tasks

from utils.camel import camelize, decamelize
from .metrics_extractor import MetricsExtractor
from celery import group, chain

import json
import zipfile
from io import BytesIO

from .permissions import IsSuperuser

FRAMES_PER_BATCH = int(os.getenv('FRAMES_PER_BATCH'))

class VideoView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        video_file = finders.find(os.path.join("videos", video.filename))

        if not video_file:
            video_file = finders.find(os.path.join("compressed_videos", video.filename))

            if not video_file:
                return Response(status=status.HTTP_404_NOT_FOUND)

        range_header = request.headers.get('Range')

        if not range_header:
            return Response({"message": "Range header required"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.VideoSerializer(data={"video_url": video_file, "range_header": range_header})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        response = StreamingHttpResponse(
            streaming_content=serializer.validated_data.get("video_iterator")(),
            status=status.HTTP_206_PARTIAL_CONTENT,
            content_type="video/mp4"
        )
        response["Content-Length"] = serializer.validated_data["Content-Length"]
        response["Content-Range"] = serializer.validated_data["Content-Range"]
        response["Accept-Ranges"] = "bytes"
        return response

    def delete(self, request, video_id):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_superuser:
            return Response({"message": "Superuser cannot access questions"}, status=status.HTTP_403_FORBIDDEN)

        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        dot_idx = video.filename.find(".")
        if dot_idx == -1:
            return Response({"message": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)
        frames_dirname = video.filename[:dot_idx]
        video_path = finders.find(os.path.join("compressed_videos", video.filename))
        frames_path = finders.find(os.path.join("frames", frames_dirname))
        macroblocks_path = finders.find(os.path.join("macroblocks", frames_dirname))

        os.remove(video_path)
        if frames_path:
            shutil.rmtree(frames_path)
        if macroblocks_path:
            shutil.rmtree(macroblocks_path)
        video.delete()
        return Response({"message": "OK", "videoId": video_id}, status=status.HTTP_200_OK)

class BaseCompressionView(APIView):
    def get_original_video(self, video_id):
        try:
            return models.Video.objects.get(id=video_id, original=None)
        except models.Video.DoesNotExist:
            return None

    def get_video_path(self, original_video):
        video_url = finders.find(os.path.join("original_videos", original_video.original_filename))
        return video_url if video_url else None

    def get_or_create_video(self, serializer):
        filename = serializer.validated_data["filename"]
        try:
            video = models.Video.objects.get(filename=filename)
            return video, False
        except models.Video.DoesNotExist:
            try:
                video = serializer.save()
                return video, True
            except IntegrityError:
                video = models.Video.objects.get(filename=filename)
                return video, False

    def execute_compression(self, compression_input, video):
        video.frames_extraction_in_progress = True
        video.macroblocks_extraction_in_progress = True
        video.save()
        try:
            metrics = models.VideoMetrics.objects.create(video=video)
        except IntegrityError:
            metrics = models.VideoMetrics.objects.get(video=video)
        chain(
            tasks.compress_video.si(compression_input).set(queue="video"),
            group(
                tasks.extract_frames.si(video.id).set(queue="frames"),
                tasks.extract_metrics.si(video.id, metrics.id).set(queue="metrics"),
                macroblocks_tasks.extract_macroblocks.si(video.id).set(queue="macroblocks")
            )
        ).apply_async()
        return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)

class CompressionView(BaseCompressionView):

    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")

        if not video_id:
            return Response(
                {"message": "Video id not provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        original_video = self.get_original_video(video_id)
        if not original_video:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = self.get_video_path(original_video)
        if not video_url:
            return Response(
                {"message": "Video not present in the file system. Please contact management!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = serializers.CompressSerializer(
            data=request.data,
            context={"original_video": original_video}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        output_filename = validated_data['filename']

        video, created = self.get_or_create_video(serializer)

        if not created:
            return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)

        output = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")
        os.makedirs(compressed_dir, exist_ok=True)

        scale = f"{validated_data['width']}:{validated_data['height']}"
        gop_size = validated_data.get("gop_size")
        bf = validated_data.get("bf")

        if gop_size in ["default", 1, None]:
            gop_params = []
        else:
            gop_params = ["-g", str(gop_size), "-keyint_min", str(gop_size), "-sc_threshold", "0"]

        if bf == "default":
            bf_params = []
        else:
            bf_params = ["-bf", bf]

        if validated_data.get("bandwidth"):
            bitrate_param = ["-b:v", validated_data['bandwidth']]
        else:
            bitrate_param = ["-crf", str(validated_data['crf'])]

        ffmpeg_command = [
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}:flags=lanczos',
            *bitrate_param,
            *gop_params,
            "-preset", validated_data['preset'],
            *bf_params,
            "-aq-mode", str(validated_data['aq_mode']),
            "-aq-strength", str(validated_data['aq_strength']),
            output
        ]

        compression_input = {
            "ffmpeg_command": ffmpeg_command,
            "video_id": video.id,
            "output_path": output,
            "output_filename": output_filename,
        }
        return self.execute_compression(compression_input, video)
    
class SizeCompressionView(BaseCompressionView):
    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")
        target_size = data.get("target_size")

        if not video_id or not target_size:
            return Response(
                {"message": "Video id and target size must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        original_video = self.get_original_video(video_id)
        if not original_video:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = self.get_video_path(original_video)
        if not video_url:
            return Response(
                {"message": "Video not present in the file system. Please contact management!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        duration = tasks.get_video_duration.apply_async(args=[video_url], queue="video").get()
        if duration is None:
            return Response(
                {"message": "Couldn't determine video duration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = serializers.SizeCompressionSerializer(
            data=data,
            context={ "original_video": original_video, "duration": duration }
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        output_filename = validated_data["filename"]
        video, created = self.get_or_create_video(serializer)

        if not created:
            return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)
        output_path = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")
        os.makedirs(compressed_dir, exist_ok=True)

        ffmpeg_command = [
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-b:v", f"{validated_data['bandwidth']}k",
            output_path
        ]

        compression_input = {
            "ffmpeg_command": ffmpeg_command,
            "video_id": video.id,
            "video_path": video_url,
            "output_path": output_path,
            "output_filename": output_filename,
        }

        return self.execute_compression(compression_input, video)

    @staticmethod
    def get_video_duration(video_path):
        try:
            result = subprocess.Popen(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", video_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            result, error = result.communicate()
            if error:
                raise Exception(error)
            return float(result.stdout)
        except Exception as e:
            print(f"Error getting video duration: {e}")
            sys.stdout.flush()
            return None

class CompressionFramesView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        frames = models.FrameMetadata.objects.filter(video=video)
        video_name = os.path.splitext(video.filename)[0]
        frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", video_name)
        os.makedirs(frames_dir, exist_ok=True)
        extracted_count = len(os.listdir(frames_dir))
        if not frames.exists() or extracted_count == 0:
            if video.frames_extraction_in_progress:
                return Response({ "message": "processing" }, status=status.HTTP_202_ACCEPTED)
            print("FRAMES EXTRACTOR ENCOUNTERED AN ERROR", extracted_count, frames.exists())
            print(os.listdir(finders.find(os.path.join("frames", video_name))), os.path.exists(finders.find(os.path.join("frames", video_name))))
            print(frames.exists())
            return Response({"message": "Frames extraction failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        info = serializers.FrameSerializer(instance=frames, many=True).data
        result = list(sorted(info[:extracted_count], key=lambda x: x["frame_number"]))
        return Response({ "frames": result, "total": len(info) }, status=status.HTTP_200_OK)

class ExampleVideosView(APIView):
    def get(self, request):
        videos_dir = os.path.join(settings.BASE_DIR, "static", "videos")
        thumbs_dir = os.path.join(settings.BASE_DIR, "static", "thumbnails")
        os.makedirs(thumbs_dir, exist_ok=True)

        videos = models.Video.objects.filter(original=None)

        for video in videos:
            video_path = os.path.join(videos_dir, video.filename)
            thumbnail_filename = f"{os.path.splitext(video.filename)[0]}.png"
            thumbnail_path = os.path.join(thumbs_dir, thumbnail_filename)

            if not os.path.exists(thumbnail_path):
                subprocess.run([
                    "ffmpeg", "-i", video_path,
                    "-ss", "00:00:01.000",
                    "-frames:v", "1",
                    "-update", "1",
                    thumbnail_path
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return Response(
            {"videoIds": videos.values("id", "title")},
            status=status.HTTP_200_OK
        )

class ThumbnailView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        thumbnail_filename = f"{os.path.splitext(video.filename)[0]}.png"
        file_path = finders.find(os.path.join('thumbnails', thumbnail_filename))
        if not file_path:
            return Response({"message": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'), content_type="image/png", status=status.HTTP_200_OK)

class FrameStatusView(APIView):
    def get(self, request, video_id, frame_number):
        original = request.GET.get("original")
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if original:
            has_original = video.original

            if has_original:
                dirname = video.original.filename.split(".")[0]

            else:
                dirname = video.filename.split(".")[0]

            width = request.query_params.get('width')
            height = request.query_params.get('height')

            if width and height:
                dirname = f"{dirname}_{width}x{height}"
        else:
            dirname = video.filename.split(".")[0]

        frame = finders.find(os.path.join('frames', dirname, f"frame_{frame_number}.png"))
        if not frame:
            if video.frames_extraction_in_progress:
                return Response(
                    {"message": "processing"},
                    status=status.HTTP_202_ACCEPTED
                )

            if video.frames_extraction_completed:
                return Response(
                    {"message": "Frame not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(
                {"message": "processing"},
                status=status.HTTP_202_ACCEPTED
            )
        return Response({ "url": f"frames/{video_id}/{frame_number}" }, status=status.HTTP_200_OK)

class FrameView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        dirname = video.filename.split(".")[0]

        if video.original is None:
            width = request.query_params.get('width')
            height = request.query_params.get('height')

            if width and height:
                dirname = f"{dirname}_{width}x{height}"

        frame = finders.find(os.path.join('frames', dirname, f"frame_{frame_number}.png"))
        if not frame:
            if video.frames_extraction_in_progress:
                return Response(
                    {"message": "processing"},
                    status=status.HTTP_202_ACCEPTED
                )

            if video.frames_extraction_completed:
                return Response(
                    {"message": "Frame not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(
                {"message": "processing"},
                status=status.HTTP_202_ACCEPTED
            )
        return FileResponse(
            open(frame, 'rb'),
            content_type="image/png",
            status=status.HTTP_200_OK
        )

class MetricView(APIView):
    @staticmethod
    def wrap_metrics(metrics, fields=("psnr_mean", "ssim_mean", "vmaf_mean")):
        metric_scores = list(map(lambda field: getattr(metrics, field), fields))
        if all(metric_scores):
            [psnr, ssim, vmaf] = metric_scores
            return {
                "metrics": {
                    "VMAF": round(vmaf, 2),
                    "SSIM": round(ssim, 2),
                    "PSNR": round(psnr, 2),
                }
            }

        return None

    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "Metrics extraction failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        wrapped_metrics = self.wrap_metrics(metrics)
        if wrapped_metrics:
            return Response(wrapped_metrics, status=status.HTTP_200_OK)

        return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

class FrameMetricView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            frame = models.FrameMetadata.objects.get(
                video__id=video_id,
                frame_number=frame_number
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        resp = MetricView.wrap_metrics(frame, fields=("psnr_score", "ssim_score", "vmaf_score"))
        return Response(resp, status=status.HTTP_200_OK)

class AllFramesMetricsView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        if not MetricView.wrap_metrics(metrics):
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        frames = models.FrameMetadata.objects.filter(video=video)
        frame_metrics = frames.values("psnr_score", "ssim_score", "vmaf_score")
        for metric in frame_metrics:
            for score in ["psnr_score", "ssim_score", "vmaf_score"]:
                name = score.split("_")[0]
                metric[name.upper()] = round(metric[score], 2)
                del metric[score]

        return Response({"metrics": frame_metrics}, status=status.HTTP_200_OK)

class FramesSizesMetricsChartsView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        if not MetricView.wrap_metrics(metrics):
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        frames = models.FrameMetadata.objects.filter(video=video)
        frames_data = frames.all().order_by('frame_number').values("psnr_score", "ssim_score", "vmaf_score", "pkt_size")
        
        data = {
            "VMAF": [],
            "PSNR": [],
            "SSIM": [],
            "Size": []
        }

        for metric in frames_data:
            for score in ["psnr_score", "ssim_score", "vmaf_score"]:
                name = score.split("_")[0]
                data[name.upper()].append(round(metric[score], 2))
            data["Size"].append(round(metric["pkt_size"], 2))

        return Response({"metrics": data}, status=status.HTTP_200_OK)


class MetricStatusView(APIView):
    @staticmethod
    def are_all_metrics(metrics):
        if not metrics:
            return False
        return all([
            metrics.vmaf_mean is not None and metrics.vmaf_mean != 0,
            metrics.psnr_mean is not None and metrics.psnr_mean != 0,
            metrics.ssim_mean is not None and metrics.ssim_mean != 0
        ])

    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "Metrics extraction failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if self.are_all_metrics(metrics):
            return Response({"message": "finished"}, status=status.HTTP_200_OK)
        return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)


class SizeView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if video.size is None:
            return Response({"message": "Size not available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"size": video.size}, status=status.HTTP_200_OK)

class VideoParameters(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        params = {
            "bandwidth": video.bandwidth,
            "resolution": f"{video.width}x{video.height}",
            "crf": video.crf,
            "gop_size": video.gop_size,
            "bf": video.bf,
            "aq_mode": video.aq_mode,
            "aq_strength": float(video.aq_strength) if video.aq_strength is not None else None,
            "preset": video.preset,
            "size": video.size,
        }

        return Response(camelize(params), status=status.HTTP_200_OK)

class AllCompressed(APIView):
    def get(self, request):
        original_video_id = request.query_params.get('original_id', None)
        queryset = models.Video.objects.filter(is_compressed=True)

        if original_video_id is not None:
            try:
                queryset = queryset.filter(original=original_video_id)
            except ValueError:
                return Response({"message": "Invalid original_id format."}, status=status.HTTP_400_BAD_REQUEST)

        videos = queryset.annotate(
            resolution_str=Concat(
                F('width'),
                V('x'),
                F('height'),
                output_field=CharField()
            )
        ).values(
            "id",
            "original_filename",
            "size",
            "title",
            "filename",
            "bandwidth",
            "crf",
            "gop_size",
            "bf",
            "aq_mode",
            "aq_strength",
            "preset",
            "resolution_str",
            "original",
        )

        video_list = []
        for video in videos:
            video_data = {
                "id": video["id"],
                "original_filename": video["original_filename"],
                "size": video["size"],
                "title": video["title"],
                "filename": video["filename"],
                "bandwidth": video["bandwidth"],
                "original": video["original"],
                "resolution": video["resolution_str"],
                "crf": video["crf"],
                "gop_size": video["gop_size"],
                "bf": video["bf"],
                "aq_mode": video["aq_mode"],
                "aq_strength": float(video["aq_strength"]) if video["aq_strength"] is not None else None,
                "preset": video["preset"],
            }
            video_list.append(video_data)

        return Response({"videos": camelize(video_list)}, status=status.HTTP_200_OK)

class CompressionsForCharts(APIView):
    def get(self, request):
        values_params = [
            "id",
            "original",
            "bandwidth",
            "crf",
            "width",
            "height",
            "gop_size",
            "bf",
            "aq_mode",
            "aq_strength",
            "preset",
            "size",
            "videometrics__vmaf_mean",
            "videometrics__psnr_mean",
            "videometrics__ssim_mean",
            "created_at"
        ]
        originalVideoId = request.GET.get("originalVideoId")
        try:
            if originalVideoId:
                # To avoid getting list of all compressed in ChartsOptions. Instead of that "Choose base video"
                if originalVideoId != "null":
                    originalVideoId = int(originalVideoId)
                    videos = models.Video.objects.filter(
                        is_compressed=True, original=originalVideoId
                    ).select_related('videometrics') \
                    .values(*values_params)
                    if videos:
                        videos = list(videos)
                        for video in videos:
                            video["metrics"] = {
                                "vmaf": video.pop("videometrics__vmaf_mean"),
                                "ssim": video.pop("videometrics__ssim_mean"),
                                "psnr": video.pop("videometrics__psnr_mean"),
                                "size": video.pop("size")
                            }
                            video["created_at"] = dateformat.format(video["created_at"], "d M Y H:i:s")
                        return Response({"videos": list(videos)}, status=status.HTTP_200_OK)
                    # No videos found for this originalVideoIdd
                    return Response(status=status.HTTP_204_NO_CONTENT)
                # For moment when not selected original video yet
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                videos = models.Video.objects.filter(
                    is_compressed=True
                ).select_related('videometrics') \
                .values(*values_params)
            if videos:
                videos = list(videos)
                for video in videos:
                    video["metrics"] = {
                        "vmaf": video.pop("videometrics__vmaf_mean"),
                        "ssim": video.pop("videometrics__ssim_mean"),
                        "psnr": video.pop("videometrics__psnr_mean"),
                        "size": video.pop("size")
                    }
                    video["created_at"] = dateformat.format(video["created_at"], "d M Y H:i:s")
                return Response({"videos": list(videos)}, status=status.HTTP_200_OK)
            # No compressions yet in database
            return Response(status=status.HTTP_204_NO_CONTENT)
        except (TypeError, ValueError):
            return Response({"description": f"Invalid originalVideoId {originalVideoId} (type {type(originalVideoId)}).  TypeError or ValueError"}, status=status.HTTP_400_BAD_REQUEST)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
class FrameSizeView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            frame = models.FrameMetadata.objects.get(
                video__id=video_id,
                frame_number=frame_number
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        if frame.pkt_size is None:
            return Response({"message": "Size not available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"size": frame.pkt_size}, status=status.HTTP_200_OK)

class UploadQuestionsView(APIView):
    permission_classes = [IsSuperuser]

    def _extract_entries(self, quiz_dir, static_file_path=os.path.join(settings.BASE_DIR, "static", "quiz_files", "assets")):
        result = []
        for file in os.listdir(quiz_dir):
            if os.path.isdir(os.path.join(quiz_dir, file)):
                next_static_file_path = os.path.join(static_file_path, file)
                result.extend(self._extract_entries(os.path.join(quiz_dir, file), next_static_file_path))
            elif file.endswith(".json"):
                with open(os.path.join(quiz_dir, file), "r", encoding="utf-8") as f:
                    json_data = json.load(f)
                    json_data["assets_location"] = static_file_path
                    result.append(json_data)
            else:
                os.makedirs(static_file_path, exist_ok=True)
                static_file = os.path.join(static_file_path, file)
                shutil.move(os.path.join(quiz_dir, file), static_file)
        return result

    def _upsert_quiz(self, quiz, archive_path):
        existing_quiz = models.Quiz.objects.filter(name=quiz.get("name")).first()
        if existing_quiz:
            existing_quiz.description = quiz.get("description", "Unknown Quiz Description")
            existing_quiz.video_filename = quiz.get("video_name", None)
            existing_quiz.assets_location = quiz.get("assets_location")
            existing_quiz.archive_location = archive_path
            existing_quiz.save()
        else:
            existing_quiz = models.Quiz.objects.create(
                name=quiz.get("name", f"Unknown Quiz {uuid.uuid4()}"),
                description=quiz.get("description", "Unknown Quiz Description"),
                video_filename=quiz.get("video_name", None),
                assets_location=quiz.get("assets_location"),
                archive_location=archive_path
            )
        return existing_quiz

    def post(self, request):

        if "file" not in request.FILES:
            return Response({"message": "Brak pliku ZIP"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES["file"]

        quiz_dir = os.path.join(settings.BASE_DIR, "static", "quiz_files", "archives")
        os.makedirs(quiz_dir, exist_ok=True)
        temp_quiz_dir = os.path.join(settings.BASE_DIR, "static", "temp", "quiz_files")
        os.makedirs(temp_quiz_dir, exist_ok=True)

        archive_path = os.path.join(quiz_dir, uploaded_file.name)
        with open(archive_path, "wb") as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        uploaded_file.seek(0)

        try:
            with zipfile.ZipFile(uploaded_file) as z:
                z.extractall(temp_quiz_dir)
        except zipfile.BadZipFile:
            return Response({"message": "Niepoprawny ZIP"}, status=status.HTTP_400_BAD_REQUEST)

        quizes_json = self._extract_entries(temp_quiz_dir)

        for quiz in quizes_json:
            quiz_record = models.Quiz.objects.create(
                name=quiz.get("name", f"Unknown Quiz {uuid.uuid4()}"),
                description=quiz.get("description", "Unknown Quiz Description"),
                video_filename=quiz.get("video_name", None),
                assets_location=quiz.get("assets_location"),
                archive_location=archive_path,
            )
            questions = []
            for question in quiz.get("questions", []):
                answers = question.get("answers", [])
                questions.append(
                    models.QuizQuestion(
                        quiz=quiz_record,
                        question=question.get("question", f"Unknown Question {uuid.uuid4()}"),
                        answers=answers,
                        image=question.get("image"),
                    )
                )
            models.QuizQuestion.objects.bulk_create(questions)

        shutil.rmtree(temp_quiz_dir)
        return Response({"message": "quizes uploaded successfully"}, status=status.HTTP_201_CREATED)

    def get(self, request, quiz_dir="QUIZ_DIR"):
        zip_path = os.path.join(quiz_dir, "source.zip")

        if not os.path.exists(zip_path):
            return Response({"message": "Brak wgranego ZIP"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(zip_path, "rb"), filename="questions.zip")

class QuizesView(APIView):
    def get(self, request, video_id=None):
        videos = models.Video.objects.filter(Q(id=video_id) | Q(original=None))
        filename_video_map = { video.filename: video for video in videos }
        filenames = list(map(lambda video: video.filename, videos))
        quizes = models.Quiz.objects.filter(Q(video_filename__in=filenames) | Q(video_filename=None))
        data = serializers.QuizSerializer(instance=quizes, many=True).data

        def get_video_id(quiz):
            filename = quiz.get("video_filename")
            if not filename:
                return None
            video = filename_video_map.get(filename)
            if video:
                return video.id
            return None

        for quiz in data:
            quiz["video_id"] = get_video_id(quiz)
        return Response({"quizes": data}, status=status.HTTP_200_OK)

class QuizView(APIView):
    def get(self, request, quiz_id):
        try:
            quiz = models.Quiz.objects.get(id=quiz_id)
        except models.Quiz.DoesNotExist:
            return Response({"message": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        questions = models.QuizQuestion.objects.filter(quiz=quiz)
        serialized_questions = serializers.QuizQuestionSerializer(instance=questions, many=True).data
        serialized_quiz = serializers.QuizSerializer(instance=quiz).data
        serialized_quiz["questions"] = serialized_questions
        return Response({"quiz": serialized_quiz}, status=status.HTTP_200_OK)

    def delete(self, request, quiz_id):
        try:
            quiz = models.Quiz.objects.get(id=quiz_id)
        except models.Quiz.DoesNotExist:
            return Response({"message": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        questions = models.QuizQuestion.objects.filter(quiz=quiz)
        for question in questions:
            if question.image and os.path.exists(os.path.join(quiz.assets_location, question.image)):
                os.remove(os.path.join(quiz.assets_location, question.image))
        if os.path.exists(quiz.assets_location) and len(os.listdir(quiz.assets_location)) == 0:
            shutil.rmtree(quiz.assets_location)
        quiz.delete()
        return Response({"message": "Quiz deleted successfully"}, status=status.HTTP_200_OK)

class QuizQuestionImageView(APIView):
    def get(self, request, question_id):
        try:
            question = models.QuizQuestion.objects.get(id=question_id)
        except models.QuizQuestion.DoesNotExist:
            return Response({"message": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        if not question.image or not question.quiz.assets_location or not os.path.exists(os.path.join(question.quiz.assets_location, question.image)):
            return Response({"message": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(open(os.path.join(question.quiz.assets_location, question.image), "rb"), content_type="image/png", status=status.HTTP_200_OK)

class DifferenceView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        filename = video.filename
        if filename.endswith(".y4m"):
            folder_name = filename[:-4] + "_1280x720"
        else:
            folder_name = os.path.splitext(filename)[0] + "_1280x720"

        frames_path = finders.find(os.path.join("frames", folder_name))

        if not frames_path or not os.path.exists(frames_path):
            return Response({"count": 0}, status=status.HTTP_200_OK)

        count = len([name for name in os.listdir(frames_path) if os.path.isfile(os.path.join(frames_path, name))])
        return Response({"count": count}, status=status.HTTP_200_OK)


class DifferenceFrameView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        filename = video.filename
        if filename.endswith(".y4m"):
            base_name = filename[:-4]
            folder_name = base_name + "_1280x720"
        else:
            base_name = os.path.splitext(filename)[0]
            folder_name = base_name + "_1280x720"

        current_frame_path = finders.find(os.path.join("frames", folder_name, f"frame_{frame_number}.png"))
        if not current_frame_path:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        def encode_image(image_path_or_array, is_array=False):
            if is_array:
                _, buffer = cv2.imencode('.png', image_path_or_array)
                return base64.b64encode(buffer).decode('utf-8')
            else:
                with open(image_path_or_array, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode('utf-8')

        def smart_crop(image, center_x, center_y, w, h):
            top_left_x = center_x - (w / 2.0)
            top_left_y = center_y - (h / 2.0)

            epsilon = 0.001
            is_integer_x = abs(top_left_x - round(top_left_x)) < epsilon
            is_integer_y = abs(top_left_y - round(top_left_y)) < epsilon

            if is_integer_x and is_integer_y:
                ix = int(round(top_left_x))
                iy = int(round(top_left_y))
                return image[iy:iy + h, ix:ix + w]
            else:
                map_matrix = np.float32([
                    [1, 0, (w / 2.0) - center_x],
                    [0, 1, (h / 2.0) - center_y]
                ])
                return cv2.warpAffine(
                    image,
                    map_matrix,
                    (w, h),
                    flags=cv2.INTER_LINEAR,
                    borderMode=cv2.BORDER_REPLICATE
                )

        original_b64 = encode_image(current_frame_path, is_array=False)
        diff_prev_b64 = None
        diff_third_b64 = None

        if frame_number > 0:
            prev_frame_path = finders.find(os.path.join("frames", folder_name, f"frame_{frame_number - 1}.png"))

            if prev_frame_path:
                img_curr = cv2.imread(current_frame_path)
                img_prev = cv2.imread(prev_frame_path)

                if img_curr is not None and img_prev is not None:
                    diff = cv2.absdiff(img_curr, img_prev)
                    diff_prev_b64 = encode_image(diff, is_array=True)

                    json_path = os.path.join("static", "differences", base_name, f"frame_{frame_number:03d}.json")

                    if not os.path.exists(json_path):
                        return Response({"message": f"JSON file not found: {json_path}"},
                                        status=status.HTTP_404_NOT_FOUND)

                    with open(json_path, 'r') as f:
                        vectors = json.load(f)

                    final_diff = diff.copy()

                    padding = 64
                    padded_prev = cv2.copyMakeBorder(img_prev, padding, padding, padding, padding, cv2.BORDER_REPLICATE)

                    loaded_refs = {-1: padded_prev}

                    for v in vectors:
                        source_offset = v['source']
                        if source_offset == 0:
                            continue

                        if source_offset not in loaded_refs:
                            ref_idx = frame_number + source_offset
                            ref_path = finders.find(os.path.join("frames", folder_name, f"frame_{ref_idx}.png"))
                            if ref_path:
                                raw_ref = cv2.imread(ref_path)
                                loaded_refs[source_offset] = cv2.copyMakeBorder(raw_ref, padding, padding, padding,
                                                                                padding, cv2.BORDER_REPLICATE)
                            else:
                                loaded_refs[source_offset] = None

                        img_ref_padded = loaded_refs[source_offset]
                        if img_ref_padded is None:
                            continue

                        w, h = v['width'], v['height']

                        dst_center_x, dst_center_y = v['dst_x'], v['dst_y']
                        src_center_x, src_center_y = v['src_x'], v['src_y']

                        dst_x_left = int(dst_center_x - (w / 2))
                        dst_y_top = int(dst_center_y - (h / 2))

                        if (dst_y_top >= 0 and dst_x_left >= 0 and
                                dst_y_top + h <= img_curr.shape[0] and dst_x_left + w <= img_curr.shape[1]):

                            block_curr = img_curr[dst_y_top: dst_y_top + h, dst_x_left: dst_x_left + w]

                            real_src_center_x = float(src_center_x) + padding
                            real_src_center_y = float(src_center_y) + padding

                            block_ref = smart_crop(img_ref_padded, real_src_center_x, real_src_center_y, w, h)

                            if block_ref is not None:
                                block_ref = block_ref.astype(np.uint8)
                                block_diff = cv2.absdiff(block_curr, block_ref)

                                final_diff[dst_y_top: dst_y_top + h, dst_x_left: dst_x_left + w] = block_diff

                    diff_third_b64 = encode_image(final_diff, is_array=True)

        return Response({
            "original_frame": original_b64,
            "diff_prev_frame": diff_prev_b64,
            "diff_third_frame": diff_third_b64
        }, status=status.HTTP_200_OK)
