import os
import json
import subprocess

import cv2
import base64
import numpy as np

import fcntl
from django.contrib.staticfiles import finders
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from compressor.models import Video as VideoModel, FrameMetadata


def try_load_json_nonblocking(path: str):
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
            data = try_load_json_nonblocking(macroblocks_file)
        except Exception:
            return Response({"message": "error loading macroblocks"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if data is None:
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        return Response({"blocks": data}, status=status.HTTP_200_OK)

class MacroblockHistoryView(APIView):
    def _get_block(self, image, block, x_key="x", y_key="y"):
        x = block[x_key]
        y = block[y_key]
        width = block["width"]
        height = block["height"]
        w2, h2 = width // 2, height // 2

        if image is None:
            return None

        cropped_image = image[y-h2:y+h2, x-w2:x+w2]

        if cropped_image.size == 0:
            return None

        success, png_data = cv2.imencode(".png", cropped_image)

        if not success:
            return None

        b64_data = base64.b64encode(png_data).decode("utf-8")
        return f"data:image/png;base64,{b64_data}"

    def _get_decoded_frame(self, video_name, frame_number):
        frame_location = finders.find(os.path.join("frames", video_name, f"frame_{frame_number}.png"))
        if not frame_location:
            return None
        return cv2.imread(frame_location)

    def _to_base64(self, image):
        if image is None:
            return None

        if image.size == 0:
            return None

        success, png_data = cv2.imencode(".png", image)
        if not success:
            return None
        b64_data = base64.b64encode(png_data).decode("utf-8")
        return f"data:image/png;base64,{b64_data}"

    def _get_frame_from_y4m(self, video_path, frame_number, target_width, target_height):
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            return None

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            return None

        current_height, current_width, _ = frame.shape

        if current_width == target_width and current_height == target_height:
            return frame

        command = [
            'ffmpeg',
            '-f', 'rawvideo',
            '-vcodec', 'rawvideo',
            '-s', f'{current_width}x{current_height}',
            '-pix_fmt', 'bgr24',
            '-i', '-',
            '-vf', f'scale={target_width}:{target_height}',
            '-f', 'image2pipe',
            '-pix_fmt', 'bgr24',
            '-vcodec', 'rawvideo',
            '-'
        ]

        try:
            pipe = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                    bufsize=10 ** 8)
            raw_image, _ = pipe.communicate(input=frame.tobytes())

            if not raw_image:
                return None

            image = np.frombuffer(raw_image, dtype='uint8')
            image = image.reshape((target_height, target_width, 3))
            return image
        except Exception:
            return None

    def get_reference_frame_number(self, video, current_frame_num, offset):
        if offset == 0:
            return None

        limit = abs(offset)

        target_types = ['I', 'P']

        if offset < 0:
            frames = FrameMetadata.objects.filter(
                video=video,
                frame_number__lt=current_frame_num,
                type__in=target_types
            ).order_by('-frame_number')
        else:
            frames = FrameMetadata.objects.filter(
                video=video,
                frame_number__gt=current_frame_num,
                type__in=target_types
            ).order_by('frame_number')

        if len(frames) >= limit:
            return frames[limit - 1].frame_number

        return None

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
            return Response({"message": "Macroblocks file not found"}, status=status.HTTP_404_NOT_FOUND)

        x = request.GET.get("x")
        y = request.GET.get("y")

        if not x or not y:
            return Response({"message": "x and y query parameters are required"}, status=status.HTTP_400_BAD_REQUEST)

        x = int(x)
        y = int(y)

        data: list[dict] | None = try_load_json_nonblocking(macroblocks_file)
        if data is None:
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        block = None
        for item in data:
            if item["x"] == x and item["y"] == y:
                block = item
                break

        if not block:
            return Response({"message": "Block not found"}, status=status.HTTP_404_NOT_FOUND)

        frame_location = finders.find(os.path.join("frames", video_name, f"frame_{frame_number}.png"))
        frame_rgb = cv2.imread(frame_location)
        if frame_rgb is None:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        response_payload = {
            "result": self._get_block(frame_rgb, block)
        }

        original_video_obj = VideoModel.objects.get(id=video.original_id)
        original_video_path = finders.find(os.path.join('original_videos', original_video_obj.original_filename))

        curr_original_frame = self._get_frame_from_y4m(original_video_path, frame_number, video.width, video.height)
        curr_original_block_raw = None

        w2, h2 = block["width"] // 2, block["height"] // 2

        if curr_original_frame is not None:
            response_payload["original"] = self._get_block(curr_original_frame, block)
            curr_original_block_raw = curr_original_frame[y - h2:y + h2, x - w2:x + w2]


        prev_reference_num, next_reference_num = None, None
        prev_raw_block, next_raw_block = None, None

        prev_keys = ("src_x", "src_y")
        next_keys = ("src_x", "src_y")

        src = block.get("source") or 0
        src2 = block.get("source2") or 0

        if src < 0:
            prev_reference_num = self.get_reference_frame_number(video, frame_number, src)
            prev_keys = ("src_x", "src_y")
        elif src > 0:
            next_reference_num = self.get_reference_frame_number(video, frame_number, src)
            next_keys = ("src_x", "src_y")

        if src2 < 0:
            prev_reference_num = self.get_reference_frame_number(video, frame_number, src2)
            prev_keys = ("src_x2", "src_y2")
        elif src2 > 0:
            next_reference_num = self.get_reference_frame_number(video, frame_number, src2)
            next_keys = ("src_x2", "src_y2")

        if prev_reference_num is not None:
            prev_frame_rgb = self._get_decoded_frame(video_name, prev_reference_num)

            if prev_frame_rgb is not None:
                prev_moved_macroblock = self._get_block(prev_frame_rgb, block, prev_keys[0], prev_keys[1])
                response_payload["prev"] = prev_moved_macroblock

                px, py = block[prev_keys[0]], block[prev_keys[1]]
                prev_raw_block = prev_frame_rgb[py - h2:py + h2, px - w2:px + w2]

                if curr_original_block_raw is not None and prev_raw_block is not None and curr_original_block_raw.shape == prev_raw_block.shape:
                    diff = cv2.absdiff(curr_original_block_raw, prev_raw_block)
                    response_payload["prev_diff"] = self._to_base64(diff)

        if next_reference_num is not None:
            next_frame_rgb = self._get_decoded_frame(video_name, next_reference_num)

            if next_frame_rgb is not None:
                next_moved_macroblock = self._get_block(next_frame_rgb, block, next_keys[0], next_keys[1])
                response_payload["next"] = next_moved_macroblock

                nx, ny = block[next_keys[0]], block[next_keys[1]]
                next_raw_block = next_frame_rgb[ny - h2:ny + h2, nx - w2:nx + w2]

                if curr_original_block_raw is not None and next_raw_block is not None and curr_original_block_raw.shape == next_raw_block.shape:
                    diff = cv2.absdiff(curr_original_block_raw, next_raw_block)
                    response_payload["next_diff"] = self._to_base64(diff)

        if prev_raw_block is not None and next_raw_block is not None and prev_raw_block.shape == next_raw_block.shape:
            interpolated = cv2.addWeighted(prev_raw_block, 0.5, next_raw_block, 0.5, 0)
            response_payload["interpolated"] = self._to_base64(interpolated)

        return Response(response_payload, status=status.HTTP_200_OK)