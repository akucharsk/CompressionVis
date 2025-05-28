import time

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
import redis

from utils.psnr import weighted_psnr_420
from . import models
from . import serializers

from utils.camel import camelize

FRAMES_PER_BATCH = int(os.getenv('FRAMES_PER_BATCH'))

REDIS = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
)

class VideoView(APIView):
    def get(self, request, file_name):
        video_file = finders.find(os.path.join("videos", file_name))

        if not video_file:
            video_file = finders.find(os.path.join('compressed_videos', file_name))
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
            content_type="media/mp4"
        )
        return response

class CompressionView(APIView):

    def post(self, request):
        filename = request.data.get('fileName')

        if not filename:
            return Response({"message": "Video file name not provided"}, status=status.HTTP_400_BAD_REQUEST)
        video_url = finders.find(os.path.join("videos", filename))
        if not video_url:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            video = models.Video.objects.get(filename=filename)
        except models.Video.DoesNotExist:
            return Response({"message": "Filename not found in the database."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        request.data["original_id"] = video.id
        serializer = serializers.CompressSerializer(data=request.data)

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
            return Response(camelize(resp), status=status.HTTP_200_OK)
        except models.Video.DoesNotExist:
            pass

        try:
            video = serializer.save()
        except IntegrityError:
            video = models.Video.objects.get(filename=output_filename)
            resp['is_compressed'] = video.is_compressed
            return Response(camelize(resp), status=status.HTTP_200_OK)

        os.makedirs(compressed_dir, exist_ok=True)
        scale = f"{data['width']}:{data['height']}"

        process = subprocess.Popen([
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}',
            "-b:v", data['bandwidth'],
            "-crf", str(data['crf']),
            output
        ])
        process.wait()
        video.is_compressed = True
        video.save()
        resp['is_compressed'] = True
        return Response(camelize(resp), status=status.HTTP_200_OK)

class CompressionFramesView(APIView):
    def get(self, request, file_name):
        video_file = finders.find(os.path.join("compressed_videos", file_name))
        if not video_file:
            video_file = finders.find(os.path.join("videos", file_name))

        if not video_file:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        file_name = os.path.basename(video_file)
        video_name = os.path.splitext(file_name)[0]
        frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", video_name)

        try:
            video = models.Video.objects.get(filename=file_name)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        def frames_stream(frames):
            start = 0
            n = len(frames)
            while start < n:
                end = min(start + FRAMES_PER_BATCH, n)
                file_path = os.path.join(frames_dir, f"frame_{end - 1}.png")
                while not os.path.exists(file_path):
                    time.sleep(0.05)
                ready_frames = frames[start:end]
                yield json.dumps(ready_frames) + '\n'
                start = end

        frames = models.FrameMetadata.objects.filter(video__filename=file_name)
        if frames.exists():
            info = serializers.FrameSerializer(instance=frames, many=True).data

            return StreamingHttpResponse(
                frames_stream(info),
                status=status.HTTP_200_OK
            )

        os.makedirs(frames_dir, exist_ok=True)

        info = self.get_frame_info(video_file, video)
        frames_serializer = serializers.CreateFramesSerializer(data={"frames": info})

        if not frames_serializer.is_valid():
            return Response(frames_serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        frames_serializer.save()
        data = frames_serializer.validated_data['frames']

        self.extract_frames(video_file, frames_dir)

        return StreamingHttpResponse(
            frames_stream(data),
            status=status.HTTP_200_OK
        )

    @staticmethod
    def get_frame_info(video_path, video):
        result = subprocess.run([
            "ffprobe",
            "-show_frames",
            "-select_streams", "v",
            "-print_format", "json",
            video_path
        ], capture_output=True, text=True)

        data = json.loads(result.stdout)

        frames = []
        i = 0
        frames_dir = video.filename.split(".")[0]
        for frame in data.get("frames", []):
            pict_type = frame.get("pict_type")
            if pict_type in ["I", "P", "B"]:
                frames.append({
                    "frame_number": i,
                    "type": pict_type,
                    "pts_time": frame.get("pts_time"),
                    "video_id": video.id,
                    "image_url": f"frames/{frames_dir}/frame_{i}.png"
                })
                i += 1

        return frames

    @staticmethod
    def extract_frames(video_path, video_dir):
        os.makedirs(video_dir, exist_ok=True)
        subprocess.Popen([
            "ffmpeg", "-i", video_path,
            "-frame_pts", "true",
            f"{video_dir}/frame_%d.png"
        ], stderr=subprocess.PIPE, start_new_session=True)


class ExampleVideosView(APIView):
    def get(self, request):
        print(request.GET)
        videos_dir = os.path.join(settings.BASE_DIR, "static", "videos")
        thumbs_dir = os.path.join(settings.BASE_DIR, "static", "thumbnails")
        os.makedirs(thumbs_dir, exist_ok=True)

        video_files = [
            f for f in os.listdir(videos_dir)
            if f.lower().endswith(".mp4")
        ]

        response_data = []
        for filename in video_files:
            video_path = os.path.join(videos_dir, filename)
            thumbnail_path = os.path.join(thumbs_dir, f"{os.path.splitext(filename)[0]}.png")
            thumbnail_url = f"{os.path.splitext(filename)[0]}.png"

            if not os.path.exists(thumbnail_path):
                subprocess.run([
                    "ffmpeg", "-i", video_path,
                    "-ss", "00:00:01.000",
                    "-frames:v", "1",
                    "-update", "1",
                    thumbnail_path
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            response_data.append({
                "name": filename,
                "thumbnail": thumbnail_url
            })

        return Response(response_data, status=status.HTTP_200_OK)

class ThumbnailView(APIView):
    def get(self, request, file_name):
        file_path = finders.find(os.path.join('thumbnails', file_name))
        if not file_path:
            return Response({"message": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'), content_type="image/png", status=status.HTTP_200_OK)

class FrameView(APIView):
    def get(self, request, dirname, frame_name):
        original = request.GET.get("original")
        if original:
            video = models.Video.objects.get(filename=dirname)
                # return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
            dirname = video.original.filename.split(".")[0]
            print(dirname)
        frame = finders.find(os.path.join('frames', dirname, frame_name))
        if not frame:
            return Response({"message": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            open(frame, 'rb'),
            content_type="image/png",
            status=status.HTTP_200_OK
        )

class MetricView(APIView):
    def get(self, request, video_name):
        try:
            video = models.Video.objects.get(filename=video_name)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        original = video.original
        if video.width * video.height > original.width * original.height:
            scale = f"{original.width}:{original.height}"
        else:
            scale = f"{video.width}:{video.height}"

        subprocess.run([
            "bash", "vmaf.sh",
            original.filename, video.filename, scale
        ])
        with open("result.json", "r") as f:
            metric_info = json.load(f)

        pooled_metrics = metric_info["pooled_metrics"]
        frame_metrics = metric_info["frames"]
        frame_metrics = {
            data["frameNum"]: data["metrics"] for data in frame_metrics
        }
        frames = models.FrameMetadata.objects.filter(video=video)
        for frame in frames:
            frame.vmaf_score = frame_metrics[frame.frame_number]["vmaf"]
            frame.ssim_score = frame_metrics[frame.frame_number]["float_ssim"]
            psnr_scores = {
                "psnr_y": frame_metrics[frame.frame_number]["psnr_y"],
                "psnr_cr": frame_metrics[frame.frame_number]["psnr_cr"],
                "psnr_cb": frame_metrics[frame.frame_number]["psnr_cb"],
            }
            frame.psnr_score = weighted_psnr_420(**psnr_scores)

        models.FrameMetadata.objects.bulk_update(
            frames,
            fields=["vmaf_score", "psnr_score", "ssim_score"]
        )

        vid_psnr_scores = {
            "psnr_y": pooled_metrics["psnr_y"]["mean"],
            "psnr_cr": pooled_metrics["psnr_cr"]["mean"],
            "psnr_cb": pooled_metrics["psnr_cb"]["mean"],
        }

        result = {
            "video_metrics": {
                "vmaf": pooled_metrics["vmaf"]["mean"],
                "ssim": pooled_metrics["float_ssim"]["mean"],
                "psnr": weighted_psnr_420(**vid_psnr_scores)
            }
        }
        return Response(camelize(result), status=status.HTTP_200_OK)

class FrameMetricView(APIView):
    def get(self, request, video_name, frame_num):
        try:
            frame = models.FrameMetadata.objects.get(
                video__filename=video_name,
                frame_number=frame_num
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        resp = {
            "psnr": frame.psnr_score,
            "ssim": frame.ssim_score,
            "vmaf": frame.vmaf_score,
        }
        return Response(resp, status=status.HTTP_200_OK)