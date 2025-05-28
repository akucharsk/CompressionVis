#!/bin/bash

for ((i = 1; i < 5; i++)); do
	output="static/videos/example$i.mp4"
	ffprobe $output
done
