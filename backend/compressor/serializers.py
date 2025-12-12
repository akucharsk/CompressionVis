from rest_framework import serializers
from . import models

import os
import sys


class VideoSerializer(serializers.Serializer):
    range_header = serializers.CharField()
    video_url = serializers.CharField()

    def validate(self, attrs):
        range_header = attrs.get('range_header')
        video_url = attrs.get('video_url')

        video_size = os.path.getsize(video_url)

        try:
            ranges = range_header.split("=")[1].split("-")
            start = int(ranges[0])
            end = int(ranges[1]) if ranges[1] else video_size - 1
        except (IndexError, ValueError):
            start = 0
            end = video_size - 1

        if start > end:
            raise serializers.ValidationError('Start of range is too high')
        content_length = end - start + 1
        chunk_size = 4096

        def video_iterator():
            nonlocal start
            with open(video_url, 'rb') as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk = f.read(min(chunk_size, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    
                    yield chunk

        chunk_size = min(chunk_size, end - start)
        attrs['video_iterator'] = video_iterator
        attrs["Content-Length"] = content_length
        attrs["Content-Range"] = f"bytes {start}-{end}/{video_size}"
        return attrs


class CompressSerializer(serializers.Serializer):
    bandwidth = serializers.CharField(required=False)
    resolution = serializers.CharField(required=False, default="1920x1080")
    crf = serializers.IntegerField(required=False)
    original_id = serializers.IntegerField(required=False, default=None)
    gop_size = serializers.IntegerField(required=False, default=60, min_value=1, max_value=300)
    bf = serializers.CharField(required=False, default="default")
    aq_mode = serializers.IntegerField(required=False, default=0, min_value=0, max_value=3)
    aq_strength = serializers.FloatField(required=False, default=0.8, min_value=0.8, max_value=1.6)
    preset = serializers.CharField(required=False, default="medium")

    def validate(self, attrs):
        bandwidth = attrs.get("bandwidth")
        resolution = attrs.get("resolution")
        crf = attrs.get("crf")
        gop_size = attrs.get("gop_size")
        filename = self.context.get("original_video").filename
        bf = attrs.get("bf")
        aq_mode = attrs.get("aq_mode")
        aq_strength = attrs.get("aq_strength")
        preset = attrs.get("preset")

        dims = resolution.split("x")
        try:
            width = int(dims[0])
            height = int(dims[1])
        except (ValueError, IndexError):
            raise serializers.ValidationError('Resolution width must be of the form <width>x<height>')

        if bandwidth:
            name = f"bandwidth{bandwidth}"
        else:
            name = f"crf{crf}"

        attrs['width'] = width
        attrs['height'] = height
        output_filename = f"r{resolution}g{gop_size}{name}bf{bf}aq_mode{aq_mode}aq_strength{int(aq_strength*10)}preset{preset}{filename}"

        attrs['filename'] = output_filename

        attrs.pop('resolution', None)

        return attrs

    def create(self, validated_data):
        multipliers = {
            'k': 1e3,
            'M': 1e6,
            'G': 1e9,
        }
        bandwidth = validated_data.pop('bandwidth', None)
        if bandwidth and bandwidth[-1] in multipliers:
            factor = bandwidth[-1]
            bandwidth = bandwidth[:-1]
            validated_data['bandwidth'] = int(bandwidth) * multipliers[factor]
        validated_data['width'] = int(validated_data['width'])
        validated_data['height'] = int(validated_data['height'])
        validated_data["original_id"] = self.context["original_video"].id
        validated_data["title"] = self.context["original_video"].title

        if validated_data.get('aq_mode') == 0:
            validated_data['aq_strength'] = None

        video = models.Video.objects.create(**validated_data)
        return video


class SizeCompressionSerializer(serializers.Serializer):
    target_size = serializers.FloatField()

    def validate(self, attrs):
        target_size = attrs.get("target_size", -1)
        duration = self.context.get("duration")
        original_video = self.context.get("original_video")
        try:
            target_size_bytes = float(target_size)
            if target_size_bytes <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise serializers.ValidationError("Target size must be a positive number")

        bitrate = (target_size_bytes * 8) / duration
        bitrate_kbps = int(bitrate / 1000)

        output_filename = f"size{int(target_size)}_video_{original_video.filename}"
        
        attrs["bandwidth"] = bitrate_kbps
        attrs["filename"] = output_filename
        attrs["original_id"] = original_video.id
        
        return attrs
    
    def create(self, validated_data):
        data = validated_data.copy()
        data.pop("target_size")
        data["title"] = self.context["original_video"].title
        video = models.Video.objects.create(**data)
        return video

class FrameSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.FrameMetadata
        fields = '__all__'

class CreateFramesSerializer(serializers.Serializer):

    frames = serializers.ListField()

    def create(self, validated_data):
        frames = [
            models.FrameMetadata(**data) for data in validated_data['frames']
        ]
        frames = models.FrameMetadata.objects.bulk_create(frames)
        return frames
