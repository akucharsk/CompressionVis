import os
import subprocess
import re
from django.conf import settings
from django.contrib.staticfiles import finders
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class MacroBlockView(APIView):
    def get(self, request):
        filename = request.GET.get('fileName')

        if not filename:
            return Response({"message": "Video file name not provided"}, status=status.HTTP_400_BAD_REQUEST)

        video_path = finders.find(os.path.join("compressed_videos", filename))
        if not video_path:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        macroblocks_folder = os.path.join(settings.BASE_DIR, 'static', 'macroblocks')
        os.makedirs(macroblocks_folder, exist_ok=True)

        output_folder = os.path.join(macroblocks_folder, filename[:-4])
        os.makedirs(output_folder, exist_ok=True)

        all_info = os.path.join(output_folder, "all_info.txt")

        try:
            with open(all_info, 'w') as file:
                subprocess.run(
                    [
                        "ffmpeg",
                        "-threads", "1",
                        "-debug", "mb_type",
                        "-i", video_path,
                        "-f", "null",
                        "-"
                    ],
                    stderr=file,
                    text=True,
                    check=True
                )
        except subprocess.CalledProcessError as e:
            return Response({"message": f"FFmpeg error: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        self._split_blocks(all_info, output_folder)
        return Response(
            {
                "message": "Macroblock blocks extracted",
                "output_folder": output_folder
            },
            status=status.HTTP_200_OK
        )

    def _split_blocks(self, log_path: str, output_folder: str):
        start_marker = re.compile(r'New frame, type:')
        end_marker = re.compile(
            r'(nal_unit_type:)|(Decoder thread received EOF packet)|(Decoder returned EOF)'
        )

        counter = 0
        buffer = []
        capturing = False

        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f:
                if start_marker.search(line):
                    if capturing and buffer:
                        out_path = os.path.join(output_folder, f"block_{counter:03d}.txt")
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            out_f.writelines(buffer)
                        counter += 1
                    buffer = [line]
                    capturing = True
                    continue

                if capturing:
                    buffer.append(line)
                    if end_marker.search(line):
                        out_path = os.path.join(output_folder, f"block_{counter:03d}.txt")
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            out_f.writelines(buffer)
                        buffer = []
                        capturing = False
                        counter += 1

        if capturing and buffer:
            counter += 1
            out_path = os.path.join(output_folder, f"block_{counter:03d}.txt")
            with open(out_path, 'w', encoding='utf-8') as out_f:
                out_f.writelines(buffer)