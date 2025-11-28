import os
import subprocess
import threading
import json
import sys

from django.db import IntegrityError

from compression_vis import settings
from compressor import models
from . import serializers
from django.contrib.staticfiles import finders

class FramesExtractor:
    def __init__(self, video: models.Video):
        self.video = video
        self.video_name = os.path.splitext(video.filename)[0]
        self.frames_dir = os.path.join(settings.BASE_DIR, "static", "frames", self.video_name)
        self.video_path = finders.find(os.path.join("compressed_videos", video.filename))

    def _get_frames_info(self):
        process = subprocess.Popen([
            "ffprobe",
            "-show_frames",
            "-select_streams", "v",
            "-print_format", "json",
            self.video_path
        ], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        result, _ = process.communicate()

        data = json.loads(result)

        frames = []
        i = 0
        frames_dir = self.video.filename.split(".")[0]

        for frame in data.get("frames", []):
            pict_type = frame.get("pict_type")
            if pict_type in ["I", "P", "B"]:
                frames.append({
                    "frame_number": i,
                    "type": pict_type,
                    "pts_time": frame.get("pts_time"),
                    "video_id": self.video.id,
                    "image_url": f"frames/{frames_dir}/frame_{i}.png",
                    "pkt_size": frame.get("pkt_size"),
                })
                i += 1

        frames_serializer = serializers.CreateFramesSerializer(data={ "frames": frames })
        frames_serializer.is_valid(raise_exception=True)
        try:
            frames_serializer.save()
        except IntegrityError:
            return

    def _extract_and_update_status(self):
        try:
            os.makedirs(self.frames_dir, exist_ok=True)
            process = subprocess.Popen([
                "ffmpeg", "-i", self.video_path,
                "-frame_pts", "true",
                f"{self.frames_dir}/frame_%d.png"
            ], stderr=subprocess.PIPE, stdout=subprocess.PIPE)
            process.wait()

            self.video.frames_extraction_completed = True
            sys.stdout.flush()
        except Exception as e:
            print(f"ERROR DURING FRAMES EXTRACTION: {e}")
            sys.stdout.flush()
        finally:
            self.video.frames_extraction_in_progress = False
            self.video.save()
            print(models.Video.objects.get(id=self.video.id).frames_extraction_in_progress)
            sys.stdout.flush()

    def start_extraction_job(self):
        self._get_frames_info()
        self._extract_and_update_status()
