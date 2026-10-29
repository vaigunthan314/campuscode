"""
Master pipeline execution script for CampusCode Experience Video.
Executes:
1. Audio generation (audio.wav)
2. Frame generation (960 frames)
3. FFmpeg encoding & compositing (campuscode-experience.mp4)
4. FFprobe validation
"""

import os
import sys
import subprocess
import time

PROJECT_DIR = "/Users/vaigunthansl/Desktop/Rebuild "
TEMP_DIR = os.path.join(PROJECT_DIR, "video-temp")
FRAMES_DIR = os.path.join(TEMP_DIR, "frames")
AUDIO_FILE = os.path.join(TEMP_DIR, "audio.wav")
TEMP_VIDEO = os.path.join(TEMP_DIR, "campuscode-experience.mp4")
PUBLIC_VIDEOS_DIR = os.path.join(PROJECT_DIR, "public", "videos")
FINAL_VIDEO = os.path.join(PUBLIC_VIDEOS_DIR, "campuscode-experience.mp4")

def run_step(cmd, desc):
    print(f"\n==========================================")
    print(f"STEP: {desc}")
    print(f"COMMAND: {cmd}")
    print(f"==========================================")
    start = time.time()
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    elapsed = time.time() - start
    print(res.stdout)
    if res.stderr:
        print(f"[STDERR]:\n{res.stderr}")
    if res.returncode != 0:
        print(f"[ERROR] Step failed with return code {res.returncode}")
        sys.exit(res.returncode)
    print(f"[SUCCESS] {desc} completed in {elapsed:.2f}s")

def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(PUBLIC_VIDEOS_DIR, exist_ok=True)
    
    # 1. Generate Audio
    run_step(f'python3 "{os.path.join(TEMP_DIR, "generate_audio.py")}"', "Generating Background Audio")
    
    if not os.path.exists(AUDIO_FILE) or os.path.getsize(AUDIO_FILE) == 0:
        print(f"Error: Audio file not generated: {AUDIO_FILE}")
        sys.exit(1)
        
    # 2. Generate Frames
    run_step(f'python3 "{os.path.join(TEMP_DIR, "generate_frames.py")}"', "Generating 960 Animation Frames")
    
    # Verify frame count
    frame_files = [f for f in os.listdir(FRAMES_DIR) if f.startswith("frame_") and f.endswith(".png")]
    print(f"Verified {len(frame_files)} frames in {FRAMES_DIR}")
    if len(frame_files) < 960:
        print(f"Warning: Expected 960 frames, found {len(frame_files)}")
        
    # 3. Composite with FFmpeg
    # H.264 video, AAC audio, 1920x1080, 30fps, 192k audio, crf 18
    ffmpeg_cmd = (
        f'ffmpeg -y -framerate 30 -i "{FRAMES_DIR}/frame_%04d.png" '
        f'-i "{AUDIO_FILE}" '
        f'-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p '
        f'-c:a aac -b:a 192k -shortest "{TEMP_VIDEO}"'
    )
    run_step(ffmpeg_cmd, "FFmpeg Video & Audio Compositing")
    
    # 4. Copy to Final Destination
    run_step(f'cp "{TEMP_VIDEO}" "{FINAL_VIDEO}"', "Copying Video to Public Directory")
    
    # 5. Also create MP3 version for optional audio asset
    audio_dir = os.path.join(PROJECT_DIR, "public", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    mp3_file = os.path.join(audio_dir, "campuscode-experience.mp3")
    run_step(f'ffmpeg -y -i "{AUDIO_FILE}" -b:a 192k "{mp3_file}"', "Generating MP3 Audio Asset")
    
    # 6. Verify with ffprobe
    print(f"\n==========================================")
    print(f"VERIFYING FINAL OUTPUT WITH FFPROBE")
    print(f"==========================================")
    ffprobe_cmd = f'ffprobe -v error -show_format -show_streams -print_format json "{FINAL_VIDEO}"'
    res = subprocess.run(ffprobe_cmd, shell=True, capture_output=True, text=True)
    print(res.stdout)
    
    file_size_mb = os.path.getsize(FINAL_VIDEO) / (1024 * 1024)
    print(f"\nFINAL OUTPUT SUCCESS:")
    print(f"Path: {FINAL_VIDEO}")
    print(f"Size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    main()
