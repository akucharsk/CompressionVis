import sys
import time
import threading

from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings

from django.db import IntegrityError

import os
import subprocess
import json
import shutil

from utils.psnr import weighted_psnr_420
from . import models
from . import serializers
from .frames_extractor import FramesExtractor

from utils.camel import camelize, decamelize
from .metrics_extractor import MetricsExtractor

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
            print(1)
            return Response({"message": "Range header required"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.VideoSerializer(data={"video_url": video_file, "range_header": range_header})
        if not serializer.is_valid():
            print(2)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        print(3)
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

# class CompressedVideoView(APIView):
    # def get(self, request, video_id):
    #     try:
    #         video = models.Video.objects.get(id=video_id)
    #     except models.Video.DoesNotExist:
    #         return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

    #     # 🔹 Szukamy w static/compressed_videos
    #     video_file = finders.find(os.path.join("compressed_videos", video.filename))

    #     if not video_file or not os.path.exists(video_file):
    #         return Response({"message": f"Compressed video file not found for id={video_id}"}, status=status.HTTP_404_NOT_FOUND)

    #     # 🔹 Obsługa Range header (dla częściowego streamingu)
    #     range_header = request.headers.get('Range')
    #     if not range_header:
    #         return Response({"message": "Range header required"}, status=status.HTTP_400_BAD_REQUEST)

    #     serializer = serializers.VideoSerializer(
    #         data={"video_url": video_file, "range_header": range_header}
    #     )
    #     if not serializer.is_valid():
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #     return StreamingHttpResponse(
    #         streaming_content=serializer.validated_data.get("video_iterator")(),
    #         status=status.HTTP_206_PARTIAL_CONTENT,
    #         content_type="video/mp4",  # poprawny MIME type
    #     )
    # def get(self, request, video_id):
    #     try:
    #         video = models.Video.objects.get(id=video_id)
    #     except models.Video.DoesNotExist:
    #         return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

    #     # 🔹 Szukamy w static/compressed_videos
    #     video_file = finders.find(os.path.join("compressed_videos", video.filename))

    #     if not video_file or not os.path.exists(video_file):
    #         return Response({"message": f"Compressed video file not found for id={video_id}"}, status=status.HTTP_404_NOT_FOUND)

    #     # 🔹 Zwracamy cały plik (bez wymogu Range)
    #     response = FileResponse(open(video_file, "rb"), content_type="video/mp4")
    #     response["Content-Disposition"] = f'inline; filename="{video.filename}"'
    #     return response


class CompressionView(APIView):

    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")

        if not video_id:
            return Response(
                {"message": "Video id not provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            original_video = models.Video.objects.get(
                id=video_id,
                original=None
            )
        except models.Video.DoesNotExist:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = finders.find(os.path.join("original_videos", original_video.original_filename))
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
        data = serializer.validated_data

        output_filename = data['filename']
        output = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")

        resp = {
            "compressed_filename": output_filename,
            "is_compressed": False
        }

        try:
            video = models.Video.objects.get(filename=output_filename)
            resp['is_compressed'] = video.is_compressed
            if video.is_compressed:
                resp_status = status.HTTP_200_OK
            else:
                resp_status = status.HTTP_202_ACCEPTED
            resp["video_id"] = video.id
            return Response(camelize(resp), status=resp_status)
        except models.Video.DoesNotExist:
            pass

        try:
            video = serializer.save()
        except IntegrityError:
            video = models.Video.objects.get(filename=output_filename)
            resp['is_compressed'] = video.is_compressed
            if video.is_compressed:
                resp_status = status.HTTP_200_OK
            else:
                resp_status = status.HTTP_202_ACCEPTED
            resp["video_id"] = video.id
            return Response(camelize(resp), status=resp_status)

        os.makedirs(compressed_dir, exist_ok=True)
        scale = f"{data['width']}:{data['height']}"
        resp["video_id"] = video.id

        gop_size = data.get("gop_size")

        if gop_size in ["default", 1, None]:
            gop_params = []
        else:
            gop_params = ["-g", str(gop_size), "-keyint_min", str(gop_size), "-sc_threshold", "0"]

        bf = data.get("bf")
        if bf == "default":
            bf_params = []
        else:
            bf_params = ["-bf", bf]

        if data.get("bandwidth"):
            param = ["-b:v", data['bandwidth']]
        else:
            param = ["-crf", str(data['crf'])]

        process = subprocess.Popen([
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}',
            *param,
            *gop_params,
            "-preset", data['preset'],
            *bf_params,
            "-aq-mode", str(data['aq_mode']),
            "-aq-strength", str(data['aq_strength']),
            output
        ])
        process.wait()
        video.is_compressed = True
        video.save()
        resp['is_compressed'] = True

        frames_extractor = FramesExtractor(video)
        frames_extractor.start_extraction_job()

        metrics_extractor = MetricsExtractor(video)
        metrics_extractor.start_extraction_job()

        return Response(camelize(resp), status=status.HTTP_200_OK)

class CompressionFramesView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        video_file = finders.find(os.path.join("compressed_videos", video.filename))
        if not video_file:
            video_file = finders.find(os.path.join("videos", video.filename))

        if not video_file:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        if video.frames_extraction_in_progress:
            return Response(
                {"message": "processing"},
                status=status.HTTP_202_ACCEPTED
            )

        frames = models.FrameMetadata.objects.filter(video__id=video_id)
        if not frames.exists():
            return Response({"message": "Frames extractor encountered an error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        info = serializers.FrameSerializer(instance=frames, many=True).data

        return Response({"frames": info}, status=status.HTTP_200_OK)

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

class FrameView(APIView):
    def get(self, request, video_id, frame_number):
        original = request.GET.get("original")
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if original:
            dirname = video.original.filename.split(".")[0]
        else:
            dirname = video.filename.split(".")[0]

        frame = finders.find(os.path.join('frames', dirname, f"frame_{frame_number}.png"))
        if not frame:
            if video.frames_extraction_in_progress:
                return Response(
                    {"message": "Frame is being processed"},
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

# class BufferingFramesView(APIView):
#     def get(self, request, video_id, frame_number):
#         # Is filtering by video_id sufficient or filter by video in Video.model for checking if frames are recently creating
#         try:
#             buffer_size = int(request.GET.get("buffer_size"))
#             if buffer_size <= 1:
#                 raise ValueError
#         except ValueError:
#             return Response(
#                 {"message": "Invalid type of buffer_size"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             frames = models.FrameMetadata.objects.filter(
#                 video__id=video_id,
#                 frame_number__gte=frame_number,
#                 frame_number__lt=frame_number + buffer_size
#             )
#         except models.FrameMetadata.DoesNotExist:
#             return Response(
#                 {"message": "Frames not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         buffer = BytesIO()

#         with ZipFile(buffer, "w") as zipped_frames:
#             for frame_path in list(frames):
#                 frame = finders.find(frame_path.image_url)

#                 if frame:
#                     zipped_frames.write(frame, arcname=os.path.basename(frame))

#         buffer.seek(0)

#         return FileResponse(
#             buffer,
#             as_attachment=True,
#             filename=f"frames_{video_id}.zip",
#             content_type="application/zip",
#             status=status.HTTP_200_OK
#         )

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
            return Response({"message": "No metrics record created for this video"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return Response({"message": "No metrics record created for this video"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

class ParametersView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        params = {
            "crf": video.crf,
            "gop_size": video.gop_size,
            "b_frames": video.bf,
            "aq_mode": video.aq_mode,
            "aq_strength": f"{video.aq_strength:.1f}",
            "preset": video.preset,
            "resolution": f"{video.width}x{video.height}"
        }
        return Response(camelize(params), status=status.HTTP_200_OK)

class SizeView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if video.size is None:
            return Response({"message": "Size not available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"size": video.size}, status=status.HTTP_200_OK)

class SizeCompressionView(APIView):
    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")
        target_size = data.get("target_size")

        if not video_id or not target_size:
            return Response(
                {"message": "Video id and target size must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            original_video = models.Video.objects.get(id=video_id, original=None)
        except models.Video.DoesNotExist:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = finders.find(os.path.join("original_videos", original_video.original_filename))
        if not video_url:
            return Response(
                {"message": "Video not present in the file system. Please contact management!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        duration = self.get_video_duration(video_url)
        if duration is None:
            return Response(
                {"message": "Couldn't determine video duration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        target_size_bytes = float(target_size)
        bitrate = (target_size_bytes * 8) / duration
        bitrate_kbps = int(bitrate / 1000)


        output_filename = f"size{target_size}_video_{original_video.filename}"
        output_path = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")

        resp = {
            "compressed_filename": output_filename,
            "is_compressed": False
        }

        try:
            video = models.Video.objects.get(filename=output_filename)
            resp["is_compressed"] = video.is_compressed
            resp["video_id"] = video.id
            return Response(
                camelize(resp),
                status=status.HTTP_200_OK if video.is_compressed else status.HTTP_202_ACCEPTED
            )
        except models.Video.DoesNotExist:
            pass

        try:
            video = models.Video.objects.create(
                filename=output_filename,
                original=original_video,
                is_compressed=False
            )
        except IntegrityError:
            video = models.Video.objects.get(filename=output_filename)
            resp["is_compressed"] = video.is_compressed
            resp["video_id"] = video.id
            return Response(
                camelize(resp),
                status=status.HTTP_200_OK if video.is_compressed else status.HTTP_202_ACCEPTED
            )

        os.makedirs(compressed_dir, exist_ok=True)

        process = subprocess.Popen([
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-b:v", f"{bitrate_kbps}k",
            output_path
        ])
        process.wait()

        video.is_compressed = True
        video.width = original_video.width
        video.height = original_video.height
        video.save()

        try:
            file_size_bytes = os.path.getsize(output_path)
            file_size_mb = file_size_bytes
            resp["resulting_size"] = round(file_size_mb, 2)
        except FileNotFoundError:
            return Response(
                {"message": "Couldn't determine resulting file size"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        resp["is_compressed"] = True
        resp["video_id"] = video.id

        return Response(camelize(resp), status=status.HTTP_200_OK)

    @staticmethod
    def get_video_duration(video_path):
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", video_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            return float(result.stdout)
        except Exception:
            return None
