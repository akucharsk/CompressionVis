import os
import re
import subprocess
import sys
import threading
import json
import queue
import time

import fcntl
import numpy as np
from django.conf import settings
from django.contrib.staticfiles import finders
from mvextractor.videocap import VideoCap

from compressor.models import Video


class MacroblocksExtractor:
    SENTINEL = ("__EOF__", None)

    def __init__(self, video: Video):
        self.video = video

    def _write_json_with_lock(self, path: str, obj):
        data = json.dumps(obj, indent=4).encode('utf-8')
        fd = os.open(path, os.O_RDWR | os.O_CREAT)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX)
            os.ftruncate(fd, 0)
            os.write(fd, data)
            os.fsync(fd)
        finally:
            try:
                fcntl.flock(fd, fcntl.LOCK_UN)
            except Exception:
                pass
            os.close(fd)

    def _ffmpeg_stream_and_parse(self, video_path: str, output_queue: queue.Queue):
        start_marker = re.compile(r'New frame, type:')
        end_marker = re.compile(r'(nal_unit_type:)|(Decoder thread received EOF packet)|(Decoder returned EOF)')
        valid_line = re.compile(r'^\[h264\s@[^\]]*\]\s+\d+\s+\S')

        proc = None
        try:
            proc = subprocess.Popen(
                [
                    "ffmpeg",
                    "-threads", "1",
                    "-debug", "mb_type",
                    "-i", video_path,
                    "-f", "null",
                    "-"
                ],
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            frame_buffer = []
            frame_index = 0

            for line in proc.stderr:
                if start_marker.search(line):
                    if frame_buffer:
                        grid = self._parse_blocks_from_lines(frame_buffer)
                        output_queue.put((frame_index, grid))
                        frame_index += 1
                    frame_buffer = [line]
                    continue

                if frame_buffer:
                    if valid_line.match(line):
                        frame_buffer.append(line)

                    if end_marker.search(line):
                        frame_buffer.append(line)
                        grid = self._parse_blocks_from_lines(frame_buffer)
                        output_queue.put((frame_index, grid))
                        frame_index += 1
                        frame_buffer = []

            if frame_buffer:
                grid = self._parse_blocks_from_lines(frame_buffer)
                output_queue.put((frame_index, grid))
                frame_index += 1

            if proc:
                proc.wait()

        except Exception as e:
            print("FFmpeg parser error:", e)
            sys.stdout.flush()
        finally:
            try:
                output_queue.put(self.SENTINEL)
            except Exception:
                pass
            if proc:
                try:
                    proc.stderr.close()
                except Exception:
                    pass

    def _parse_blocks_from_lines(self, lines):
        symbols_result = []

        for line in lines:
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

    def _get_block_type_from_symbol(self, symbol):
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

    def _process_frame(self, block_types_grid, motion_vectors):
        vectors_dict = {}
        for mv in motion_vectors:
            dst_x, dst_y = int(mv[5]), int(mv[6])
            grid_x, grid_y = dst_x // 16, dst_y // 16
            vectors_dict.setdefault((grid_x, grid_y), {}).setdefault((dst_x, dst_y), []).append(mv)

        grid_blocks = []
        for row_idx, row in enumerate(block_types_grid):
            for col_idx, symbol in enumerate(row):
                grid_x, grid_y = col_idx, row_idx
                base_x, base_y = grid_x * 16 + 8, grid_y * 16 + 8
                block_type = self._get_block_type_from_symbol(symbol)
                block_data = {
                    "x": base_x,
                    "y": base_y,
                    "width": 16,
                    "height": 16,
                    "src_x": base_x,
                    "src_y": base_y,
                    "type": block_type,
                    "ftype": symbol,
                    "source": 0,
                    "more": False,
                    "src_x2": None,
                    "src_y2": None,
                    "source2": None
                }
                key = (grid_x, grid_y)
                if key not in vectors_dict:
                    grid_blocks.append(block_data)
                    continue

                sub_dict = vectors_dict[key]

                for mvs in sub_dict.values():
                    mv1 = mvs[0]
                    block_data.update({
                        "x": int(mv1[5]),
                        "y": int(mv1[6]),
                        "width": int(mv1[1]),
                        "height": int(mv1[2]),
                        "src_x": int(mv1[3]),
                        "src_y": int(mv1[4]),
                        "source": int(mv1[0]),
                        "more": len(mvs) > 1,
                        "src_x2": None,
                        "src_y2": None,
                        "source2": None
                    })
                    if len(mvs) > 1:
                        mv2 = mvs[1]
                        block_data.update({
                            "src_x2": int(mv2[3]),
                            "src_y2": int(mv2[4]),
                            "source2": int(mv2[0])
                        })

                    grid_blocks.append(block_data.copy())

        return grid_blocks

    def _extract_macroblocks(self):
        try:
            video_path = finders.find(os.path.join("compressed_videos", self.video.filename))

            macroblocks_folder = os.path.join(settings.BASE_DIR, 'static', 'macroblocks')
            output_folder = os.path.join(macroblocks_folder, self.video.filename[:-4])

            os.makedirs(output_folder, exist_ok=True)

            q = queue.Queue(maxsize=16)
            producer_thread = threading.Thread(
                target=self._ffmpeg_stream_and_parse,
                args=(video_path, q),
                daemon=True
            )
            producer_thread.start()

            cap = VideoCap()
            cap.open(video_path)

            frame_number = 0
            finished = False

            while True:
                ret, frame, motion_vectors, frame_type = cap.read()
                if not ret:
                    break

                item = q.get()
                if item == self.SENTINEL:
                    block_types_grid = []
                    finished = True
                else:
                    prod_frame_index, block_types_grid = item
                    if prod_frame_index != frame_number:
                        print(f"Warning: frame index mismatch producer {prod_frame_index} != consumer {frame_number}")
                        sys.stdout.flush()

                grid_blocks = self._process_frame(block_types_grid, motion_vectors)

                output_file = os.path.join(output_folder, f"frame_{frame_number:03d}_macroblocks_data.json")
                self._write_json_with_lock(output_file, grid_blocks)

                frame_number += 1

                if finished and q.empty():
                    break

            cap.release()

            try:
                producer_thread.join(timeout=5)
            except Exception:
                pass

            self.video.macroblocks_extraction_completed = True

        except Exception as e:
            print("Extraction error:", e)
            sys.stdout.flush()
        finally:
            self.video.macroblocks_extraction_in_progress = False
            self.video.save()

    def start_extraction_job(self):
        self.video.macroblocks_extraction_in_progress = True
        self.video.save()
        thread = threading.Thread(target=self._extract_macroblocks)
        thread.start()
