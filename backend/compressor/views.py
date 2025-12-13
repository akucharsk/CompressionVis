from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import IntegrityError

import os
import sys
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

        os.remove(video_path)
        shutil.rmtree(frames_path)
        models.Video.objects.filter(id=video_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
            return self.prepare_response(video, output_filename)

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
            "-vf", f'scale={scale}',
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
            return self.prepare_response(video, output_filename)

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
        try:
            videos = models.Video.objects.filter(is_compressed=True).values("id", "original_filename", "size", "filename")
            return Response({"videos": list(videos)}, status=status.HTTP_200_OK)    
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)    

class MetricsRank(APIView):
    def get(self, request):
        originalVideoId = request.GET.get("originalVideoId")
        try:
            if originalVideoId:
                originalVideoId = int(originalVideoId)
                videos = models.Video.objects.filter(
                    is_compressed=True, original=originalVideoId
                ).select_related('videometrics') \
                .values(
                    "id", "bandwidth", "crf", "width", "height", "gop_size", "bf", 
                    "aq_mode", "aq_strength", "preset", "size", 
                    "videometrics__vmaf_mean", 
                    "videometrics__psnr_mean", 
                    "videometrics__ssim_mean"
                )
            else:
                videos = models.Video.objects.filter(
                    is_compressed=True
                ).select_related('videometrics') \
                .values(
                    "id", "bandwidth", "crf", "width", "height", "gop_size", "bf", 
                    "aq_mode", "aq_strength", "preset", "size", 
                    "videometrics__vmaf_mean", 
                    "videometrics__psnr_mean", 
                    "videometrics__ssim_mean"
                )
            return Response({"videos": list(videos)}, status=status.HTTP_200_OK)
        except (TypeError, ValueError):
            return Response({"description": str(originalVideoId)}, status=status.HTTP_400_BAD_REQUEST)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
                           
class DeleteVideoView(APIView):
    def delete(self, request, video_id):
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

        os.remove(video_path)
        shutil.rmtree(frames_path)
        models.Video.objects.filter(id=video_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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

QUIZ_DIR = "/STATIC/QUIZ"

class UploadQuestionsView(APIView):

    def post(self, request):
        if "file" not in request.FILES:
            return Response({"message": "Brak pliku ZIP"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES["file"]

        if os.path.exists(QUIZ_DIR):
            shutil.rmtree(QUIZ_DIR)
        os.makedirs(QUIZ_DIR, exist_ok=True)

        zip_path = os.path.join(QUIZ_DIR, "source.zip")
        with open(zip_path, "wb") as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        uploaded_file.seek(0)

        try:
            with zipfile.ZipFile(uploaded_file) as z:
                z.extractall(QUIZ_DIR)
        except zipfile.BadZipFile:
            return Response({"message": "Niepoprawny ZIP"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "OK – pliki nadpisane"}, status=status.HTTP_201_CREATED)


class GetQuestionsView(APIView):
    def get(self, request, number):
        file_path = os.path.join(QUIZ_DIR, f"questions{number}.json")

        if not os.path.exists(file_path):
            return Response({"message": "Plik nie istnieje"}, status=status.HTTP_404_NOT_FOUND)

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return Response(data, status=status.HTTP_200_OK)


class DownloadQuestionsZipView(APIView):

    def get(self, request):
        zip_path = os.path.join(QUIZ_DIR, "source.zip")

        if not os.path.exists(zip_path):
            return Response({"message": "Brak wgranego ZIP"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(zip_path, "rb"), filename="questions.zip")