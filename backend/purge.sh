#!/bin/bash

RESERVED_FILENAMES="('example1.mp4', 'example2.mp4', 'example3.mp4', 'example4.mp4', 'deadpool.mp4')"
RESERVED_DIRNAMES=('example1' 'example2' 'example3' 'example4' 'deadpool')
for dirname in "${RESERVED_DIRNAMES[@]}"; do
  cp -rt "static/temp/" "static/frames/$dirname"
done

rm -rf static/frames/*
rm -rf static/compressed_videos/*

for dirname in "${RESERVED_DIRNAMES[@]}"; do
  cp -rt "static/temp/$dirname" "static/frames/"
  rm -rf "static/temp/$dirname"
done

DB="db.sqlite3"
VIDEO_TABLE="compressor_video"

sqlite3 "$DB" "DELETE FROM $VIDEO_TABLE WHERE filename NOT IN $RESERVED_FILENAMES"
