from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
import os
import subprocess
import json
from threading import Lock

from . import serializers

FRAMES_PER_BATCH = int(os.getenv('FRAMES_PER_BATCH'))

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

        serializer = serializers.CompressSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        output_filename = f"b{data['bandwidth']}r{data['resolution']}cr{data['crf']}{filename}"
        output = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")

        if os.path.exists(os.path.join(compressed_dir, output_filename)):
            return Response({"compressedFilename": output_filename}, status=status.HTTP_200_OK)

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
        return Response({"compressedFilename": output_filename}, status=status.HTTP_200_OK)

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

        info_file_path = os.path.join(frames_dir, "info.json")

        if os.path.exists(info_file_path):
            data = request.GET
            start = int(data.get('start', 0))
            end = start + FRAMES_PER_BATCH

            with open(info_file_path) as f:
                info = json.load(f)['frames']

            frames = info[start:end]
            for frame in frames:
                frame_number = frame['frame_number']
                frame['image_url'] = f"/static/frames/{video_name}/frame_{frame_number}.png"

            resp = {"frames": frames}
            return Response(resp, status=status.HTTP_200_OK)

        os.makedirs(frames_dir, exist_ok=True)

        info = self.get_frame_info(video_file)
        with open(info_file_path, 'w') as f:
            json.dump({"frames": info}, f)

        peak = min(FRAMES_PER_BATCH, len(info))
        self.extract_frames(video_file, frames_dir)

        batch = info[:peak]
        for frame in batch:
            frame_number = frame['frame_number']
            frame['image_url'] = f"/static/frames/{video_name}/frame_{frame_number}.png"

        target = os.path.join(frames_dir, f'frame_{peak - 1}.png')
        while not os.path.exists(target):
            pass

        return Response({"frames": batch}, status=status.HTTP_200_OK)

    @staticmethod
    def get_frame_info(video_path):
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

    @staticmethod
    def extract_frames(video_path, video_dir):
        os.makedirs(video_dir, exist_ok=True)
        subprocess.Popen([
            "ffmpeg", "-i", video_path,
            "-frame_pts", "true",
            f"{video_dir}/frame_%d.png"
        ])

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
