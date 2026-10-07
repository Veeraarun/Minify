import os
import uuid
from pathlib import Path
from typing import List, Union
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import pymupdf
import logging

from app.config import UPLOAD_DIR, PREVIEWS_DIR, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB
from app.utils.file_utils import sanitize_filename, get_file_category, format_bytes, get_mime_type, validate_magic_bytes
from app.models.schemas import FileAnalysisResponse, FileMetadata, ContentDetails, AnalysisRecommendation
from app.services.analyzer import analyze_file
from app.services.cleanup import cleanup_expired_files

logger = logging.getLogger("analyze_router")
router = APIRouter(prefix="/api", tags=["Analysis"])

def generate_pdf_thumbnail(pdf_path: str, preview_path: str):
    """Renders page 1 of a PDF to an image for UI preview."""
    try:
        doc = pymupdf.open(pdf_path)
        if len(doc) > 0:
            page = doc[0]
            pix = page.get_pixmap(dpi=120)
            pix.save(preview_path)
        doc.close()
    except Exception as e:
        logger.warning(f"Could not render PDF preview: {e}")

@router.post("/analyze", response_model=FileAnalysisResponse)
async def analyze_uploaded_file(file: UploadFile = File(...)):
    # Run routine cleanup of expired temp files
    cleanup_expired_files()

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    clean_name = sanitize_filename(file.filename)
    category = get_file_category(clean_name)
    if not category:
        ext = Path(clean_name).suffix.lower()
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format ({ext}). Supported formats: JPG, PNG, WEBP, PDF, MP4, MP3, WAV, and more."
        )

    file_id = uuid.uuid4().hex[:12]
    stored_filename = f"{file_id}_{clean_name}"
    target_upload_path = UPLOAD_DIR / stored_filename

    # Read and validate size in chunks
    total_bytes = 0
    try:
        with open(target_upload_path, 'wb') as out_file:
            while chunk := file.file.read(1024 * 1024):  # 1MB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    out_file.close()
                    target_upload_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed upload size of {MAX_FILE_SIZE_MB} MB."
                    )
                out_file.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        target_upload_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {str(e)}")

    if total_bytes == 0:
        target_upload_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Validate file signature / magic bytes
    valid_sig, sig_err = validate_magic_bytes(str(target_upload_path), category)
    if not valid_sig:
        target_upload_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=sig_err or "Corrupted or invalid file format.")

    # Generate preview if applicable
    preview_url = None
    if category == "image":
        preview_url = f"/api/preview/{file_id}/original"
    elif category == "pdf":
        thumb_name = f"{file_id}_page1.png"
        thumb_path = PREVIEWS_DIR / thumb_name
        generate_pdf_thumbnail(str(target_upload_path), str(thumb_path))
        if thumb_path.exists():
            preview_url = f"/api/preview/{file_id}/original"
    elif category in ("video", "audio"):
        preview_url = f"/api/preview/{file_id}/original"

    # Analyze file content and metadata
    try:
        analysis_data = await analyze_file(str(target_upload_path), clean_name)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing file content: {str(e)}")

    metadata = FileMetadata(
        id=file_id,
        filename=clean_name,
        original_size=total_bytes,
        formatted_size=format_bytes(total_bytes),
        category=category,
        extension=Path(clean_name).suffix.lower().lstrip('.'),
        mime_type=get_mime_type(clean_name)
    )

    return FileAnalysisResponse(
        file=metadata,
        content=ContentDetails(**analysis_data["content"]),
        recommendation=AnalysisRecommendation(**analysis_data["recommendation"]),
        analyzer_source=analysis_data["analyzer_source"],
        preview_url=preview_url
    )
