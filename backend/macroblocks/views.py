import os
import json
import subprocess
import sys

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
    def _get_subpixel_crop(self, image, center_x, center_y, width, height):
        if image is None:
            return None
        return cv2.getRectSubPix(image, (width, height), (float(center_x), float(center_y)))

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

    def _get_block_b64(self, image, block, x_key="x", y_key="y"):
        crop = self._get_subpixel_crop(image, block[x_key], block[y_key], block["width"], block["height"])
        return self._to_base64(crop)

    def _get_frame(self, video_name, frame_number):
        frame_location = finders.find(os.path.join("frames", video_name, f"frame_{frame_number}.png"))
        if not frame_location:
            return None
        return cv2.imread(frame_location)

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

        width = block["width"]
        height = block["height"]

        current_frame = self._get_frame(video_name, frame_number)
        if current_frame is None:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        response_payload = {
            "current": self._get_block_b64(current_frame, block)
        }

        original_video_obj = VideoModel.objects.get(id=video.original_id)
        original_video_name = original_video_obj.original_filename[:-4] + f"_{video.width}x{video.height}"

        curr_original_frame = self._get_frame(original_video_name, frame_number)
        curr_original_block_raw = None

        if curr_original_frame is not None:
            response_payload["original"] = self._get_block_b64(curr_original_frame, block)
            curr_original_block_raw = self._get_subpixel_crop(curr_original_frame, block["x"], block["y"], width, height)

        prev_reference_num, next_reference_num = None, None

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

        prev_diff = None
        if prev_reference_num is not None:
            prev_frame_rgb = self._get_frame(video_name, prev_reference_num)

            if prev_frame_rgb is not None:
                response_payload["prev"] = self._get_block_b64(prev_frame_rgb, block, prev_keys[0], prev_keys[1])
                response_payload["prev_not_moved"] = self._get_block_b64(prev_frame_rgb, block)

                prev_raw_moved_block = self._get_subpixel_crop(prev_frame_rgb, block[prev_keys[0]], block[prev_keys[1]], width, height)
                prev_raw_not_moved_block = self._get_subpixel_crop(prev_frame_rgb, block["x"], block["y"], width, height)
                a = block["x"]
                b = block["y"]
                print(f"{block[prev_keys[0]]} -> {block[prev_keys[1]]} ; {a} -> {b}")
                sys.stdout.flush()

                if curr_original_block_raw is not None and prev_raw_moved_block is not None \
                  and curr_original_block_raw.shape == prev_raw_moved_block.shape:
                    prev_diff = cv2.absdiff(curr_original_block_raw, prev_raw_moved_block)
                    response_payload["prev_diff"] = self._to_base64(prev_diff)

                if curr_original_block_raw is not None and prev_raw_not_moved_block is not None \
                  and curr_original_block_raw.shape == prev_raw_not_moved_block.shape:
                    not_moved_diff = cv2.absdiff(curr_original_block_raw, prev_raw_not_moved_block)
                    response_payload["prev_not_moved_diff"] = self._to_base64(not_moved_diff)

        next_diff = None
        if next_reference_num is not None:
            next_frame_rgb = self._get_frame(video_name, next_reference_num)

            if next_frame_rgb is not None:
                response_payload["next"] = self._get_block_b64(next_frame_rgb, block, next_keys[0], next_keys[1])
                response_payload["next_not_moved"] = self._get_block_b64(next_frame_rgb, block)

                next_raw_moved_block = self._get_subpixel_crop(next_frame_rgb, block[next_keys[0]], block[next_keys[1]], width, height)
                next_raw_not_moved_block = self._get_subpixel_crop(next_frame_rgb, block["x"], block["y"], width, height)

                if curr_original_block_raw is not None and next_raw_moved_block is not None \
                  and curr_original_block_raw.shape == next_raw_moved_block.shape:
                    next_diff = cv2.absdiff(curr_original_block_raw, next_raw_moved_block)
                    response_payload["next_diff"] = self._to_base64(next_diff)

                if curr_original_block_raw is not None and next_raw_not_moved_block is not None \
                  and curr_original_block_raw.shape == next_raw_not_moved_block.shape:
                    not_moved_diff = cv2.absdiff(curr_original_block_raw, next_raw_not_moved_block)
                    response_payload["next_not_moved_diff"] = self._to_base64(not_moved_diff)

        if curr_original_block_raw is not None and prev_diff is not None and next_diff is not None \
          and prev_diff.shape == next_diff.shape:
            blended = cv2.addWeighted(prev_diff, 0.5, next_diff, 0.5, 0)
            response_payload["interpolation"] = self._to_base64(blended)

        return Response(response_payload, status=status.HTTP_200_OK)