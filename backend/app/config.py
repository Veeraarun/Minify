import os
from pathlib import Path
from typing import List

# Base directory of the backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Product metadata
PRODUCT_NAME = "MINIFY"
PRODUCT_TAGLINE = "Intelligent file optimization"

# Configurable settings via environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_BATCH_FILES = int(os.getenv("MAX_BATCH_FILES", "25"))

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# CORS
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
CORS_ORIGINS: List[str] = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]
if not CORS_ORIGINS:
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

# FFmpeg custom path
FFMPEG_PATH_OVERRIDE = os.getenv("FFMPEG_PATH", "").strip()

# Storage directories
STORAGE_DIR = BASE_DIR / "temp_storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
PREVIEWS_DIR = STORAGE_DIR / "previews"

# Create directories on startup
for path in (UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR):
    path.mkdir(parents=True, exist_ok=True)

# Retention policy (in seconds)
FILE_RETENTION_SECONDS = int(os.getenv("FILE_RETENTION_SECONDS", "3600"))  # default 1 hour
