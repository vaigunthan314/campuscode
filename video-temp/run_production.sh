#!/bin/bash
set -e

DIR="/Users/vaigunthansl/Desktop/Rebuild "
TEMP="$DIR/video-temp"
FRAMES="$TEMP/frames"
PUBLIC_VIDEOS="$DIR/public/videos"
PUBLIC_AUDIO="$DIR/public/audio"

echo "=== CAMPUSCODE EXPERIENCE VIDEO PRODUCTION ==="
mkdir -p "$FRAMES"
mkdir -p "$PUBLIC_VIDEOS"
mkdir -p "$PUBLIC_AUDIO"

echo "[1/4] Generating Audio (32s WAV)..."
python3 "$TEMP/generate_audio.py"

echo "[2/4] Generating Frames (960 PNG frames @ 1920x1080)..."
python3 "$TEMP/generate_frames.py"

echo "[3/4] Compositing with FFmpeg (H.264 + AAC)..."
ffmpeg -y -framerate 30 -i "$FRAMES/frame_%04d.png" -i "$TEMP/audio.wav" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest "$TEMP/campuscode-experience.mp4"

echo "[4/4] Finalizing & Copying Assets..."
cp "$TEMP/campuscode-experience.mp4" "$PUBLIC_VIDEOS/campuscode-experience.mp4"
ffmpeg -y -i "$TEMP/audio.wav" -b:a 192k "$PUBLIC_AUDIO/campuscode-experience.mp3"

echo "=== VALIDATION WITH FFPROBE ==="
ffprobe -v error -show_format -show_streams "$PUBLIC_VIDEOS/campuscode-experience.mp4"

echo "=== COMPLETED SUCCESSFULLY ==="
ls -lh "$PUBLIC_VIDEOS/campuscode-experience.mp4"
