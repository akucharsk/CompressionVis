from .frames_extractor import FramesExtractor
from .metrics_extractor import MetricsExtractor
from celery import shared_task
import subprocess
import os
from django.conf import settings
from . import models

@shared_task
def compress_video(compression_input):
  ffmpeg_command = compression_input["ffmpeg_command"]
  video_id = compression_input["video_id"]
  output_path = compression_input["output_path"]
  
  try:
    video = models.Video.objects.get(id=video_id)
  except models.Video.DoesNotExist:
    print(f"Video with id {video_id} does not exist")
    return
  
  process = subprocess.Popen(ffmpeg_command)
  return_code = process.wait()
  if return_code != 0:
    print(f"FFmpeg compression failed with return code {return_code}")
    return

  size = os.path.getsize(output_path)
  print(f"Size of compressed video: {size}")
  video.is_compressed = True
  video.size = size
  video.save()
  video_name = os.path.splitext(video.filename)[0]
  frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", video_name)
  macroblocks_dir = os.path.join(settings.BASE_DIR, "static", "macroblocks", video_name)
  os.makedirs(frames_dir, exist_ok=True)
  os.makedirs(macroblocks_dir, exist_ok=True)
  print(f"Video {video.id} compressed successfully")
  
@shared_task
def compress_video_by_size(size_serializer):
  print("compress_video_by_size")

@shared_task
def extract_frames(video_id):
  video = models.Video.objects.get(id=video_id)
  extractor = FramesExtractor(video)
  extractor.start_extraction_job()
  return True

@shared_task
def extract_metrics(video_id):
  video = models.Video.objects.get(id=video_id)
  extractor = MetricsExtractor(video)
  extractor.start_extraction_job()
  return True
