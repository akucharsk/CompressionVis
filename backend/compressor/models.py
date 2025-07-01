from django.db import models

class FrameType(models.TextChoices):
    I = "I", "I-frame (Intra frame, keyframe)"
    P = "P", "P-frame (Predictive frame)"
    B = "B", "B-frame (Bidirectional frame)"

class Video(models.Model):
    filename = models.CharField(max_length=255, unique=True)
    original_filename = models.CharField(max_length=255, unique=True, null=True, default=None)
    title = models.CharField(max_length=255, default="Unknown Video")
    original = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        default=None,
    )
    bandwidth = models.IntegerField(default=None, null=True)
    width = models.IntegerField(default=None, null=True)
    height = models.IntegerField(default=None, null=True)
    crf = models.IntegerField(default=None, null=True)
    is_compressed = models.BooleanField(default=False)
    gop_size = models.IntegerField(default=None, null=True)

    vmaf_mean = models.FloatField(default=None, null=True)
    psnr_mean = models.FloatField(default=None, null=True)
    ssim_mean = models.FloatField(default=None, null=True)

    class Meta:
        ordering = ('filename',)

class FrameMetadata(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    frame_number = models.IntegerField()
    type = models.CharField(
        choices=FrameType.choices,
        max_length=1,
    )
    image_url = models.CharField(
        max_length=255,
    )
    pts_time = models.FloatField(default=None, null=True)
    pkt_size = models.IntegerField(default=None, null=True)
    vmaf_score = models.FloatField(default=0.0)
    psnr_score = models.FloatField(default=0.0)
    ssim_score = models.FloatField(default=0.0)

    class Meta:
        unique_together = ('video', 'frame_number')
