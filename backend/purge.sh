#!/bin/bash

rm -rf static/frames/*
rm -rf static/compressed_videos/*

DB="db.sqlite3"
VIDEO_TABLE="compressor_video"

RESERVED_FILENAMES="('example1.mp4', 'example2.mp4', 'example3.mp4', 'example4.mp4', 'deadpool.mp4')"

sqlite3 "$DB" "DELETE FROM $VIDEO_TABLE WHERE filename NOT IN $RESERVED_FILENAMES"
