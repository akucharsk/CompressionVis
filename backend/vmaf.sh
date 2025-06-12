if [ "$#" -lt 3 ]; then
  echo "You must pass at least 3 arguments. You passed $#."
  exit
fi

mkdir -C static/temp
trap "-rf static/temp/*" EXIT

ffmpeg -i "static/videos/$1" -pix_fmt yuv420p -vf "scale=$3" "static/temp/reference.y4m"
ffmpeg -i "static/compressed_videos/$2" -pix_fmt yuv420p -vf "scale=$3" "static/temp/distorted.y4m"

vmaf \
  --reference "static/temp/reference.y4m" \
  --distorted "static/temp/distorted.y4m" \
  --output result.json \
  --json \
  --feature psnr \
  --feature float_ssim \
  --model path=/vmaf/model/vmaf_v0.6.1.json

rm -rf static/temp/*
