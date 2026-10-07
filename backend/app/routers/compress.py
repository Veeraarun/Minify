import os
import time
import zipfile
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import logging

from app.config import UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR, MAX_BATCH_FILES
from app.utils.file_utils import get_file_category, format_bytes, get_mime_type
from app.models.schemas import CompressionOptions, CompressionResult, QualityResult, BatchCompressRequest, BatchCompressResponse
from app.services.image_compressor import compress_image
from app.services.pdf_compressor import compress_pdf
from app.services.video_compressor import compress_video
from app.services.audio_compressor import compress_audio
from app.services.quality_checker import assess_compression_quality
from app.services.cleanup import cleanup_expired_files
from app.routers.analyze import generate_pdf_thumbnail

logger = logging.getLogger("compress_router")
router = APIRouter(prefix="/api", tags=["Compression"])

def find_file_by_id(directory: Path, file_id: str) -> Optional[Path]:
    """Finds file starting with {file_id}_ in the specified directory."""
    for p in directory.glob(f"{file_id}_*"):
        if p.is_file():
            return p
    return None

def normalize_preset(preset: str) -> str:
    """Maps product-level presets (smart_optimize, web, email, social) to engine presets."""
    preset_lower = (preset or "balanced").lower()
    mapping = {
        "smart_optimize": "balanced",
        "web": "balanced",
        "email": "max_compression",
        "social": "balanced",
        "max_savings": "max_compression",
        "maximum_savings": "max_compression",
        "max_compression": "max_compression",
        "balanced": "balanced",
        "high_quality": "high_quality",
        "lossless": "lossless"
    }
    return mapping.get(preset_lower, "balanced")

