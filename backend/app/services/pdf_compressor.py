import os
import shutil
import io
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image
import pymupdf
import logging

from app.utils.file_utils import format_bytes

logger = logging.getLogger("pdf_compressor")

def compress_pdf(
    input_path: str,
    output_path: str,
    target_size_bytes: Optional[int] = None,
    quality_preset: str = "balanced"
) -> Dict[str, Any]:
    """
    Optimizes PDF by recompressing embedded images and stripping redundant objects,
    preserving all vector text and document readability.
    """
    orig_size = os.path.getsize(input_path)
    final_output_path = str(Path(output_path).with_suffix(".pdf"))

    quality_map = {
        "max_compression": {"img_q": 60, "max_dim": 1200, "deflate": True},
        "balanced": {"img_q": 75, "max_dim": 1800, "deflate": True},
        "high_quality": {"img_q": 88, "max_dim": 2400, "deflate": True},
        "lossless": {"img_q": 100, "max_dim": 4000, "deflate": True}
    }
    settings = quality_map.get(quality_preset, quality_map["balanced"])

    try:
        doc = pymupdf.open(input_path)
        if doc.is_encrypted:
            doc.close()
            raise ValueError("The PDF document is password-protected or encrypted. Decryption is required before optimization.")

        total_pages = len(doc)

        def optimize_images_and_save(target_quality: int, max_dimension: int, out_dest: str):
            # Process copy of doc
            curr_doc = pymupdf.open(input_path)
            processed_xrefs = set()

            for page in curr_doc:
                image_list = page.get_images(full=True)
                for img_info in image_list:
                    xref = img_info[0]
                    if xref in processed_xrefs:
                        continue
                    processed_xrefs.add(xref)

                    try:
                        base_image = curr_doc.extract_image(xref)
                        image_bytes = base_image.get("image")
                        if not image_bytes or len(image_bytes) < 8192:  # Skip tiny icons
                            continue

                        pil_img = Image.open(io.BytesIO(image_bytes))
                        w, h = pil_img.size

                        # Resize down if very high resolution
                        if max(w, h) > max_dimension:
                            scale = max_dimension / max(w, h)
                            new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
                            pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

                        # Re-encode as optimized JPEG
                        out_buf = io.BytesIO()
                        if pil_img.mode in ("RGBA", "LA") or ("transparency" in pil_img.info):
                            # Keep PNG/lossless if transparent
                            pil_img.save(out_buf, format="PNG", optimize=True)
                        else:
                            if pil_img.mode != "RGB":
                                pil_img = pil_img.convert("RGB")
                            pil_img.save(out_buf, format="JPEG", quality=target_quality, optimize=True)

                        recompressed_data = out_buf.getvalue()
                        # Only replace if actually smaller
                        if len(recompressed_data) < len(image_bytes):
                            curr_doc.update_stream(xref, recompressed_data)
                    except Exception as err:
                        logger.debug(f"Skipping xref {xref}: {err}")

            # Save with maximum object deduplication and deflate
            curr_doc.save(
                out_dest,
                garbage=4,
                deflate=True,
                clean=True
            )
            curr_doc.close()

        target_reached = None
        tradeoff_note = None

        if target_size_bytes:
            # Iteratively attempt compression
            achieved = False
            for q, dim in [(75, 1600), (60, 1200), (45, 900), (35, 700)]:
                optimize_images_and_save(q, dim, final_output_path)
                curr_size = os.path.getsize(final_output_path)
                if curr_size <= target_size_bytes:
                    achieved = True
                    break

            target_reached = achieved
            final_size = os.path.getsize(final_output_path)
            if not target_reached:
                tradeoff_note = f"Minimum safe document clarity reached. Achieved {format_bytes(final_size)} (Target: {format_bytes(target_size_bytes)})."
        else:
            optimize_images_and_save(settings["img_q"], settings["max_dim"], final_output_path)
            final_size = os.path.getsize(final_output_path)

        # Prevent file inflation
        if final_size >= orig_size and not target_size_bytes:
            shutil.copy2(input_path, final_output_path)
            final_size = orig_size
            tradeoff_note = "Document was already compact. Preserved original file."

        doc.close()

        return {
            "output_path": final_output_path,
            "output_specs": {
                "pages": total_pages,
                "size_bytes": final_size
            },
            "method": f"PDF stream deflate & embedded raster optimization (Q={settings['img_q']})",
            "target_reached": target_reached,
            "tradeoff_note": tradeoff_note
        }

    except Exception as e:
        logger.error(f"Error compressing PDF: {e}")
        raise
