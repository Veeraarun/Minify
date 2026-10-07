import PIL
import pymupdf
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.utils.ffmpeg_utils import is_ffmpeg_available, get_ffmpeg_path
from app.services.ai_gemini import is_gemini_available
from app.config import MAX_FILE_SIZE_MB

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    ffmpeg_ok = is_ffmpeg_available()
    return HealthResponse(
        status="healthy",
        ffmpeg_available=ffmpeg_ok,
        ffmpeg_version=get_ffmpeg_path() if ffmpeg_ok else None,
        pillow_version=PIL.__version__,
        pymupdf_available=True,
        gemini_api_configured=is_gemini_available(),
        max_file_size_mb=MAX_FILE_SIZE_MB
    )
