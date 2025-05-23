from django.db import models

class Video(models.Model):
    name = models.CharField(max_length=255, unique=True)
    bandwidth = models.IntegerField(default=None, null=True)
    width = models.IntegerField(default=None, null=True)
    height = models.IntegerField(default=None, null=True)
    crf = models.IntegerField(default=None, null=True)
    is_compressed = models.BooleanField(default=False)

    class Meta:
        ordering = ('name',)
