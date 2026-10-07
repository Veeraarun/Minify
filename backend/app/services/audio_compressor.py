import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging

from app.utils.ffmpeg_utils import is_ffmpeg_available, run_ffmpeg_command, get_media_metadata
from app.utils.file_utils import format_bytes

logger = logging.getLogger("audio_compressor")

def compress_audio(
    input_path: str,
    output_path: str,
    target_size_bytes: Optional[int] = None,
    quality_preset: str = "balanced",
    audio_preset: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compresses audio using FFmpeg with speech/music presets or target-size matching.
    """
    if not is_ffmpeg_available():
        raise RuntimeError("FFmpeg is not installed or available on this system. Audio compression requires FFmpeg.")

    orig_size = os.path.getsize(input_path)
    final_output_path = str(Path(output_path).with_suffix(".mp3"))

    meta = get_media_metadata(input_path)
    duration = max(0.5, meta.get("duration", 1.0))

    # Bitrate determination
    target_reached = None
    tradeoff_note = None

    if target_size_bytes:
        # Calculate target bitrate
        calc_bps = int((target_size_bytes * 8) / duration)
        bitrate_kbps = max(32, min(320, calc_bps // 1000))
        target_bitrate_str = f"{bitrate_kbps}k"
    else:
        if audio_preset == "speech":
            target_bitrate_str = "64k"
        elif audio_preset == "music":
            target_bitrate_str = "160k"
        else:
            preset_map = {
                "max_compression": "64k",
                "balanced": "128k",
                "high_quality": "192k",
                "lossless": "320k"
            }
            target_bitrate_str = preset_map.get(quality_preset, "128k")

    cmd = [
        "-y",
        "-i", input_path,
        "-c:a", "libmp3lame",
        "-b:a", target_bitrate_str
    ]

    # If speech or very low bitrate, downmix to mono to maximize voice fidelity
    if audio_preset == "speech" or (target_size_bytes and int(target_bitrate_str[:-1]) <= 64):
        cmd.extend(["-ac", "1"])

    cmd.extend([
        "-map_metadata", "-1",
        final_output_path
    ])

    success, err = run_ffmpeg_command(cmd, timeout=120)
    if not success:
        raise RuntimeError(f"Audio compression failed: {err}")

    final_size = os.path.getsize(final_output_path)

    if target_size_bytes:
        target_reached = final_size <= target_size_bytes
        if not target_reached:
            tradeoff_note = f"Minimum audio bitrate (32 kbps) reached. Achieved {format_bytes(final_size)} (Target: {format_bytes(target_size_bytes)})."

    if final_size >= orig_size and not target_size_bytes:
        tradeoff_note = "Audio file was already tightly compressed."

    out_meta = get_media_metadata(final_output_path)

    return {
        "output_path": final_output_path,
        "output_specs": {
            "duration": out_meta.get("duration", duration),
            "bitrate": out_meta.get("bitrate", int(target_bitrate_str[:-1]) * 1000),
            "codec": "mp3",
            "size_bytes": final_size
        },
        "method": f"MP3 (libmp3lame) at {target_bitrate_str} ({audio_preset or quality_preset})",
        "target_reached": target_reached,
        "tradeoff_note": tradeoff_note
    }
