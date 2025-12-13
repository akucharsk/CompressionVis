from ntpath import isdir
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.http import FileResponse, StreamingHttpResponse
from django.contrib.staticfiles import finders
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import IntegrityError
from django.db.models import Q

import uuid
import os
import sys
import subprocess
import shutil
from macroblocks.macroblocks_extractor import MacroblocksExtractor
from . import models
from . import serializers
from . import tasks
from .frames_extractor import FramesExtractor

from macroblocks import tasks as macroblocks_tasks

from utils.camel import camelize, decamelize
from .metrics_extractor import MetricsExtractor
from celery import group, chain

import json
import zipfile
from io import BytesIO

from .permissions import IsSuperuser

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
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_superuser:
            return Response({"message": "Superuser cannot access questions"}, status=status.HTTP_403_FORBIDDEN)

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
        macroblocks_path = finders.find(os.path.join("macroblocks", frames_dirname))

        os.remove(video_path)
        if frames_path:
            shutil.rmtree(frames_path)
        if macroblocks_path:
            shutil.rmtree(macroblocks_path)
        video.delete()
        return Response({"message": "OK", "videoId": video_id}, status=status.HTTP_200_OK)

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

    def execute_compression(self, compression_input, video):
        video.frames_extraction_in_progress = True
        video.macroblocks_extraction_in_progress = True
        video.save()
        try:
            metrics = models.VideoMetrics.objects.create(video=video)
        except IntegrityError:
            metrics = models.VideoMetrics.objects.get(video=video)
        chain(
            tasks.compress_video.si(compression_input).set(queue="video"),
            group(
                tasks.extract_frames.si(video.id).set(queue="frames"),
                tasks.extract_metrics.si(video.id, metrics.id).set(queue="metrics"),
                macroblocks_tasks.extract_macroblocks.si(video.id).set(queue="macroblocks")
            )
        ).apply_async()
        return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)

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
            return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)

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
            "-vf", f'scale={scale}',
            *bitrate_param,
            *gop_params,
            "-preset", validated_data['preset'],
            *bf_params,
            "-aq-mode", str(validated_data['aq_mode']),
            "-aq-strength", str(validated_data['aq_strength']),
            output
        ]

        compression_input = {
            "ffmpeg_command": ffmpeg_command,
            "video_id": video.id,
            "output_path": output,
            "output_filename": output_filename,
        }
        return self.execute_compression(compression_input, video)
    
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
        duration = tasks.get_video_duration.apply_async(args=[video_url], queue="video").get()
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

        if not created:
            return Response({"videoId": video.id}, status=status.HTTP_202_ACCEPTED)
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

        compression_input = {
            "ffmpeg_command": ffmpeg_command,
            "video_id": video.id,
            "video_path": video_url,
            "output_path": output_path,
            "output_filename": output_filename,
        }

        return self.execute_compression(compression_input, video)

    @staticmethod
    def get_video_duration(video_path):
        try:
            result = subprocess.Popen(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", video_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            result, error = result.communicate()
            if error:
                raise Exception(error)
            return float(result.stdout)
        except Exception as e:
            print(f"Error getting video duration: {e}")
            sys.stdout.flush()
            return None

class CompressionFramesView(APIView):
    def get(self, request, video_id):
        try:
            video = models.Video.objects.get(id=video_id)
        except models.Video.DoesNotExist:
            return Response({"message": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        frames = models.FrameMetadata.objects.filter(video=video)
        video_name = os.path.splitext(video.filename)[0]
        frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", video_name)
        os.makedirs(frames_dir, exist_ok=True)
        extracted_count = len(os.listdir(frames_dir))
        if not frames.exists() or extracted_count == 0:
            if video.frames_extraction_in_progress:
                return Response({ "message": "processing" }, status=status.HTTP_202_ACCEPTED)
            print("FRAMES EXTRACTOR ENCOUNTERED AN ERROR", extracted_count, frames.exists())
            print(os.listdir(finders.find(os.path.join("frames", video_name))), os.path.exists(finders.find(os.path.join("frames", video_name))))
            print(frames.exists())
            return Response({"message": "Frames extraction failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        info = serializers.FrameSerializer(instance=frames, many=True).data
        result = list(sorted(info[:extracted_count], key=lambda x: x["frame_number"]))
        return Response({ "frames": result, "total": len(info) }, status=status.HTTP_200_OK)

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
            return Response({"message": "Metrics extraction failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return Response({"message": "processing"}, status=status.HTTP_202_ACCEPTED)

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
            "size": video.size,
        }

        return Response(camelize(params), status=status.HTTP_200_OK)

class AllCompressed(APIView):
    def get(self, request):
        videos = models.Video.objects.filter(is_compressed=True).values("id", "original_filename", "size", "filename")
        return Response({"videos": list(videos)}, status=status.HTTP_200_OK)

class FrameSizeView(APIView):
    def get(self, request, video_id, frame_number):
        try:
            frame = models.FrameMetadata.objects.get(
                video__id=video_id,
                frame_number=frame_number
            )
        except models.FrameMetadata.DoesNotExist:
            return Response({"message": "Frame not found"}, status=status.HTTP_404_NOT_FOUND)

        if frame.pkt_size is None:
            return Response({"message": "Size not available"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"size": frame.pkt_size}, status=status.HTTP_200_OK)
# QUIZ_DIR = "/STATIC/QUIZ"

class UploadQuestionsView(APIView):
    permission_classes = [IsSuperuser]
    
    def _get_json_entries(self, quiz_dir, static_file_path=os.path.join(settings.BASE_DIR, "static", "quiz_files")):
        result = []
        for file in os.listdir(quiz_dir):
            if os.path.isdir(os.path.join(quiz_dir, file)):
                next_static_file_path = os.path.join(static_file_path, file)
                result.extend(self._get_json_entries(os.path.join(quiz_dir, file), next_static_file_path))
            if file.endswith(".json"):
                with open(os.path.join(quiz_dir, file), "r", encoding="utf-8") as f:
                    json_data = json.load(f)
                    json_data["assets_location"] = static_file_path
                    result.append(json_data)
            else:
                os.makedirs(static_file_path, exist_ok=True)
                shutil.move(os.path.join(quiz_dir, file), os.path.join(static_file_path, file))
        return result

    def post(self, request):

        if "file" not in request.FILES:
            return Response({"message": "Brak pliku ZIP"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES["file"]

        quiz_dir = os.path.join(settings.BASE_DIR, "static", "quiz_files", "archives")
        os.makedirs(quiz_dir, exist_ok=True)
        temp_quiz_dir = os.path.join(settings.BASE_DIR, "static", "temp", "quiz_files")
        os.makedirs(temp_quiz_dir, exist_ok=True)
        
        archive_path = os.path.join(quiz_dir, uploaded_file.name)
        with open(archive_path, "wb") as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        uploaded_file.seek(0)

        try:
            with zipfile.ZipFile(uploaded_file) as z:
                z.extractall(temp_quiz_dir)
        except zipfile.BadZipFile:
            return Response({"message": "Niepoprawny ZIP"}, status=status.HTTP_400_BAD_REQUEST)
        
        quizes_json = self._get_json_entries(temp_quiz_dir)

        for quiz in quizes_json:
            video_name = quiz.get("video_name", None)
            quiz_record = models.Quiz.objects.create(
                name=quiz.get("name", f"Unknown Quiz {uuid.uuid4()}"),
                description=quiz.get("description", "Unknown Quiz Description"),
                video_filename=video_name,
                assets_location=quiz.get("assets_location")
            )
            questions = []
            for question in quiz.get("questions", []):
                answers = question.get("answers", [])
                correct_answers = [answer for answer in answers if answer.get("is_correct", False)]
                questions.append(
                    models.QuizQuestion(
                        quiz=quiz_record,
                        question=question.get("question", f"Unknown Question {uuid.uuid4()}"),
                        answers=answers,
                        correct_answers=correct_answers,
                        image=question.get("image")
                    )
                )
            models.QuizQuestion.objects.bulk_create(questions)
        shutil.rmtree(temp_quiz_dir)
        return Response({"message": "quizes uploaded successfully"}, status=status.HTTP_201_CREATED)

    def get(self, request, quiz_dir="QUIZ_DIR"):
        zip_path = os.path.join(quiz_dir, "source.zip")

        if not os.path.exists(zip_path):
            return Response({"message": "Brak wgranego ZIP"}, status=status.HTTP_404_NOT_FOUND)

        return FileResponse(open(zip_path, "rb"), filename="questions.zip")
    
class QuizesView(APIView):
    def get(self, request, video_id=None):
        videos = models.Video.objects.filter(Q(id=video_id) | Q(original=None))
        filename_video_map = { video.filename: video for video in videos }
        filenames = list(map(lambda video: video.filename, videos))
        quizes = models.Quiz.objects.filter(Q(video_filename__in=filenames) | Q(video_filename=None))
        data = serializers.QuizSerializer(instance=quizes, many=True).data
 
        def get_video_id(quiz):
            filename = quiz.get("video_filename")
            if not filename:
                return None
            video = filename_video_map.get(filename)
            if video:
                return video.id
            return None
        
        for quiz in data:
            quiz["video_id"] = get_video_id(quiz)
        return Response({"quizes": data}, status=status.HTTP_200_OK)

class QuizView(APIView):
    def get(self, request, quiz_id):
        try:
            quiz = models.Quiz.objects.get(id=quiz_id)
        except models.Quiz.DoesNotExist:
            return Response({"message": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        questions = models.QuizQuestion.objects.filter(quiz=quiz)
        serialized_questions = serializers.QuizQuestionSerializer(instance=questions, many=True).data
        serialized_quiz = serializers.QuizSerializer(instance=quiz).data
        serialized_quiz["questions"] = serialized_questions
        return Response({"quiz": serialized_quiz}, status=status.HTTP_200_OK)
    
class QuizQuestionImageView(APIView):
    def get(self, request, question_id):
        try:
            question = models.QuizQuestion.objects.get(id=question_id)
        except models.QuizQuestion.DoesNotExist:
            return Response({"message": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        if not question.image or not question.quiz.assets_location or not os.path.exists(os.path.join(question.quiz.assets_location, question.image)):
            return Response({"message": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(open(os.path.join(question.quiz.assets_location, question.image), "rb"), content_type="image/png", status=status.HTTP_200_OK)
