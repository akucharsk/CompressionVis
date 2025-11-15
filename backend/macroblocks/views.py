import os
import json

import fcntl
from django.contrib.staticfiles import finders
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from compressor.models import Video as VideoModel


class MacroBlockView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = VideoModel.objects.get(id=video_id)
        except VideoModel.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        video_name = os.path.splitext(video.filename)[0]

        macroblocks_file = finders.find(
            os.path.join(
                'macroblocks',
                video_name,
                f"frame_{frame_number:03d}_macroblocks_data.json"
            )
        )

        if not macroblocks_file:
            if video.macroblocks_extraction_in_progress:
                return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

            if video.macroblocks_extraction_completed:
                return Response(
                    {"message": "Macroblocks extraction completed but files are missing."},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        try:
            data = self._try_load_json_nonblocking(macroblocks_file)
        except Exception:
            return Response({"message": "error loading macroblocks"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if data is None:
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        return Response({"blocks": data}, status=status.HTTP_200_OK)


    def _try_load_json_nonblocking(self, path: str):
        if not os.path.exists(path):
            raise FileNotFoundError

        fd = os.open(path, os.O_RDONLY)
        try:
            try:
                fcntl.flock(fd, fcntl.LOCK_SH | fcntl.LOCK_NB)
            except BlockingIOError:
                os.close(fd)
                return None

            with os.fdopen(fd, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        except Exception:
            try:
                os.close(fd)
            except Exception:
                pass
            raise