import os
import shutil
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from PIL import Image, ImageSequence
import logging

from app.utils.file_utils import format_bytes

logger = logging.getLogger("image_compressor")

def compress_image(
    input_path: str,
    output_path: str,
    target_size_bytes: Optional[int] = None,
    quality_preset: str = "balanced",
    custom_quality: Optional[int] = None,
    output_format: Optional[str] = None,
    resize_percentage: Optional[int] = None,
    strip_metadata: bool = True
) -> Dict[str, Any]:
    """
    Compresses an image using Pillow with intelligent presets and iterative target-size matching.
    """
    orig_size = os.path.getsize(input_path)
    in_ext = Path(input_path).suffix.lower()

    # Determine desired format
    target_format = (output_format or "webp").lower().lstrip('.')
    if target_format in ("jpg", "jpeg"):
        pillow_format = "JPEG"
        ext = ".jpg"
    elif target_format == "png":
        pillow_format = "PNG"
        ext = ".png"
    elif target_format == "gif":
        pillow_format = "GIF"
        ext = ".gif"
    elif target_format == "avif":
        pillow_format = "AVIF"
        ext = ".avif"
    else:
        pillow_format = "WEBP"
        ext = ".webp"

    # Ensure output path has correct extension
    output_path_obj = Path(output_path).with_suffix(ext)
    final_output_path = str(output_path_obj)

    # Base quality from preset
    preset_quality_map = {
        "max_compression": 65,
        "balanced": 82,
        "high_quality": 92,
        "lossless": 100
    }
    base_quality = custom_quality if custom_quality is not None else preset_quality_map.get(quality_preset, 82)
    is_lossless = quality_preset == "lossless"

    with Image.open(input_path) as img:
        is_animated = getattr(img, "is_animated", False)
        orig_w, orig_h = img.size

        # Handle animated GIF
        if is_animated and in_ext == ".gif" and pillow_format == "GIF":
            frames = [frame.copy() for frame in ImageSequence.Iterator(img)]
            frames[0].save(
                final_output_path,
                save_all=True,
                append_images=frames[1:],
                optimize=True,
                loop=img.info.get('loop', 0)
            )
            out_size = os.path.getsize(final_output_path)
            return {
                "output_path": final_output_path,
                "output_specs": {"width": orig_w, "height": orig_h, "format": "GIF", "animated": True},
                "method": "Animated GIF frame-by-frame color palette optimization",
                "target_reached": (out_size <= target_size_bytes) if target_size_bytes else None,
                "tradeoff_note": None
            }

        # Apply resizing if requested
        working_img = img.copy()
        if resize_percentage and resize_percentage < 100:
            scale = max(0.1, resize_percentage / 100.0)
            new_w = max(1, int(orig_w * scale))
            new_h = max(1, int(orig_h * scale))
            working_img = working_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        curr_w, curr_h = working_img.size

        # Color mode handling
        has_alpha = working_img.mode in ("RGBA", "LA") or ("transparency" in working_img.info)
        if pillow_format == "JPEG" and has_alpha:
            # Flatten RGBA to white background for JPEG
            bg = Image.new("RGB", working_img.size, (255, 255, 255))
            bg.paste(working_img, mask=working_img.split()[-1] if working_img.mode == "RGBA" else None)
            working_img = bg
        elif pillow_format == "WEBP" and not has_alpha and working_img.mode != "RGB":
            working_img = working_img.convert("RGB")
        elif pillow_format == "WEBP" and has_alpha and working_img.mode != "RGBA":
            working_img = working_img.convert("RGBA")

        def save_candidate(image_obj, q: int, lossless: bool) -> int:
            save_kwargs: Dict[str, Any] = {"optimize": True}
            
            if pillow_format == "WEBP":
                save_kwargs["lossless"] = lossless
                save_kwargs["quality"] = q
                save_kwargs["method"] = 6  # max compression effort
            elif pillow_format == "JPEG":
                save_kwargs["quality"] = q
                save_kwargs["progressive"] = True
                save_kwargs["subsampling"] = 2 if q < 90 else 0
            elif pillow_format == "PNG":
                save_kwargs["compress_level"] = 9
            elif pillow_format == "AVIF":
                save_kwargs["quality"] = q

            image_obj.save(final_output_path, format=pillow_format, **save_kwargs)
            return os.path.getsize(final_output_path)

        # Iterative compression if target size is specified
        target_reached = None
        tradeoff_note = None

        if target_size_bytes:
            # We need to reach target_size_bytes
            best_quality = base_quality
            min_quality = 30
            max_quality = 95
            
            # Binary search for optimal quality
            for _ in range(6):
                mid_q = (min_quality + max_quality) // 2
                current_size = save_candidate(working_img, mid_q, False)
                if current_size > target_size_bytes:
                    max_quality = mid_q - 1
                else:
                    best_quality = mid_q
                    min_quality = mid_q + 1

            achieved_size = save_candidate(working_img, best_quality, False)

            # If still exceeding target, downscale iteratively down to safe minimum
            if achieved_size > target_size_bytes:
                scale = 0.85
                scaled_img = working_img.copy()
                while achieved_size > target_size_bytes and scale >= 0.35:
                    new_w = max(16, int(curr_w * scale))
                    new_h = max(16, int(curr_h * scale))
                    scaled_img = working_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    achieved_size = save_candidate(scaled_img, min(best_quality, 50), False)
                    scale -= 0.15

                working_img = scaled_img
                curr_w, curr_h = working_img.size

            target_reached = achieved_size <= target_size_bytes
            if not target_reached:
                tradeoff_note = f"Minimum safe visual quality (Q=30) reached. Achieved {format_bytes(achieved_size)} (Target: {format_bytes(target_size_bytes)})."
        else:
            save_candidate(working_img, base_quality, is_lossless)

        final_size = os.path.getsize(final_output_path)

        # Check for inflation: if output is larger than original, copy original unless format change requested
        if final_size >= orig_size and not target_size_bytes and output_format is None:
            shutil.copy2(input_path, final_output_path)
            final_size = orig_size
            tradeoff_note = "Original was already optimally compressed. Preserved original file to prevent size inflation."

        method_desc = f"{pillow_format} encoding (Quality {base_quality if not target_size_bytes else 'Target-adapted'})"
        if curr_w != orig_w:
            method_desc += f", downscaled to {curr_w}x{curr_h}"

        return {
            "output_path": final_output_path,
            "output_specs": {
                "width": curr_w,
                "height": curr_h,
                "format": pillow_format,
                "size_bytes": final_size
            },
            "method": method_desc,
            "target_reached": target_reached,
            "tradeoff_note": tradeoff_note
        }
