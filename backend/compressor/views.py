import base64

import cv2
import json
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings

from django.db import IntegrityError

import os
import subprocess
import shutil
from macroblocks.macroblocks_extractor import MacroblocksExtractor
from . import models
from . import serializers
from .frames_extractor import FramesExtractor

from utils.camel import camelize, decamelize
from .metrics_extractor import MetricsExtractor

FRAMES_PER_BATCH = int(os.getenv('FRAMES_PER_BATCH'))

class VideoView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        video_file = finders.find(os.path.join("videos", video.filename))

        if not video_file:
            video_file = finders.find(os.path.join("compressed_videos", video.filename))

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
            content_type="video/mp4"
        )
        response["Content-Length"] = serializer.validated_data["Content-Length"]
        response["Content-Range"] = serializer.validated_data["Content-Range"]
        response["Accept-Ranges"] = "bytes"
        return response

    def delete(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        dot_idx = video.filename.find(".")
        if dot_idx == -1:
            return Response({"message": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)
        frames_dirname = video.filename[:dot_idx]
        video_path = finders.find(os.path.join("compressed_videos", video.filename))
        frames_path = finders.find(os.path.join("frames", frames_dirname))

        os.remove(video_path)
        shutil.rmtree(frames_path)
        models.Video.objects.filter(id=video_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class BaseCompressionView(APIView):
    def get_original_video(self, video_id):
        try:
            return models.Video.objects.get(id=video_id, original=None)
        except models.Video.DoesNotExist:
            return None

    def get_video_path(self, original_video):
        video_url = finders.find(os.path.join("original_videos", original_video.original_filename))
        return video_url if video_url else None

    def get_or_create_video(self, serializer):
        filename = serializer.validated_data["filename"]
        try:
            video = models.Video.objects.get(filename=filename)
            return video, False
        except models.Video.DoesNotExist:
            try:
                video = serializer.save()
                return video, True
            except IntegrityError:
                video = models.Video.objects.get(filename=filename)
                return video, False

    def prepare_response(self, video, filename):
        resp = {
            "compressed_filename": filename,
            "is_compressed": video.is_compressed,
            "video_id": video.id
        }

        if video.is_compressed and video.size:
            resp["resulting_size"] = round(video.size / (1024 * 1024), 2)

        response_status = status.HTTP_200_OK if video.is_compressed else status.HTTP_202_ACCEPTED
        return Response(camelize(resp), status=response_status)

    def run_post_compression_jobs(self, video):
        frames_extractor = FramesExtractor(video)
        frames_extractor.start_extraction_job()

        metrics_extractor = MetricsExtractor(video)
        metrics_extractor.start_extraction_job()

        macroblocks_extractor = MacroblocksExtractor(video)
        macroblocks_extractor.start_extraction_job()

    def finalize_video(self, video, output_path, original_video):
        try:
            file_size = os.path.getsize(output_path)
            video.is_compressed = True
            video.size = file_size
            video.save()
            return True
        except FileNotFoundError:
            return False

    def execute_compression(self, ffmpeg_command, video, output_path, output_filename, original_video):
        process = subprocess.Popen(ffmpeg_command)
        return_code = process.wait()

        if return_code != 0:
            return Response(
                {"message": "FFmpeg compression failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not self.finalize_video(video, output_path, original_video):
            return Response(
                {"message": "Couldn't access compressed file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        self.run_post_compression_jobs(video)
        return self.prepare_response(video, output_filename)

class CompressionView(BaseCompressionView):

    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")

        if not video_id:
            return Response(
                {"message": "Video id not provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        original_video = self.get_original_video(video_id)
        if not original_video:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = self.get_video_path(original_video)
        if not video_url:
            return Response(
                {"message": "Video not present in the file system. Please contact management!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = serializers.CompressSerializer(
            data=request.data,
            context={"original_video": original_video}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        output_filename = validated_data['filename']

        video, created = self.get_or_create_video(serializer)

        if not created:
            return self.prepare_response(video, output_filename)

        output = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")
        os.makedirs(compressed_dir, exist_ok=True)

        scale = f"{validated_data['width']}:{validated_data['height']}"
        gop_size = validated_data.get("gop_size")
        bf = validated_data.get("bf")

        if gop_size in ["default", 1, None]:
            gop_params = []
        else:
            gop_params = ["-g", str(gop_size), "-keyint_min", str(gop_size), "-sc_threshold", "0"]

        if bf == "default":
            bf_params = []
        else:
            bf_params = ["-bf", bf]

        if validated_data.get("bandwidth"):
            bitrate_param = ["-b:v", validated_data['bandwidth']]
        else:
            bitrate_param = ["-crf", str(validated_data['crf'])]

        ffmpeg_command = [
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-vf", f'scale={scale}:flags=lanczos',
            *bitrate_param,
            *gop_params,
            "-preset", validated_data['preset'],
            *bf_params,
            "-aq-mode", str(validated_data['aq_mode']),
            "-aq-strength", str(validated_data['aq_strength']),
            output
        ]

        return self.execute_compression(ffmpeg_command, video, output, output_filename, original_video)
    
class SizeCompressionView(BaseCompressionView):
    def post(self, request):
        data = decamelize(request.data)
        video_id = data.get("video_id")
        target_size = data.get("target_size")

        if not video_id or not target_size:
            return Response(
                {"message": "Video id and target size must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        original_video = self.get_original_video(video_id)
        if not original_video:
            return Response(
                {"message": f"Couldn't find uncompressed video with id {video_id}"},
                status=status.HTTP_404_NOT_FOUND
            )

        video_url = self.get_video_path(original_video)
        if not video_url:
            return Response(
                {"message": "Video not present in the file system. Please contact management!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        duration = self.get_video_duration(video_url)
        if duration is None:
            return Response(
                {"message": "Couldn't determine video duration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = serializers.SizeCompressionSerializer(
            data=data,
            context={ "original_video": original_video, "duration": duration }
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        output_filename = validated_data["filename"]
        video, created = self.get_or_create_video(serializer)

        if not created and video.is_compressed:
            return self.prepare_response(video, output_filename)

        output_path = os.path.join(settings.BASE_DIR, "static", "compressed_videos", output_filename)
        compressed_dir = os.path.join(settings.BASE_DIR, "static", "compressed_videos")
        os.makedirs(compressed_dir, exist_ok=True)

        ffmpeg_command = [
            "ffmpeg",
            "-y",
            "-i", video_url,
            "-c:v", "libx264",
            "-b:v", f"{validated_data['bandwidth']}k",
            output_path
        ]

        return self.execute_compression(ffmpeg_command, video, output_path, output_filename, original_video)

    @staticmethod
    def get_video_duration(video_path):
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", video_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            return float(result.stdout)
        except Exception:
            return None

class CompressionFramesView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        video_file = finders.find(os.path.join("compressed_videos", video.filename))
        if not video_file:
            video_file = finders.find(os.path.join("videos", video.filename))

        if not video_file:
            return Response({"message": "Video file not found"}, status=status.HTTP_404_NOT_FOUND)

        frames = models.FrameMetadata.objects.filter(video__id=video_id)
        video_name = os.path.splitext(video.filename)[0]
        extracted_count = len(os.listdir(finders.find(os.path.join("frames", video_name))))
        if not frames.exists() or extracted_count == 0:
            if video.frames_extraction_in_progress:
                return Response({ "message": "processing" }, status=status.HTTP_202_ACCEPTED)
            return Response({"message": "Frames extractor encountered an error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        info = serializers.FrameSerializer(instance=frames, many=True).data
        return Response({ "frames": info[:extracted_count], "total": len(info) }, status=status.HTTP_200_OK)

class ExampleVideosView(APIView):
    def get(self, request):
        videos_dir = os.path.join(settings.BASE_DIR, "static", "videos")
        thumbs_dir = os.path.join(settings.BASE_DIR, "static", "thumbnails")
        os.makedirs(thumbs_dir, exist_ok=True)

        videos = models.Video.objects.filter(original=None)

        for video in videos:
            video_path = os.path.join(videos_dir, video.filename)
            thumbnail_filename = f"{os.path.splitext(video.filename)[0]}.png"
            thumbnail_path = os.path.join(thumbs_dir, thumbnail_filename)

            if not os.path.exists(thumbnail_path):
                subprocess.run([
                    "ffmpeg", "-i", video_path,
                    "-ss", "00:00:01.000",
                    "-frames:v", "1",
                    "-update", "1",
                    thumbnail_path
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return Response(
            {"videoIds": videos.values("id", "title")},
            status=status.HTTP_200_OK
        )

class ThumbnailView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        thumbnail_filename = f"{os.path.splitext(video.filename)[0]}.png"
        file_path = finders.find(os.path.join('thumbnails', thumbnail_filename))
        if not file_path:
            return Response({"message": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(file_path, 'rb'), content_type="image/png", status=status.HTTP_200_OK)
    
class FrameStatusView(APIView):
    def get(self, request, video_id, frame_number):
        original = request.GET.get("original")
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if original:
            has_original = video.original

            if has_original:
                dirname = video.original.filename.split(".")[0]

            else:
                dirname = video.filename.split(".")[0]

            width = request.query_params.get('width')
            height = request.query_params.get('height')

            if width and height:
                dirname = f"{dirname}_{width}x{height}"
        else:
            dirname = video.filename.split(".")[0]

        frame = finders.find(os.path.join('frames', dirname, f"frame_{frame_number}.png"))
        if not frame:
            if video.frames_extraction_in_progress:
                return Response(
                    {"message": "processing"},
                    status=status.HTTP_202_ACCEPTED
                )

            if video.frames_extraction_completed:
                return Response(
                    {"message": "Frame not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(
                {"message": "processing"},
                status=status.HTTP_202_ACCEPTED
            )
        return Response({ "url": f"frames/{video_id}/{frame_number}" }, status=status.HTTP_200_OK)

class FrameView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        dirname = video.filename.split(".")[0]

        if video.original is None:
            width = request.query_params.get('width')
            height = request.query_params.get('height')

            if width and height:
                dirname = f"{dirname}_{width}x{height}"

        frame = finders.find(os.path.join('frames', dirname, f"frame_{frame_number}.png"))
        if not frame:
            if video.frames_extraction_in_progress:
                return Response(
                    {"message": "processing"},
                    status=status.HTTP_202_ACCEPTED
                )

            if video.frames_extraction_completed:
                return Response(
                    {"message": "Frame not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(
                {"message": "processing"},
                status=status.HTTP_202_ACCEPTED
            )
        return FileResponse(
            open(frame, 'rb'),
            content_type="image/png",
            status=status.HTTP_200_OK
        )

class MetricView(APIView):
    @staticmethod
    def wrap_metrics(metrics, fields=("psnr_mean", "ssim_mean", "vmaf_mean")):
        metric_scores = list(map(lambda field: getattr(metrics, field), fields))
        if all(metric_scores):
            [psnr, ssim, vmaf] = metric_scores
            return {
                "metrics": {
                    "VMAF": round(vmaf, 2),
                    "SSIM": round(ssim, 2),
                    "PSNR": round(psnr, 2),
                }
            }

        return None

    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "No metrics record created for this video"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        wrapped_metrics = self.wrap_metrics(metrics)
        if wrapped_metrics:
            return Response(wrapped_metrics, status=status.HTTP_200_OK)

        return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

class FrameMetricView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            frame = models.FrameMetadata.objects.get(
                video__id=video_id,
                frame_number=frame_number
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        resp = MetricView.wrap_metrics(frame, fields=("psnr_score", "ssim_score", "vmaf_score"))
        return Response(resp, status=status.HTTP_200_OK)

class AllFramesMetricsView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
            metrics = models.VideoMetrics.objects.get(video=video)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except models.VideoMetrics.DoesNotExist:
            return Response({"message": "No metrics record created for this video"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not MetricView.wrap_metrics(metrics):
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

        frames = models.FrameMetadata.objects.filter(video=video)
        frame_metrics = frames.values("psnr_score", "ssim_score", "vmaf_score")
        for metric in frame_metrics:
            for score in ["psnr_score", "ssim_score", "vmaf_score"]:
                name = score.split("_")[0]
                metric[name.upper()] = round(metric[score], 2)
                del metric[score]

        return Response({"metrics": frame_metrics}, status=status.HTTP_200_OK)

class SizeView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        if video.size is None:
            return Response({"message": "Size not available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"size": video.size}, status=status.HTTP_200_OK)

class VideoParameters(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        params = {
            "bandwidth": video.bandwidth,
            "resolution": f"{video.width}x{video.height}",
            "crf": video.crf,
            "gop_size": video.gop_size,
            "bf": video.bf,
            "aq_mode": video.aq_mode,
            "aq_strength": float(video.aq_strength) if video.aq_strength is not None else None,
            "preset": video.preset,
            "name": video.title,
            "size": video.size,
        }

        return Response(camelize(params), status=status.HTTP_200_OK)


class DifferenceView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        filename = video.filename
        if filename.endswith(".y4m"):
            folder_name = filename[:-4] + "_1280x720"
        else:
            folder_name = os.path.splitext(filename)[0] + "_1280x720"

        frames_path = finders.find(os.path.join("frames", folder_name))

        if not frames_path or not os.path.exists(frames_path):
            return Response({"count": 0}, status=status.HTTP_200_OK)

        count = len([name for name in os.listdir(frames_path) if os.path.isfile(os.path.join(frames_path, name))])
        return Response({"count": count}, status=status.HTTP_200_OK)


class DifferenceFrameView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        filename = video.filename
        if filename.endswith(".y4m"):
            base_name = filename[:-4]
            folder_name = base_name + "_1280x720"
        else:
            base_name = os.path.splitext(filename)[0]
            folder_name = base_name + "_1280x720"

        current_frame_path = finders.find(os.path.join("frames", folder_name, f"frame_{frame_number}.png"))
        if not current_frame_path:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        def encode_image(image_path_or_array, is_array=False):
            if is_array:
                _, buffer = cv2.imencode('.png', image_path_or_array)
                return base64.b64encode(buffer).decode('utf-8')
            else:
                with open(image_path_or_array, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode('utf-8')

        original_b64 = encode_image(current_frame_path, is_array=False)
        diff_prev_b64 = None
        diff_third_b64 = None

        if frame_number > 0:
            prev_frame_path = finders.find(os.path.join("frames", folder_name, f"frame_{frame_number - 1}.png"))

            if prev_frame_path:
                img_curr = cv2.imread(current_frame_path)
                img_prev = cv2.imread(prev_frame_path)

                if img_curr is not None and img_prev is not None:
                    diff = cv2.absdiff(img_curr, img_prev)
                    diff_prev_b64 = encode_image(diff, is_array=True)

                    json_path = os.path.join("static", "differences", base_name, f"frame_{frame_number:03d}.json")

                    if not os.path.exists(json_path):
                        return Response({"message": f"JSON file not found: {json_path}"},
                                        status=status.HTTP_404_NOT_FOUND)

                    with open(json_path, 'r') as f:
                        vectors = json.load(f)

                    final_diff = diff.copy()
                    loaded_refs = {-1: img_prev}

                    for v in vectors:
                        source_offset = v['source']
                        if source_offset == 0:
                            continue

                        if source_offset not in loaded_refs:
                            ref_idx = frame_number + source_offset
                            ref_path = finders.find(os.path.join("frames", folder_name, f"frame_{ref_idx}.png"))
                            if ref_path:
                                loaded_refs[source_offset] = cv2.imread(ref_path)
                            else:
                                loaded_refs[source_offset] = None

                        img_ref = loaded_refs[source_offset]
                        if img_ref is None:
                            continue

                        w, h = v['width'], v['height']
                        dst_x, dst_y = v['dst_x'], v['dst_y']
                        src_x, src_y = v['src_x'], v['src_y']

                        if (dst_y + h <= img_curr.shape[0] and dst_x + w <= img_curr.shape[1] and
                                src_y + h <= img_ref.shape[0] and src_x + w <= img_ref.shape[1]):
                            block_curr = img_curr[dst_y: dst_y + h, dst_x: dst_x + w]
                            block_ref = img_ref[src_y: src_y + h, src_x: src_x + w]
                            block_diff = cv2.absdiff(block_curr, block_ref)
                            final_diff[dst_y: dst_y + h, dst_x: dst_x + w] = block_diff

                    diff_third_b64 = encode_image(final_diff, is_array=True)

        return Response({
            "original_frame": original_b64,
            "diff_prev_frame": diff_prev_b64,
            "diff_third_frame": diff_third_b64
        }, status=status.HTTP_200_OK)