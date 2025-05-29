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
        video_name = os.path.splitext(filename)[0]
        output_url = f"/static/macroblocks/{video_name}"

        return Response(
            {
                "message": "Macroblock blocks extracted",
                "output_folder": output_url
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

class MacroBlockDetailsView(APIView):
    def get(self, request):
        file_name = request.GET.get('fileName')
        frame_number = request.GET.get('frameNumber')

        if not file_name or frame_number is None:
            return Response(
                {"message": "Missing fileName or frameNumber parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            frame_number = int(frame_number)
        except ValueError:
            return Response({"message": "Invalid frameNumber"}, status=status.HTTP_400_BAD_REQUEST)

        block_file_path = os.path.join(
            settings.BASE_DIR, 'static', 'macroblocks', file_name[:-4], f"block_{frame_number:03d}.txt"
        )

        if not os.path.exists(block_file_path):
            return Response({"message": "Frame file not found"}, status=status.HTTP_404_NOT_FOUND)

        macroblocks = []
        macroblock_size = 16

        with open(block_file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()[2:]
            for line in lines:
                match = re.match(r'^\[.*?\]\s+(\d+)\s+((?:\S+\s*)+)$', line)
                if match:
                    y_block = int(match.group(1))
                    values = match.group(2).split()

                    for i, block_type in enumerate(values):
                        x_px = i * macroblock_size
                        y_px = y_block
                        data = {
                            "x": x_px,
                            "y": y_px,
                        }
                        data.update(self.interpret_macroblock_symbol(block_type))
                        macroblocks.append(data)

        return Response({
            "frameNumber": frame_number,
            "macroblocks": macroblocks
        }, status=status.HTTP_200_OK)

    def interpret_macroblock_symbol(self, symbol):
        prediction = 'unknown'
        segmentation = '16x16'
        interlaced = 'no'

        if 'S' in symbol:
            prediction = 'skipped'
        elif 'D' in symbol or 'd' in symbol:
            prediction = 'direct'
        elif '>' in symbol and '<' in symbol:
            prediction = 'bidirectional predicted'
        elif '>' in symbol:
            prediction = 'forward predicted'
        elif '<' in symbol:
            prediction = 'backward predicted'
        elif 'X' in symbol:
            prediction = 'bidirectional predicted'
        elif 'i' in symbol or 'I' in symbol:
            prediction = 'intra-coded'
        elif 'A' in symbol:
            prediction = 'intra 16x16'

        if '+' in symbol:
            segmentation = '8x8'
        elif '-' in symbol:
            segmentation = '16x8'
        elif '|' in symbol:
            segmentation = '8x16'

        if '=' in symbol:
            interlaced = 'yes'

        return {
            'symbol': symbol,
            'prediction': prediction,
            'segmentation': segmentation,
            'interlaced': interlaced
        }