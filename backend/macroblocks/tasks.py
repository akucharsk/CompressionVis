from celery import shared_task
from .macroblocks_extractor import MacroblocksExtractor
from compressor import models

@shared_task
def extract_macroblocks(video_id):
  video = models.Video.objects.get(id=video_id)
  extractor = MacroblocksExtractor(video)
  extractor.start_extraction_job()
  return True
