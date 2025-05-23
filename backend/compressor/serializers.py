
from rest_framework import serializers
from . import models

import os

class VideoSerializer(serializers.Serializer):
    range_header = serializers.CharField()
    video_url = serializers.CharField()

    def validate(self, attrs):
        range_header = attrs.get('range_header')
        video_url = attrs.get('video_url')

        video_size = os.path.getsize(video_url)

        byte_split = range_header.split("bytes=")
        try:
            start = int(byte_split[0])
        except ValueError:
            start = 0

        try:
            end = int(byte_split[1])
        except (ValueError, IndexError):
            end = video_size - 1

        if start > end:
            raise serializers.ValidationError('Start of range is too high')

        chunk_size = 4096
        def video_iterator():
            nonlocal start
            with open(video_url, 'rb') as f:
                f.seek(start)
                while start <= end:
                    chunk = f.read(min(chunk_size, end - start))
                    yield chunk
                    start += chunk_size

        attrs['video_iterator'] = video_iterator
        return attrs


class CompressSerializer(serializers.Serializer):
    bandwidth = serializers.CharField(required=False, default='128k')
    resolution = serializers.CharField(required=False, default="1920x1080")
    crf = serializers.IntegerField(required=False, default=20)
    fileName = serializers.CharField(required=False, default='')

    def validate(self, attrs):
        bandwidth = attrs.get("bandwidth")
        resolution = attrs.get("resolution")
        crf = attrs.get("crf")
        filename = attrs.get("fileName")

        dims = resolution.split("x")
        try:
            width = int(dims[0])
            height = int(dims[1])
        except (ValueError, IndexError):
            raise serializers.ValidationError('Resolution width must be of the form <width>x<height>')

        attrs['width'] = width
        attrs['height'] = height
        output_filename = f"b{bandwidth}r{resolution}cr{crf}{filename}"

        attrs['name'] = output_filename

        attrs.pop('fileName', None)
        attrs.pop('resolution', None)

        return attrs

    def create(self, validated_data):
        multipliers = {
            'k': 1e3,
            'M': 1e6,
            'G': 1e9,
        }
        bandwidth = validated_data.pop('bandwidth')
        if bandwidth[-1] in multipliers:
            factor = bandwidth[-1]
            bandwidth = bandwidth[:-1]
            validated_data['bandwidth'] = int(bandwidth) * multipliers[factor]
        validated_data['width'] = int(validated_data['width'])
        validated_data['height'] = int(validated_data['height'])

        video = models.Video.objects.create(**validated_data)
        return video
