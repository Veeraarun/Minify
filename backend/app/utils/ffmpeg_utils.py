import os
import shutil
import subprocess
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from app.config import FFMPEG_PATH_OVERRIDE

logger = logging.getLogger("ffmpeg_utils")

_CACHED_FFMPEG_PATH: Optional[str] = None
_CACHED_FFPROBE_PATH: Optional[str] = None

def find_binary(binary_name: str, override_path: str = "") -> Optional[str]:
    """Finds an executable binary (ffmpeg/ffprobe) across PATH and known system locations."""
    if override_path and os.path.isfile(override_path):
        return override_path

    # Standard PATH lookup
    found = shutil.which(binary_name)
    if found:
        return found

    # Windows specific checks
    if os.name == "nt":
        user_home = Path.home()
        candidates = [
            user_home / "AppData" / "Local" / "Microsoft" / "WinGet" / "Packages",
            Path("C:/Program Files/ffmpeg/bin"),
            Path("C:/ffmpeg/bin"),
            Path("C:/ProgramData/chocolatey/bin"),
        ]
        
        # Search winget package directory recursively for binary
        winget_dir = candidates[0]
        if winget_dir.exists():
            for p in winget_dir.glob(f"**/{binary_name}.exe"):
                if p.is_file():
                    return str(p)

        for c in candidates[1:]:
            p = c / f"{binary_name}.exe"
            if p.is_file():
                return str(p)

    return None

def get_ffmpeg_path() -> Optional[str]:
    global _CACHED_FFMPEG_PATH
    if _CACHED_FFMPEG_PATH and os.path.isfile(_CACHED_FFMPEG_PATH):
        return _CACHED_FFMPEG_PATH
    _CACHED_FFMPEG_PATH = find_binary("ffmpeg", FFMPEG_PATH_OVERRIDE)
    return _CACHED_FFMPEG_PATH

def get_ffprobe_path() -> Optional[str]:
    global _CACHED_FFPROBE_PATH
    if _CACHED_FFPROBE_PATH and os.path.isfile(_CACHED_FFPROBE_PATH):
        return _CACHED_FFPROBE_PATH
    
    # Try ffprobe next to ffmpeg if found
    ffmpeg = get_ffmpeg_path()
    if ffmpeg:
        adjacent = Path(ffmpeg).parent / ("ffprobe.exe" if os.name == "nt" else "ffprobe")
        if adjacent.is_file():
            _CACHED_FFPROBE_PATH = str(adjacent)
            return _CACHED_FFPROBE_PATH

    _CACHED_FFPROBE_PATH = find_binary("ffprobe")
    return _CACHED_FFPROBE_PATH

def is_ffmpeg_available() -> bool:
    path = get_ffmpeg_path()
    if not path:
        return False
    try:
        res = subprocess.run([path, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
        return res.returncode == 0
    except Exception as e:
        logger.warning(f"Failed to check FFmpeg availability: {e}")
        return False

def get_media_metadata(file_path: str) -> Dict[str, Any]:
    """Extracts duration, dimensions, codecs, and bitrate using ffprobe."""
    ffprobe = get_ffprobe_path()
    default_meta = {
        "duration": 0.0,
        "width": 0,
        "height": 0,
        "video_codec": None,
        "audio_codec": None,
        "bitrate": 0,
        "has_video": False,
        "has_audio": False,
        "fps": 0.0
    }
    if not ffprobe:
        return default_meta

    try:
        cmd = [
            ffprobe,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path)
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if res.returncode != 0:
            return default_meta

        data = json.loads(res.stdout)
        format_info = data.get("format", {})
        streams = data.get("streams", [])

        duration = float(format_info.get("duration", 0.0))
        bitrate = int(format_info.get("bit_rate", 0))

        width = 0
        height = 0
        video_codec = None
        audio_codec = None
        has_video = False
        has_audio = False
        fps = 0.0

        for stream in streams:
            codec_type = stream.get("codec_type")
            if codec_type == "video" and not has_video:
                has_video = True
                width = int(stream.get("width", 0))
                height = int(stream.get("height", 0))
                video_codec = stream.get("codec_name")
                r_frame_rate = stream.get("r_frame_rate", "0/1")
                if "/" in r_frame_rate:
                    num, den = r_frame_rate.split("/")
                    if float(den) > 0:
                        fps = round(float(num) / float(den), 2)
            elif codec_type == "audio" and not has_audio:
                has_audio = True
                audio_codec = stream.get("codec_name")
                if bitrate == 0 and "bit_rate" in stream:
                    try:
                        bitrate = int(stream["bit_rate"])
                    except Exception:
                        pass

        return {
            "duration": round(duration, 2),
            "width": width,
            "height": height,
            "video_codec": video_codec,
            "audio_codec": audio_codec,
            "bitrate": bitrate,
            "has_video": has_video,
            "has_audio": has_audio,
            "fps": fps
        }
    except Exception as e:
        logger.error(f"Error reading media metadata: {e}")
        return default_meta

def run_ffmpeg_command(cmd_args: list, timeout: int = 300) -> Tuple[bool, str]:
    """Executes FFmpeg with argument list, returning (success, error_message)."""
    ffmpeg = get_ffmpeg_path()
    if not ffmpeg:
        return False, "FFmpeg binary is not available on this system."

    full_cmd = [ffmpeg] + cmd_args
    try:
        result = subprocess.run(
            full_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        if result.returncode == 0:
            return True, ""
        else:
            return False, result.stderr or result.stdout or "FFmpeg exited with error"
    except subprocess.TimeoutExpired:
        return False, "Compression timed out."
    except Exception as e:
        return False, str(e)
