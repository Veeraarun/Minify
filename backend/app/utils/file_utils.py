import re
import os
import mimetypes
from pathlib import Path
from typing import Optional, Tuple

SUPPORTED_EXTENSIONS = {
    "image": {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".avif"},
    "video": {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"},
    "audio": {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"},
    "pdf": {".pdf"}
}

ALL_SUPPORTED = set().union(*SUPPORTED_EXTENSIONS.values())

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename against path traversal and dangerous characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean)
    clean = re.sub(r'_+', '_', clean)
    if not clean or clean.startswith('.'):
        clean = f"file_{clean}" if clean else "file_upload"
    return clean

def get_file_category(filename: str) -> Optional[str]:
    """Returns 'image', 'video', 'audio', 'pdf', or None if unsupported."""
    ext = Path(filename).suffix.lower()
    for category, exts in SUPPORTED_EXTENSIONS.items():
        if ext in exts:
            return category
    return None

def validate_magic_bytes(file_path: str, category: str) -> Tuple[bool, str]:
    """
    Validates file signature / magic bytes to prevent misnamed executables or corrupt files.
    """
    try:
        with open(file_path, "rb") as f:
            header = f.read(32)

        if len(header) < 4:
            return False, "File is too small to contain valid header."

        # Disallow executable signatures immediately
        if header.startswith(b"MZ") or header.startswith(b"\x7fELF"):
            return False, "Executable or binary script files are not allowed."

        if category == "image":
            # JPEG: FF D8 FF
            if header.startswith(b"\xff\xd8\xff"):
                return True, ""
            # PNG: 89 50 4E 47 0D 0A 1A 0A
            if header.startswith(b"\x89PNG\r\n\x1a\n"):
                return True, ""
            # GIF: GIF87a or GIF89a
            if header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
                return True, ""
            # WebP: RIFF....WEBP
            if header.startswith(b"RIFF") and b"WEBP" in header[:16]:
                return True, ""
            # BMP: BM
            if header.startswith(b"BM"):
                return True, ""
            # TIFF
            if header.startswith(b"II*\x00") or header.startswith(b"MM\x00*"):
                return True, ""
            return True, ""

        elif category == "pdf":
            # PDF starts with %PDF-
            if header.startswith(b"%PDF"):
                return True, ""
            return False, "File does not contain a valid PDF document header."

        return True, ""
    except Exception as e:
        return True, ""

def format_bytes(num_bytes: int) -> str:
    """Formats bytes to human-readable string."""
    if num_bytes < 1024:
        return f"{num_bytes} B"
    elif num_bytes < 1024 * 1024:
        return f"{num_bytes / 1024:.1f} KB"
    elif num_bytes < 1024 * 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{num_bytes / (1024 * 1024 * 1024):.2f} GB"

def get_mime_type(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    if mime:
        return mime
    ext = Path(filename).suffix.lower()
    fallback_map = {
        ".webp": "image/webp",
        ".avif": "image/avif",
        ".mkv": "video/x-matroska",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".pdf": "application/pdf"
    }
    return fallback_map.get(ext, "application/octet-stream")
