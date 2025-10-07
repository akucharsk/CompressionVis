from compressor import models  # zmień 'yourapp' na nazwę swojej aplikacji Django
import os
import sys
import shutil
import subprocess

models.Video.objects.all().delete()
reserved_filenames = os.listdir(os.path.join("static", "original_videos"))
reserved_frame_dirs = set(map(lambda x: os.path.splitext(x)[0], reserved_filenames))

# for file in os.listdir(os.path.join("static", "compressed_videos")):
#     os.remove(os.path.join("static", "compressed_videos", file))
for file in os.listdir(os.path.join("static", "frames")):
    if file not in reserved_frame_dirs:
        shutil.rmtree(os.path.join("static", "frames", file))

video_titles = {
    "example1.y4m": "Witcher 3",
    "example2.y4m": "Big Buck Bunny",
    "example3.y4m": "Park Joy",
    "example4.y4m": "Elephant Dream"
}
video_sizes = {
    "example1.y4m": 1869354066,
    "example2.y4m": 973557138,
    "example3.y4m": 1555203036,
    "example4.y4m": 1496105346
}

for vid in reserved_filenames:
    name, ext = os.path.splitext(vid)
    if vid.endswith(".y4m"):
        filename = vid[:-4] + ".mp4"
        title = video_titles.get(vid, "Unknown Video")
        size = video_sizes.get(vid, 0)
        models.Video.objects.create(
            filename=filename,
            width=1920,
            height=1080,
            original_filename=vid,
            title=title,
            preset="medium",
            aq_mode=1,
            aq_strength=1.0,
            bf=2,
            crf=25,
            gop_size=60,
            size=size
        )
        video_dir = os.path.join("static", "frames", name)
        if not os.path.exists(video_dir):
            os.makedirs(video_dir)
            print(os.path.join("static", "original_videos", vid))
            sys.stdout.flush()
            subprocess.run([
                "ffmpeg", "-i", os.path.join("static", "original_videos", vid),
                "-frame_pts", "true",
                f"{video_dir}/frame_%d.png"
            ])
exit()