from compressor import models  # zmień 'yourapp' na nazwę swojej aplikacji Django
import os
import shutil

models.Video.objects.all().delete()
reserved_filenames = os.listdir(os.path.join("static", "videos"))
reserved_frame_dirs = set(map(lambda x: os.path.splitext(x)[0], reserved_filenames))

for file in os.listdir(os.path.join("static", "compressed_videos")):
    os.remove(os.path.join("static", "compressed_videos", file))
for file in os.listdir(os.path.join("static", "frames")):
    if file not in reserved_frame_dirs:
        shutil.rmtree(os.path.join("static", "frames", file))

for vid in reserved_filenames:
    if vid.endswith(".mp4"):
        models.Video.objects.create(filename=vid, width=1920, height=1080)
exit()