from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
import os
import subprocess
import uuid
import json

from . import serializers

class VideoView(APIView):
    def get(self, request, file_name):
        video_file = finders.find(os.path.join("videos", file_name))

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

import ffmpeg
class CompressionView(APIView):
    def post(self, request):
        filename = request.data.get('fileName')

        if not filename:
            return Response({"message": "Video file name not provided"}, status=status.HTTP_400_BAD_REQUEST)
        video_url = finders.find(os.path.join("videos", filename))
        if not video_url:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.CompressSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        output_filename = f"b{data['bandwidth']}r{data['resolution']}cr{data['crf']}{filename}"
        output = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")
        os.makedirs(compressed_dir, exist_ok=True)
        scale = f"{data['width']}:{data['height']}"
        subprocess.run([
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}',
            "-b:v", data['bandwidth'],
            "-crf", str(data['crf']),
            output
        ])
        return Response({"compressedUrl": f"http://localhost:8000/static/compressed_videos/{output_filename}/"}, status=status.HTTP_200_OK)

class CompressionFramesView(APIView):
    def get(self, request, file_name):
        video_file = finders.find(os.path.join("../static/compressed_videos", file_name))
        if not video_file:
            video_file = finders.find(os.path.join("../static/videos", file_name))

        if not video_file:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        frames = self.get_frames_with_images(video_file, os.path.join(settings.BASE_DIR, "static", "frames"))

        return Response(frames, status=status.HTTP_200_OK)


    def get_frame_info(self, video_path):
        result = subprocess.run([
            "ffprobe", "-show_frames", "-select_streams", "v", "-print_format", "json", video_path
        ], capture_output=True, text=True)

        data = json.loads(result.stdout)

        frames = []
        i = 0
        for frame in data.get("frames", []):
            pict_type = frame.get("pict_type")
            if pict_type in ["I", "P", "B"]:
                frames.append({
                    "frame_number": i,
                    "type": pict_type,
                    "pts_time": frame.get("pts_time")
                })
                i += 1

        return frames


    def extract_frames(self, video_path, dir):
        os.makedirs(dir, exist_ok=True)
        subprocess.run([
            "ffmpeg", "-i", video_path, "-fps_mode", "passthrough", "-frame_pts", "true", f"{dir}/frame_%d.png"
        ])

    def get_frames_with_images(self, video_file, base_frames_dir):
        file_name = os.path.basename(video_file)
        video_name = os.path.splitext(file_name)[0]

        output_dir = os.path.join(base_frames_dir, video_name)
        os.makedirs(output_dir, exist_ok=True)

        info = self.get_frame_info(video_file)
        self.extract_frames(video_file, output_dir)

        for frame in info:
            frame_number = frame["frame_number"]
            frame["image_url"] = f"/static/frames/{video_name}/frame_{frame_number}.png"

        return info

class ExampleVideosView(APIView):
    def get(self, request):
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
            thumbnail_url = f"/static/thumbnails/{os.path.splitext(filename)[0]}.png"

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
                "url": f"/static/videos/{filename}",
                "thumbnail": thumbnail_url
            })

        return Response(response_data, status=status.HTTP_200_OK)