@router.post("/compress", response_model=CompressionResult)
async def compress_single_file(options: CompressionOptions):
    cleanup_expired_files()
    start_time = time.time()

    input_path = find_file_by_id(UPLOAD_DIR, options.file_id)
    if not input_path:
        raise HTTPException(status_code=404, detail=f"File with ID '{options.file_id}' not found. Please re-upload.")

    raw_filename = input_path.name[len(options.file_id) + 1:]
    category = get_file_category(raw_filename)
    if not category:
        raise HTTPException(status_code=400, detail="This file type isn't supported.")

    original_size = input_path.stat().st_size
    target_size_bytes = int(options.target_size_mb * 1024 * 1024) if options.target_size_mb and options.target_size_mb > 0 else None

    # Base output filename
    stem = Path(raw_filename).stem
    temp_output_path = PROCESSED_DIR / f"{options.file_id}_optimized_{stem}"

    engine_preset = normalize_preset(options.quality_preset)

    try:
        # Dispatch to media compressors
        if category == "image":
            res = compress_image(
                input_path=str(input_path),
                output_path=str(temp_output_path),
                target_size_bytes=target_size_bytes,
                quality_preset=engine_preset,
                custom_quality=options.custom_quality,
                output_format=options.output_format,
                resize_percentage=options.resize_percentage,
                strip_metadata=options.strip_metadata
            )
        elif category == "pdf":
            res = compress_pdf(
                input_path=str(input_path),
                output_path=str(temp_output_path),
                target_size_bytes=target_size_bytes,
                quality_preset=engine_preset
            )
        elif category == "video":
            res = compress_video(
                input_path=str(input_path),
                output_path=str(temp_output_path),
                target_size_bytes=target_size_bytes,
                quality_preset=engine_preset,
                output_format=options.output_format
            )
        elif category == "audio":
            res = compress_audio(
                input_path=str(input_path),
                output_path=str(temp_output_path),
                target_size_bytes=target_size_bytes,
                quality_preset=engine_preset,
                audio_preset=options.audio_preset
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported category.")

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        logger.error(f"Optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred during file optimization. Please try again.")

    output_path = Path(res["output_path"])
    compressed_size = output_path.stat().st_size
    compressed_filename = output_path.name[len(options.file_id) + 1:]

    # Reduction percentage
    diff = original_size - compressed_size
    reduction_percentage = max(0.0, round((diff / original_size) * 100.0, 1))

    # Evaluate Quality
    quality_score, metric_name, is_measured = assess_compression_quality(
        category=category,
        original_file_path=str(input_path),
        compressed_file_path=str(output_path),
        original_size=original_size,
        compressed_size=compressed_size,
        original_specs={},
        output_specs=res.get("output_specs", {}),
        quality_preset=engine_preset
    )

    # Generate preview thumbnail for compressed PDF if applicable
    if category == "pdf":
        thumb_name = f"{options.file_id}_optimized_page1.png"
        thumb_path = PREVIEWS_DIR / thumb_name
        generate_pdf_thumbnail(str(output_path), str(thumb_path))

    duration_ms = round((time.time() - start_time) * 1000, 1)

    warnings = []
    if res.get("tradeoff_note"):
        warnings.append(res["tradeoff_note"])
    if compressed_size >= original_size:
        warnings.append("This file is already highly compressed. Further optimization may increase size or reduce quality.")

    quality_result = QualityResult(
        original_size=original_size,
        compressed_size=compressed_size,
        original_formatted=format_bytes(original_size),
        compressed_formatted=format_bytes(compressed_size),
        reduction_percentage=reduction_percentage,
        quality_score=quality_score,
        metric_name=metric_name,
        is_measured=is_measured,
        target_size_bytes=target_size_bytes,
        target_reached=res.get("target_reached"),
        quality_tradeoff_note=res.get("tradeoff_note"),
        output_specs=res.get("output_specs", {})
    )

    return CompressionResult(
        file_id=options.file_id,
        original_filename=raw_filename,
        compressed_filename=compressed_filename,
        category=category,
        download_url=f"/api/download/{options.file_id}",
        original_preview_url=f"/api/preview/{options.file_id}/original",
        compressed_preview_url=f"/api/preview/{options.file_id}/compressed",
        compression_method=res.get("method", "MINIFY Smart Optimization"),
        processing_time_ms=duration_ms,
        quality=quality_result,
        warnings=warnings
    )

@router.post("/batch-compress", response_model=BatchCompressResponse)
async def batch_compress_files(batch_req: BatchCompressRequest):
    if not batch_req.file_ids:
        raise HTTPException(status_code=400, detail="No file IDs provided for batch optimization.")

    if len(batch_req.file_ids) > MAX_BATCH_FILES:
        raise HTTPException(status_code=400, detail=f"Batch size exceeds maximum limit of {MAX_BATCH_FILES} files.")

    results: List[CompressionResult] = []
    total_orig = 0
    total_comp = 0
    compressed_paths: List[Path] = []

    for fid in batch_req.file_ids:
        opts = CompressionOptions(
            file_id=fid,
            target_size_mb=batch_req.target_size_mb,
            quality_preset=batch_req.quality_preset,
            output_format=batch_req.output_format
        )
        try:
            res = await compress_single_file(opts)
            results.append(res)
            total_orig += res.quality.original_size
            total_comp += res.quality.compressed_size
            
            c_path = find_file_by_id(PROCESSED_DIR, fid)
            if c_path:
                compressed_paths.append(c_path)
        except Exception as e:
            logger.warning(f"Batch optimization failed for file {fid}: {e}")

    if not results:
        raise HTTPException(status_code=400, detail="Failed to optimize any files in the batch.")

    # Create batch ZIP file
    zip_id = uuid.uuid4().hex[:10]
    zip_filename = f"batch_{zip_id}_minified.zip"
    zip_path = PROCESSED_DIR / zip_filename

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for p in compressed_paths:
            clean_entry_name = p.name.split('_', 1)[-1]
            zipf.write(p, arcname=clean_entry_name)

    overall_reduction = max(0.0, round(((total_orig - total_comp) / max(1, total_orig)) * 100.0, 1))

    return BatchCompressResponse(
        results=results,
        total_original_size=total_orig,
        total_compressed_size=total_comp,
        overall_reduction_percentage=overall_reduction,
        download_all_zip_url=f"/api/download-all/{zip_id}"
    )

@router.get("/download/{file_id}")
async def download_compressed_file(file_id: str):
    file_path = find_file_by_id(PROCESSED_DIR, file_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Optimized file not found or expired.")

    raw_filename = file_path.name[len(file_id) + 1:]
    return FileResponse(
        path=str(file_path),
        filename=raw_filename,
        media_type=get_mime_type(raw_filename)
    )

@router.get("/download-all/{zip_id}")
async def download_all_zip(zip_id: str):
    zip_path = find_file_by_id(PROCESSED_DIR, f"batch_{zip_id}")
    if not zip_path:
        raise HTTPException(status_code=404, detail="Batch archive not found or expired.")

    return FileResponse(
        path=str(zip_path),
        filename=f"minify_{zip_id}.zip",
        media_type="application/zip"
    )

@router.get("/preview/{file_id}/{variant}")
async def preview_media_file(file_id: str, variant: str):
    """
    Serves media preview.
    Variant can be 'original' or 'compressed'.
    For PDF, returns rendered page 1 PNG.
    """
    if variant == "original":
        target_dir = UPLOAD_DIR
        file_path = find_file_by_id(target_dir, file_id)
    else:
        target_dir = PROCESSED_DIR
        file_path = find_file_by_id(target_dir, file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File preview not found.")

    ext = file_path.suffix.lower()

    if ext == ".pdf":
        thumb_pattern = f"{file_id}_optimized_page1.png" if variant == "compressed" else f"{file_id}_page1.png"
        thumb_path = PREVIEWS_DIR / thumb_pattern
        if not thumb_path.exists() and variant == "compressed":
            thumb_path = PREVIEWS_DIR / f"{file_id}_compressed_page1.png"
        if thumb_path.exists():
            return FileResponse(path=str(thumb_path), media_type="image/png")

    return FileResponse(
        path=str(file_path),
        media_type=get_mime_type(file_path.name)
    )
