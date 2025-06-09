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
import shutil

from utils.psnr import weighted_psnr_420
from . import models
from . import serializers

from utils.camel import camelize, decamelize

FRAMES_PER_BATCH = int(os.getenv('FRAMES_PER_BATCH'))

REDIS = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
)

class VideoView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        video_file = finders.find(os.path.join("videos", video.filename))

        if not video_file:
            video_file = finders.find(os.path.join('compressed_videos', video.filename))
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
            )
        video_url = finders.find(os.path.join("videos", original_video.filename))
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
                resp_status = status.HTTP_102_PROCESSING
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
                resp_status = status.HTTP_102_PROCESSING
            resp["video_id"] = video.id
            return Response(camelize(resp), status=resp_status)

        os.makedirs(compressed_dir, exist_ok=True)
        scale = f"{data['width']}:{data['height']}"
        resp["video_id"] = video.id

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

        file_name = os.path.basename(video_file)
        video_name = os.path.splitext(file_name)[0]
        frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", video_name)

        frames = models.FrameMetadata.objects.filter(video__id=video_id)
        if frames.exists():
            info = serializers.FrameSerializer(instance=frames, many=True).data

            return Response({"frames": info}, status=status.HTTP_200_OK)

        os.makedirs(frames_dir, exist_ok=True)

        info = self.get_frame_info(video_file, video)
        frames_serializer = serializers.CreateFramesSerializer(data={"frames": info})

        if not frames_serializer.is_valid():
            return Response(frames_serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            frames_serializer.save()
        except IntegrityError:
            frames = models.FrameMetadata.objects.filter(video__id=video_id)
            info = serializers.FrameSerializer(instance=frames, many=True).data
            return Response({"frames": info}, status=status.HTTP_200_OK)

        data = frames_serializer.validated_data['frames']

        self.extract_frames(video_file, frames_dir)

        return Response({"frames": data}, status=status.HTTP_200_OK)

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
                    "image_url": f"frames/{frames_dir}/frame_{i}.png",
                    "pkt_size": frame.get("pkt_size"),
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
            {"videoIds": videos.values("id", "filename")},
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
            total_frame_count = models.FrameMetadata.objects.filter(video__id=video_id).count()
            if frame_number < total_frame_count:
                return Response(status=status.HTTP_102_PROCESSING)

            return Response({"message": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            open(frame, 'rb'),
            content_type="image/png",
            status=status.HTTP_200_OK
        )

class MetricView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
            metrics = video.vmaf_mean, video.psnr_mean, video.ssim_mean
            if all(map(lambda m: m is not None, metrics)):
                return Response(camelize({"video_metrics": {
                    "VMAF": round(video.vmaf_mean, 2),
                    "SSIM": round(video.ssim_mean, 2),
                    "PSNR": round(video.psnr_mean, 2),
                }}), status=status.HTTP_200_OK)

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
                "VMAF": round(pooled_metrics["vmaf"]["mean"], 2),
                "SSIM": round(pooled_metrics["float_ssim"]["mean"], 2),
                "PSNR": round(weighted_psnr_420(**vid_psnr_scores), 2)
            }
        }

        video.psnr_mean = result["video_metrics"]["PSNR"]
        video.ssim_mean = result["video_metrics"]["SSIM"]
        video.vmaf_mean = result["video_metrics"]["VMAF"]
        video.save()

        return Response(camelize(result), status=status.HTTP_200_OK)

class FrameMetricView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            frame = models.FrameMetadata.objects.get(
                video__id=video_id,
                frame_number=frame_number
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        resp = {
            "VMAF": round(frame.vmaf_score, 2),
            "SSIM": round(frame.ssim_score, 2),
            "PSNR": round(frame.psnr_score, 2),
        }
        return Response(resp, status=status.HTTP_200_OK)