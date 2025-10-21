#!/bin/bash

ffmpeg -i "static/original_videos/$1.y4m" -pix_fmt yuv420p -vf "scale=$3" "static/temp/$1.y4m"
ffmpeg -i "static/compressed_videos/$2.mp4" -pix_fmt yuv420p -vf "scale=$3" "static/temp/$2.y4m"

vmaf \
  --reference "static/temp/$1.y4m" \
  --distorted "static/temp/$2.y4m" \
  --output "$2.json" \
  --json \
  --feature psnr \
  --feature float_ssim \
  --model path=/vmaf/model/vmaf_v0.6.1.json

rm -f "static/temp/$2.y4m" "static/temp/$1.y4m"
