from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
import os
import subprocess
import uuid

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
        output = os.path.join(settings.BASE_DIR, "static", "videos", output_filename)
        scale = f"{data['width']}:{data['height']}"
        subprocess.run([
            "ffmpeg",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}',
            "-b:v", data['bandwidth'],
            "-crf", str(data['crf']),
            output
        ])
        return Response({"compressedUrl": f"http://localhost:8000/video/{output_filename}/"}, status=status.HTTP_200_OK)
