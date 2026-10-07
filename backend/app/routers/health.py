import PIL
import pymupdf
from fastapi import APIRouter
from app.models.schemas import HealthResponse, ReadyResponse, SubsystemStatus
from app.utils.ffmpeg_utils import is_ffmpeg_available, get_ffmpeg_path
from app.services.ai_gemini import is_gemini_available
from app.config import MAX_FILE_SIZE_MB, PRODUCT_NAME

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    ffmpeg_ok = is_ffmpeg_available()
    return HealthResponse(
        status="healthy",
        service=PRODUCT_NAME,
        ffmpeg_available=ffmpeg_ok,
        ffmpeg_version="available" if ffmpeg_ok else None,
        pillow_version=PIL.__version__,
        pymupdf_available=True,
        gemini_api_configured=is_gemini_available(),
        max_file_size_mb=MAX_FILE_SIZE_MB
    )

@router.get("/ready", response_model=ReadyResponse)
def get_ready():
    ffmpeg_ok = is_ffmpeg_available()
    gemini_ok = is_gemini_available()
    return ReadyResponse(
        status="ready",
        service=PRODUCT_NAME,
        subsystems=SubsystemStatus(
            engine="online",
            image="ready",
            pdf="ready",
            ffmpeg="ready" if ffmpeg_ok else "unavailable",
            ai="gemini" if gemini_ok else "local"
        )
    )
