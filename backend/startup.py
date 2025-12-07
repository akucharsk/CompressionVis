from compressor import models
import os
import sys
import shutil
import subprocess
import json
from mvextractor.videocap import VideoCap

models.Video.objects.all().delete()

video_titles = {
    "example1.y4m": "Witcher 3",
    "example2.y4m": "Big Buck Bunny",
    "example3.y4m": "Park Joy",
    "example4.y4m": "Elephant Dream"
}

resolutions = [
    (1280, 720),
    (960, 540),
    (854, 480),
    (640, 360),
    (426, 240)
]

reserved_filenames = os.listdir(os.path.join("static", "original_videos"))
base_names = set(map(lambda x: os.path.splitext(x)[0], reserved_filenames))

allowed_folders = set(base_names)
for name in base_names:
    for w, h in resolutions:
        allowed_folders.add(f"{name}_{w}x{h}")

for file in os.listdir(os.path.join("static", "compressed_videos")):
    if file != ".gitkeep":
        os.remove(os.path.join("static", "compressed_videos", file))

for file in os.listdir(os.path.join("static", "frames")):
    if file not in allowed_folders and file != ".gitkeep":
        path = os.path.join("static", "frames", file)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)

folder = os.path.join("static", "macroblocks")
if os.path.exists(folder):
    for name in os.listdir(folder):
        path = os.path.join(folder, name)
        if name == ".gitkeep":
            continue

        if os.path.isfile(path) or os.path.islink(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
else:
    os.makedirs(folder)

diff_root = os.path.join("static", "differences")
if not os.path.exists(diff_root):
    os.makedirs(diff_root)

for vid in reserved_filenames:
    name, ext = os.path.splitext(vid)
    if vid.endswith(".y4m"):
        original_path = os.path.join("static", "original_videos", vid)
        filename = vid[:-4] + ".mp4"
        title = video_titles.get(vid, "Unknown Video")

        size = os.path.getsize(original_path)

        models.Video.objects.create(
            filename=filename,
            width=1280,
            height=720,
            original_filename=vid,
            title=title,
            size=size
        )

        video_dir = os.path.join("static", "frames", name)
        if not os.path.exists(video_dir):
            os.makedirs(video_dir)
            print(f"Generating original frames for: {vid}")
            sys.stdout.flush()
            subprocess.run([
                "ffmpeg", "-i", original_path,
                "-frame_pts", "true",
                f"{video_dir}/frame_%d.png"
            ])

        for w, h in resolutions:
            res_dir_name = f"{name}_{w}x{h}"
            res_dir_path = os.path.join("static", "frames", res_dir_name)

            if not os.path.exists(res_dir_path):
                os.makedirs(res_dir_path)
                subprocess.run([
                    "ffmpeg", "-i", original_path,
                    "-vf", f"scale={w}:{h}:flags=lanczos",
                    "-frame_pts", "true",
                    f"{res_dir_path}/frame_%d.png"
                ])

        diff_dir = os.path.join("static", "differences", name)
        if not os.path.exists(diff_dir):
            os.makedirs(diff_dir)

            temp_output = os.path.join("static", "original_videos", f"{name}_temp.mp4")

            ffmpeg_command = [
                "ffmpeg",
                "-y",
                "-i", original_path,
                "-c:v", "libx264",
                "-preset", "veryslow",
                "-bf", "0",
                "-g", "999999",
                "-crf", "0",
                "-keyint_min", "999999",
                "-x264opts", "no-scenecut",
                temp_output
            ]

            process = subprocess.Popen(ffmpeg_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return_code = process.wait()

            if return_code == 0:
                cap = VideoCap()
                cap.open(temp_output)

                frame_idx = 0
                while True:
                    ret, frame, motion_vectors, frame_type = cap.read()
                    if not ret:
                        break

                    vectors_data = []
                    for vector in motion_vectors:
                        vectors_data.append({
                            "source": int(vector[0]),
                            "width": int(vector[1]),
                            "height": int(vector[2]),
                            "src_x": int(vector[3]),
                            "src_y": int(vector[4]),
                            "dst_x": int(vector[5]),
                            "dst_y": int(vector[6]),
                        })

                    json_filename = os.path.join(diff_dir, f"frame_{frame_idx:03d}.json")
                    with open(json_filename, "w") as f:
                        json.dump(vectors_data, f)

                    frame_idx += 1

                if os.path.exists(temp_output):
                    os.remove(temp_output)

exit()