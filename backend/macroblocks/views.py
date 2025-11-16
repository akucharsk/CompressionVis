import os
import json
import cv2
import base64

import fcntl
from django.contrib.staticfiles import finders
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from compressor.models import Video as VideoModel

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
        cropped_image = image[y-h2:y+h2, x-w2:x+w2]
        success, png_data = cv2.imencode(".png", cropped_image)
        if not success:
            return None
        b64_data = base64.b64encode(png_data).decode("utf-8")
        return f"data:image/png;base64,{b64_data}"
    
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
        for block in data:
            if block["x"] == x and block["y"] == y:
                block = block
                break

        if not block:
            return Response({"message": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        
        frame_location = finders.find(os.path.join("frames", video_name, f"frame_{frame_number}.png"))
        frame = cv2.imread(frame_location)
        if frame is None:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)
        
        frame_rgb = frame
        result_macroblock = self._get_block(frame_rgb, block)
        
        response_payload = {
            "result": result_macroblock
        }
        
        prev_reference, next_reference = None, None
        src = block.get("source") or 0
        src2 = block.get("source2") or 0
        if src < 0:
            prev_reference = frame_number + src
        elif src > 0:
            next_reference = frame_number + src
        if src2 < 0:
            prev_reference = frame_number + src2
        elif src2 > 0:
            next_reference = frame_number + src2
        
        if prev_reference:
            prev_frame_location = finders.find(os.path.join("frames", video_name, f"frame_{prev_reference}.png"))
            prev_frame = cv2.imread(prev_frame_location)
            if prev_frame is None:
                return Response({"message": "Previous frame not found"}, status=status.HTTP_404_NOT_FOUND)
            prev_frame_rgb = prev_frame
            prev_result_macroblock = self._get_block(prev_frame_rgb, block)
            prev_moved_macroblock = self._get_block(prev_frame_rgb, block, "src_x", "src_y")
            response_payload["prev"] = prev_result_macroblock
            response_payload["prev_moved"] = prev_moved_macroblock
        if next_reference:
            next_frame_location = finders.find(os.path.join("frames", video_name, f"frame_{next_reference}.png"))
            next_frame = cv2.imread(next_frame_location)
            if next_frame is None:
                return Response({"message": "Next frame not found"}, status=status.HTTP_404_NOT_FOUND)
            next_frame_rgb = next_frame
            next_result_macroblock = self._get_block(next_frame_rgb, block)
            next_moved_macroblock = self._get_block(next_frame_rgb, block, "src_x", "src_y")
            response_payload["next"] = next_result_macroblock
            response_payload["next_moved"] = next_moved_macroblock
        return Response(response_payload, status=status.HTTP_200_OK)
