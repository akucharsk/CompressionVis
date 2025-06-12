from compressor import models  # zmień 'yourapp' na nazwę swojej aplikacji Django
import os
import shutil
import subprocess

models.Video.objects.all().delete()
reserved_filenames = os.listdir(os.path.join("static", "videos"))
reserved_frame_dirs = set(map(lambda x: os.path.splitext(x)[0], reserved_filenames))

for file in os.listdir(os.path.join("static", "compressed_videos")):
    os.remove(os.path.join("static", "compressed_videos", file))
for file in os.listdir(os.path.join("static", "frames")):
    if file not in reserved_frame_dirs:
        shutil.rmtree(os.path.join("static", "frames", file))

for vid in reserved_filenames:
    name, ext = os.path.splitext(vid)
    if vid.endswith(".mp4"):
        models.Video.objects.create(filename=vid, width=1920, height=1080)
        video_dir = os.path.join("static", "frames", name)
        if not os.path.exists(video_dir):
            os.makedirs(video_dir)
            subprocess.run([
                "ffmpeg", "-i", os.path.join("static", "videos", vid),
                "-frame_pts", "true",
                f"{video_dir}/frame_%d.png"
            ])
exit()