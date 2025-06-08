from rest_framework import serializers

class MacroBlockSerializer(serializers.Serializer):
    file_name = serializers.CharField(required=True, help_text="The name of the video file.")
    frame_number = serializers.IntegerField(required=False, default=1, help_text="The frame number to retrieve macroblocks from.")

    def validate(self, attrs):
        file_name = attrs.get('file_name')
        frame_number = attrs.get('frame_number')

        if not file_name:
            raise serializers.ValidationError("File name is required.")

        if frame_number < 0:
            raise serializers.ValidationError("Frame number must be a non-negative integer.")

        return attrs