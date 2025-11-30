import os
import sys
from ffmpeg_quality_metrics import FfmpegQualityMetrics


from . import models

class MetricsExtractor:
    def __init__(self, video: models.Video, metrics: models.VideoMetrics):
        self.video = video
        self.metrics = metrics

    def _extract_metrics_and_save(self):
        try:
            original = self.video.original
            original_video_name = os.path.splitext(original.filename)[0]
            distorted_path = os.path.join("static", "compressed_videos", self.video.filename)
            original_path = os.path.join("static", "original_videos", f"{original_video_name}.y4m")
            ffqm = FfmpegQualityMetrics(distorted_path, original_path, threads=8, verbose=True, progress=True)
            metrics = ffqm.calculate(["vmaf", "ssim", "psnr"])
            vmaf = {value["n"]: value["vmaf"] for value in metrics["vmaf"]}
            ssim = {value["n"]: value["ssim_avg"] for value in metrics["ssim"]}
            psnr = {value["n"]: value["psnr_avg"] for value in metrics["psnr"]}
            vmaf_mean = sum(vmaf.values()) / len(vmaf)
            ssim_mean = sum(ssim.values()) / len(ssim)
            psnr_mean = sum(psnr.values()) / len(psnr)
            frames = models.FrameMetadata.objects.filter(video=self.video)
            for frame in frames:
                frame.vmaf_score = vmaf[frame.frame_number + 1]
                frame.ssim_score = ssim[frame.frame_number + 1]
                frame.psnr_score = psnr[frame.frame_number + 1]
            models.FrameMetadata.objects.bulk_update(frames, fields=["vmaf_score", "ssim_score", "psnr_score"])
            self.metrics.vmaf_mean = vmaf_mean
            self.metrics.ssim_mean = ssim_mean
            self.metrics.psnr_mean = psnr_mean
            self.metrics.save()
        except Exception as e:
            print(f"Error during metrics extraction: {e}")
            sys.stdout.flush()

    def start_extraction_job(self):
        self._extract_metrics_and_save()
