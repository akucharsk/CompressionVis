# Generated by Django 5.2.3 on 2025-06-12 06:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('compressor', '0011_framemetadata_pkt_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='gop_size',
            field=models.IntegerField(default=None, null=True),
        ),
    ]
