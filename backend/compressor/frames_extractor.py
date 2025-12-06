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
        
    def _get_frames_and_packets_meta(self):
        process = subprocess.Popen([
            "ffprobe",
            "-show_packets",
            "-show_frames",
            "-select_streams", "v",
            "-print_format", "json",
            self.video_path
        ], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        result, _ = process.communicate()
        data = json.loads(result).get("packets_and_frames", [])
        frames, packets = [], []
        for item in data:
            if item.get("type") == "frame":
                frames.append(item)
            elif item.get("type") == "packet":
                packets.append(item)
        return frames, packets
    
    def _get_frame_scene_scores(self):
        process = subprocess.Popen([
            "ffprobe",
            "-show_frames",
            "-select_streams", "v",
            "-print_format", "json",
            "-f", "lavfi",
            f"movie={self.video_path},select=gte(scene\\,0)",
        ], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        result, _ = process.communicate()
        scene_data = json.loads(result).get("frames", [])
        return scene_data

    def _save_frames_metadata(self):
        frames_meta, packets_meta = self._get_frames_and_packets_meta()
        frame_scene_scores = self._get_frame_scene_scores()

        frames = []
        i = 0
        frames_dir = self.video.filename.split(".")[0]

        for frame in frames_meta:
            packet = min(packets_meta, key=lambda pkt: abs(float(pkt.get("pts_time")) - float(frame.get("pts_time"))))
            frame_scene_score = min(frame_scene_scores, key=lambda score: abs(float(score.get("pts_time")) - float(frame.get("pts_time"))))
            frames.append({
                "frame_number": i,
                "type": frame.get("pict_type"),
                "pts_time": frame.get("pts_time"),
                "dts_time": packet.get("dts_time"),
                "video_id": self.video.id,
                "image_url": f"frames/{frames_dir}/frame_{i}.png",
                "pkt_size": frame.get("pkt_size"),
                "scene_score": frame_scene_score.get("tags", {}).get("lavfi.scene_score", 0.0),
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
        except Exception as e:
            print(f"ERROR DURING FRAMES EXTRACTION: {e}")
            sys.stdout.flush()
        finally:
            self.video.frames_extraction_in_progress = False
            self.video.save()

    def start_extraction_job(self):
        self._save_frames_metadata()
        self._extract_and_update_status()
