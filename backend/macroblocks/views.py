import json
import os
import subprocess
import re
import numpy as np
from django.conf import settings
from django.contrib.staticfiles import finders
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from mvextractor.videocap import VideoCap
from compressor.models import Video as VideoModel


class MacroBlockView(APIView):
    def post(self, request, video_id):
        try:
            video = VideoModel.objects.get(id=video_id)
        except VideoModel.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)


        video_path = finders.find(os.path.join("compressed_videos", video.filename))
        if not video_path:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        macroblocks_folder = os.path.join(settings.BASE_DIR, 'static', 'macroblocks')
        os.makedirs(macroblocks_folder, exist_ok=True)

        output_folder_types = os.path.join(macroblocks_folder, video.filename[:-4], 'types')
        os.makedirs(output_folder_types, exist_ok=True)

        all_info = os.path.join(output_folder_types, "all_info.txt")

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

        output_folder_vectors = os.path.join(macroblocks_folder, video.filename[:-4], 'vectors')
        os.makedirs(output_folder_vectors, exist_ok=True)

        self._extract_vectors(video_path, output_folder_vectors)
        self._split_blocks(all_info, output_folder_types)

        return Response({"message": "Macroblocks extraction started successfully."}, status=status.HTTP_200_OK)

    def _extract_vectors(self, video_path: str, output_folder: str):
        cap = VideoCap()
        cap.open(video_path)

        frame_index = 0

        while True:
            ret, frame, motion_vectors, frame_type = cap.read()
            if not ret:
                break

            np.save(os.path.join(output_folder, f"frame_{frame_index:03d}_vectors.npy"), motion_vectors)
            frame_index += 1

        cap.release()


    def _split_blocks(self, log_path: str, output_folder: str):
        start_marker = re.compile(r'New frame, type:')
        end_marker = re.compile(
            r'(nal_unit_type:)|(Decoder thread received EOF packet)|(Decoder returned EOF)'
        )

        valid_line = re.compile(r'^\[h264\s@[^\]]*\]\s+\d+\s+\S')

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
                    if valid_line.match(line):
                        buffer.append(line)

                    if end_marker.search(line):
                        buffer.append(line)
                        out_path = os.path.join(output_folder, f"block_{counter:03d}.txt")
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            out_f.writelines(buffer)
                        buffer = []
                        capturing = False
                        counter += 1

        if capturing and buffer:
            out_path = os.path.join(output_folder, f"block_{counter:03d}.txt")
            with open(out_path, 'w', encoding='utf-8') as out_f:
                out_f.writelines(buffer)


class MacroBlockGridView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = VideoModel.objects.get(id=video_id)
        except VideoModel.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        video_name = os.path.splitext(video.filename)[0]

        vectors_file_path = os.path.join(
            settings.BASE_DIR, 'static', 'macroblocks', video_name, 'vectors',
            f"frame_{int(frame_number):03d}_vectors.npy"
        )

        blocks_file_path = os.path.join(
            settings.BASE_DIR, 'static', 'macroblocks', video_name, 'types', f"block_{int(frame_number):03d}.txt"
        )

        if not os.path.exists(blocks_file_path):
            return Response({"message": "Blocks file not found"}, status=status.HTTP_404_NOT_FOUND)

        block_types_grid = self.parse_blocks_file(blocks_file_path)

        vectors_dict = {}
        if os.path.exists(vectors_file_path):
            motion_vectors = np.load(vectors_file_path, allow_pickle=True)
            for mv in motion_vectors:
                dst_x = int(mv[5])
                dst_y = int(mv[6])
                grid_x = dst_x // 16
                grid_y = dst_y // 16
                key = (grid_x, grid_y)
                if key not in vectors_dict:
                    vectors_dict[key] = []
                vectors_dict[key].append(mv)

        grid_blocks = []

        for row_idx, row in enumerate(block_types_grid):
            for col_idx, symbol in enumerate(row):
                grid_x = col_idx
                grid_y = row_idx

                base_x = grid_x * 16 + 8
                base_y = grid_y * 16 + 8

                block_type = self.get_block_type_from_symbol(symbol)

                #todo sprawdzić duplikaty typów X
                key = (grid_x, grid_y)
                if key in vectors_dict:
                    for mv in vectors_dict[key]:
                        grid_blocks.append({
                            "x": int(mv[5]),
                            "y": int(mv[6]),
                            "width": int(mv[1]),
                            "height": int(mv[2]),
                            "src_x": int(mv[3]),
                            "src_y": int(mv[4]),
                            "type": block_type,
                            "ftype": symbol,
                            "source": int(mv[0])
                        })
                else:
                    grid_blocks.append({
                        "x": base_x,
                        "y": base_y,
                        "width": 16,
                        "height": 16,
                        "src_x": base_x,
                        "src_y": base_y,
                        "type": block_type,
                        "ftype": symbol,
                        "source": 0
                    })

        return Response({
            "frameNumber": int(frame_number),
            "blocks": grid_blocks
        }, status=status.HTTP_200_OK)

    def parse_blocks_file(self, file_path):
        symbols_result = []

        with open(file_path, 'r') as f:
            for line in f:
                if '[h264 @' not in line:
                    continue

                parts = line.split(']', 1)
                if len(parts) < 2:
                    continue

                tokens = parts[1].strip().split()

                if not tokens or not tokens[0].isdigit():
                    continue

                if len(tokens) > 1 and tokens[1].isdigit():
                    continue

                symbols = tokens[1:]
                if symbols:
                    symbols_result.append(symbols)

        return symbols_result

    def get_block_type_from_symbol(self, symbol):
        type_mapping = {
            'S': 'skip',
            's': 'skip',
            'I': 'intra',
            'i': 'intra',
            'D': 'direct',
            'd': 'direct'
        }

        base_symbol = symbol[0]
        return type_mapping.get(base_symbol, 'inter')

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