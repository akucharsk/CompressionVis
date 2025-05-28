#!/bin/bash

for ((i = 0; i < 5; i++)); do
  curl -X POST -H 'Content-Type: application/json' \
  -d '{
    "fileName": "deadpool.mp4",
    "resolution": "240x100",
    "bandwidth": "100k",
    "crf": 30,
    "framerate": 20
  }' http://localhost:8000/video/compress/
done