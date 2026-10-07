import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
import logging

from app.utils.ffmpeg_utils import is_ffmpeg_available, run_ffmpeg_command, get_media_metadata
from app.utils.file_utils import format_bytes

logger = logging.getLogger("video_compressor")

def compress_video(
    input_path: str,
    output_path: str,
    target_size_bytes: Optional[int] = None,
    quality_preset: str = "balanced",
    output_format: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compresses video with H.264 / AAC using FFmpeg, supporting CRF and target-bitrate matching.
    """
    if not is_ffmpeg_available():
        raise RuntimeError("FFmpeg is not installed or available on this system. Video compression requires FFmpeg.")

    orig_size = os.path.getsize(input_path)
    final_output_path = str(Path(output_path).with_suffix(".mp4"))

    # Extract input specs
    meta = get_media_metadata(input_path)
    duration = max(0.5, meta.get("duration", 1.0))
    orig_w = meta.get("width", 1280)
    orig_h = meta.get("height", 720)

    # Base CRF preset configuration
    crf_map = {
        "max_compression": 29,
        "balanced": 24,
        "high_quality": 20,
        "lossless": 16
    }
    base_crf = crf_map.get(quality_preset, 24)

    cmd = ["-y", "-i", input_path]
    target_reached = None
    tradeoff_note = None

    if target_size_bytes:
        # Calculate target bitrate: bits / seconds
        # Reserve ~96-128k for audio
        audio_bps = 96_000 if target_size_bytes < 5_000_000 else 128_000
        total_bps = int((target_size_bytes * 8) / duration)
        video_bps = max(150_000, total_bps - audio_bps)

        vf_filters = []
        # Downscale if bitrate is tight for given resolution
        if video_bps < 600_000 and orig_h > 480:
            vf_filters.append("scale=-2:480")
        elif video_bps < 1_500_000 and orig_h > 720:
            vf_filters.append("scale=-2:720")
        elif orig_h > 1080:
            vf_filters.append("scale=-2:1080")

        if vf_filters:
            cmd.extend(["-vf", ",".join(vf_filters)])

        cmd.extend([
            "-c:v", "libx264",
            "-b:v", f"{video_bps}",
            "-maxrate", f"{int(video_bps * 1.35)}",
            "-bufsize", f"{int(video_bps * 2)}",
            "-preset", "faster",
            "-c:a", "aac",
            "-b:a", f"{audio_bps}",
            "-movflags", "+faststart",
            "-map_metadata", "-1",
            final_output_path
        ])
    else:
        # CRF-based perceptual compression
        vf_filters = []
        if quality_preset == "max_compression" and orig_h > 720:
            vf_filters.append("scale=-2:720")
        elif orig_h > 1080:
            vf_filters.append("scale=-2:1080")

        if vf_filters:
            cmd.extend(["-vf", ",".join(vf_filters)])

        cmd.extend([
            "-c:v", "libx264",
            "-crf", str(base_crf),
            "-preset", "medium",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            "-map_metadata", "-1",
            final_output_path
        ])

    success, err = run_ffmpeg_command(cmd, timeout=360)
    if not success:
        raise RuntimeError(f"FFmpeg compression failed: {err}")

    final_size = os.path.getsize(final_output_path)

    if target_size_bytes:
        target_reached = final_size <= target_size_bytes
        if not target_reached:
            tradeoff_note = f"Minimum acceptable video bitrate reached. Achieved {format_bytes(final_size)} (Target: {format_bytes(target_size_bytes)})."

    # Avoid inflation if no format change requested
    if final_size >= orig_size and not target_size_bytes:
        tradeoff_note = "Original video was already efficiently compressed. Result size is comparable."

    out_meta = get_media_metadata(final_output_path)

    return {
        "output_path": final_output_path,
        "output_specs": {
            "width": out_meta.get("width", orig_w),
            "height": out_meta.get("height", orig_h),
            "duration": out_meta.get("duration", duration),
            "bitrate": out_meta.get("bitrate", 0),
            "codec": "h264",
            "size_bytes": final_size
        },
        "method": f"H.264 (libx264) + AAC with {'Target Bitrate Matching' if target_size_bytes else f'CRF {base_crf}'}",
        "target_reached": target_reached,
        "tradeoff_note": tradeoff_note
    }
