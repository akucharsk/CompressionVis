# Generated by Django 5.2 on 2025-05-28 12:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('compressor', '0009_rename_frame_type_framemetadata_type'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='video',
            name='original_filename',
        ),
        migrations.AddField(
            model_name='video',
            name='original',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='compressor.video'),
        ),
    ]
