import os
import subprocess
import json
import sys
import threading
from django.db import IntegrityError

from utils.psnr import weighted_psnr_420
from . import models

class MetricsExtractor:
    def __init__(self, video):
        self.video = video
        self.metrics: models.VideoMetrics | None = None

    def _extract_metrics_and_save(self):
        try:
            original = self.video.original
            if self.video.width * self.video.height > original.width * original.height:
                scale = f"{original.width}:{original.height}"
            else:
                scale = f"{self.video.width}:{self.video.height}"
            video_name = os.path.splitext(self.video.filename)[0]
            original_video_name = os.path.splitext(original.filename)[0]
            process = subprocess.Popen([
                "bash", "vmaf.sh",
                original_video_name, video_name, scale,
                "2>/dev/null"
            ])
            process.wait()
            with open(f"{video_name}.json") as f:
                metric_info = json.load(f)
            os.remove(f"{video_name}.json")
            pooled_metrics = metric_info["pooled_metrics"]
            frame_metrics = metric_info["frames"]
            frame_metrics = {
                data["frameNum"]: data["metrics"] for data in frame_metrics
            }
            frames = models.FrameMetadata.objects.filter(video=self.video)
            for frame in frames:
                frame.vmaf_score = frame_metrics[frame.frame_number]["vmaf"]
                frame.ssim_score = frame_metrics[frame.frame_number]["float_ssim"]
                psnr_scores = {
                    "psnr_y": frame_metrics[frame.frame_number]["psnr_y"],
                    "psnr_cr": frame_metrics[frame.frame_number]["psnr_cr"],
                    "psnr_cb": frame_metrics[frame.frame_number]["psnr_cb"],
                }
                frame.psnr_score = weighted_psnr_420(**psnr_scores)

            models.FrameMetadata.objects.bulk_update(
                frames,
                fields=["vmaf_score", "psnr_score", "ssim_score"]
            )
            vid_psnr_scores = {
                "psnr_y": pooled_metrics["psnr_y"]["mean"],
                "psnr_cr": pooled_metrics["psnr_cr"]["mean"],
                "psnr_cb": pooled_metrics["psnr_cb"]["mean"],
            }

            result = {
                "video_metrics": {
                    "VMAF": round(pooled_metrics["vmaf"]["mean"], 2),
                    "SSIM": round(pooled_metrics["float_ssim"]["mean"], 2),
                    "PSNR": round(weighted_psnr_420(**vid_psnr_scores), 2)
                }
            }

            self.metrics.psnr_mean = result["video_metrics"]["PSNR"]
            self.metrics.ssim_mean = result["video_metrics"]["SSIM"]
            self.metrics.vmaf_mean = result["video_metrics"]["VMAF"]
            self.metrics.save()
        except Exception as e:
            print(e)
            sys.stdout.flush()

    def start_extraction_job(self):
        try:
            self.metrics = models.VideoMetrics.objects.create(video=self.video)
        except IntegrityError:
            return
        thread = threading.Thread(target=self._extract_metrics_and_save, daemon=True)
        thread.start()
