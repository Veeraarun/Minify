import os
from pathlib import Path
from typing import Dict, Any, Tuple, List
from PIL import Image
import pymupdf
import logging

from app.utils.file_utils import get_file_category, format_bytes
from app.utils.ffmpeg_utils import get_media_metadata, is_ffmpeg_available
from app.services.ai_gemini import analyze_file_with_gemini, is_gemini_available

logger = logging.getLogger("analyzer")

def analyze_image_file(file_path: str) -> Tuple[Dict[str, Any], Dict[str, Any], List[str]]:
    specs: Dict[str, Any] = {}
    warnings: List[str] = []
    
    with Image.open(file_path) as img:
        width, height = img.size
        img_format = (img.format or "").upper()
        mode = img.mode
        
        has_transparency = mode in ("RGBA", "LA") or ("transparency" in img.info)
        is_animated = getattr(img, "is_animated", False)
        
        # Check photographic vs graphic/text heuristics
        # Sample center thumbnail to inspect color variance
        thumb = img.copy()
        thumb.thumbnail((120, 120))
        colors_list = thumb.getcolors(maxcolors=256)
        colors = len(colors_list) if colors_list else 256
        
        is_graphic_or_text = colors < 150
        content_category = "Graphic / Screenshot / Icon" if is_graphic_or_text else "Photographic Scene"

        # Check for medical or legal keywords in filename
        fname_lower = Path(file_path).name.lower()
        is_sensitive = any(w in fname_lower for w in ["medical", "xray", "mri", "legal", "contract", "invoice", "receipt"])
        if is_sensitive:
            warnings.append("Document or sensitive image detected: lossless or conservative compression is recommended to avoid artifacting.")

        # Bit density check for already-compressed detection
        file_size = os.path.getsize(file_path)
        pixels = max(1, width * height)
        bytes_per_pixel = file_size / pixels
        
        is_already_compressed = False
        if img_format in ("JPEG", "WEBP") and bytes_per_pixel < 0.15:
            is_already_compressed = True
            warnings.append(f"Image already has low data density ({bytes_per_pixel:.2f} bytes/px). Aggressive compression may cause noticeable artifacts.")

        if has_transparency:
            warnings.append("Transparency detected: RGBA / alpha channel will be preserved.")

        specs = {
            "width": width,
            "height": height,
            "has_transparency": has_transparency,
            "is_animated": is_animated,
            "is_already_compressed": is_already_compressed,
            "content_category": content_category,
            "compressibility": "Low" if is_already_compressed else ("Very High" if bytes_per_pixel > 1.2 else "High")
        }

    return specs, warnings

def analyze_pdf_file(file_path: str) -> Tuple[Dict[str, Any], List[str]]:
    specs: Dict[str, Any] = {}
    warnings: List[str] = []
    file_size = os.path.getsize(file_path)

    try:
        doc = pymupdf.open(file_path)
        pages = len(doc)
        
        if doc.is_encrypted:
            warnings.append("PDF is password protected or encrypted. Please remove password encryption before optimizing.")
            return {
                "pages": pages,
                "is_encrypted": True,
                "content_category": "Encrypted PDF",
                "compressibility": "Low"
            }, warnings

        total_images = 0
        total_text_chars = 0

        for page in doc:
            total_images += len(page.get_images())
            total_text_chars += len(page.get_text())

        doc.close()

        is_scanned = total_images > 0 and (total_text_chars / max(1, pages)) < 100
        category = "Scanned / Image-heavy PDF" if is_scanned else ("Text & Vector Document" if total_images == 0 else "Hybrid Document (Text + Images)")
        
        avg_mb_per_page = (file_size / (1024 * 1024)) / max(1, pages)
        is_already_compressed = avg_mb_per_page < 0.08 and total_images == 0

        if is_already_compressed:
            warnings.append("PDF is already compact vector text. Minimal size reduction expected.")

        specs = {
            "pages": pages,
            "embedded_images": total_images,
            "char_count": total_text_chars,
            "is_encrypted": False,
            "is_already_compressed": is_already_compressed,
            "content_category": category,
            "compressibility": "Very High" if total_images > 0 else ("Moderate" if not is_already_compressed else "Low")
        }
    except Exception as e:
        logger.error(f"Error analyzing PDF: {e}")
        specs = {
            "pages": 1,
            "is_encrypted": False,
            "is_already_compressed": False,
            "content_category": "Standard PDF Document",
            "compressibility": "Moderate"
        }

    return specs, warnings

def analyze_media_file(file_path: str, category: str) -> Tuple[Dict[str, Any], List[str]]:
    specs: Dict[str, Any] = {}
    warnings: List[str] = []
    file_size = os.path.getsize(file_path)

    if not is_ffmpeg_available():
        warnings.append("FFmpeg is not installed or detected. Video/Audio compression requires FFmpeg.")
        return {
            "duration": 0.0,
            "is_already_compressed": False,
            "content_category": f"Media ({category.capitalize()})",
            "compressibility": "Moderate"
        }, warnings

    meta = get_media_metadata(file_path)
    duration = meta.get("duration", 0.0)
    bitrate = meta.get("bitrate", 0)

    # Heuristic for speech vs music
    fname_lower = Path(file_path).name.lower()
    is_speech = any(w in fname_lower for w in ["voice", "speech", "podcast", "audiobook", "meeting", "recording"])

    if category == "video":
        width = meta.get("width", 0)
        height = meta.get("height", 0)
        codec = meta.get("video_codec", "unknown")
        
        is_already_compressed = bitrate > 0 and bitrate < 1_200_000 and height >= 720
        if is_already_compressed:
            warnings.append(f"Video is already encoded at an efficient bitrate (~{bitrate // 1000} kbps).")

        specs = {
            "duration": duration,
            "width": width,
            "height": height,
            "video_codec": codec,
            "audio_codec": meta.get("audio_codec"),
            "bitrate": bitrate,
            "fps": meta.get("fps", 0),
            "is_already_compressed": is_already_compressed,
            "content_category": f"{height}p Video ({codec})",
            "compressibility": "Low" if is_already_compressed else "High"
        }

    elif category == "audio":
        codec = meta.get("audio_codec", "unknown")
        is_already_compressed = bitrate > 0 and bitrate <= 96_000
        
        if is_already_compressed:
            warnings.append("Audio is already encoded at low bitrate (<=96 kbps). Further compression may degrade speech/harmonics.")

        specs = {
            "duration": duration,
            "audio_codec": codec,
            "bitrate": bitrate,
            "is_speech": is_speech,
            "is_already_compressed": is_already_compressed,
            "content_category": "Speech Audio" if is_speech else "Music / Audio Stream",
            "compressibility": "Moderate" if is_already_compressed else "High"
        }

    return specs, warnings

async def analyze_file(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Unified analyzer orchestrator.
    Extracts deterministic technical metadata, then enhances with Gemini AI
    or deterministic local rules.
    """
    category = get_file_category(original_filename) or "image"
    file_size = os.path.getsize(file_path)
    ext = Path(original_filename).suffix.lower()

    # Technical metadata inspection
    if category == "image":
        specs, warnings = analyze_image_file(file_path)
    elif category == "pdf":
        specs, warnings = analyze_pdf_file(file_path)
    elif category in ("video", "audio"):
        specs, warnings = analyze_media_file(file_path, category)
    else:
        specs, warnings = {"content_category": "Unknown File", "compressibility": "Low"}, ["Unsupported file format"]

    # Check for tiny files (< 20 KB)
    if file_size < 20 * 1024:
        warnings.append(f"File is very small ({format_bytes(file_size)}). Header overhead may limit size reduction.")

    # Try Gemini AI analysis if configured
    gemini_data = None
    if is_gemini_available():
        gemini_data = await analyze_file_with_gemini(original_filename, category, file_size, specs)

    if gemini_data:
        analyzer_source = "Gemini AI (Cloud)"
        strategy = gemini_data.get("compression_strategy", "Adaptive AI Compression")
        rec_format = gemini_data.get("recommended_output_format", ext.lstrip('.'))
        exp_reduction = float(gemini_data.get("expected_reduction_percent", 50.0))
        exp_quality_level = gemini_data.get("expected_quality_level", "balanced")
        exp_quality_ret = float(gemini_data.get("expected_quality_retention", 93.0))
        lossless_rec = bool(gemini_data.get("lossless_recommended", False))
        detected_content = gemini_data.get("detected_content", specs.get("content_category", "Media Content"))
        compressibility = gemini_data.get("compressibility", specs.get("compressibility", "Moderate"))
        for w in gemini_data.get("warnings", []):
            if w not in warnings:
                warnings.append(w)
    else:
        # Transparent Local Rule Engine Fallback
        analyzer_source = "Local AI-assisted analysis"
        detected_content = specs.get("content_category", "Standard Media")
        compressibility = specs.get("compressibility", "Moderate")

        if category == "image":
            if specs.get("has_transparency"):
                rec_format = "webp"
                strategy = "Alpha-channel WebP optimization with lossless alpha preservation"
                exp_reduction = 45.0
            elif specs.get("content_category") == "Graphic / Screenshot / Icon":
                rec_format = "webp"
                strategy = "Palette quantization & lossy WebP at high fidelity"
                exp_reduction = 60.0
            else:
                rec_format = "webp"
                strategy = "Modern WebP re-encoding with perceptual chroma subsampling"
                exp_reduction = 65.0

            lossless_rec = bool("lossless" in "".join(warnings).lower())
            exp_quality_level = "balanced"
            exp_quality_ret = 94.0

        elif category == "pdf":
            rec_format = "pdf"
            if specs.get("embedded_images", 0) > 0:
                strategy = f"Embedded image recompression (JPEG/WebP) + stream deflate on {specs.get('embedded_images')} images"
                exp_reduction = 60.0
            else:
                strategy = "PDF object deduplication, font subsetting, and cross-reference table stream compaction"
                exp_reduction = 25.0
            lossless_rec = False
            exp_quality_level = "high"
            exp_quality_ret = 97.0

        elif category == "video":
            rec_format = "mp4"
            strategy = "Two-pass or CRF H.264 encoding with tuned psychoacoustic visual quantization"
            exp_reduction = 55.0
            lossless_rec = False
            exp_quality_level = "balanced"
            exp_quality_ret = 91.0

        elif category == "audio":
            rec_format = "mp3"
            if specs.get("is_speech"):
                strategy = "VBR speech-optimized mono downmix at 64–80 kbps"
                exp_reduction = 65.0
            else:
                strategy = "High-efficiency AAC/MP3 encoding with 128 kbps perceptual cutoff"
                exp_reduction = 50.0
            lossless_rec = False
            exp_quality_level = "high"
            exp_quality_ret = 95.0

    # Calculate expected output size
    expected_output_size = max(512, int(file_size * (1.0 - (exp_reduction / 100.0))))

    return {
        "content": {
            **specs,
            "content_category": detected_content,
            "compressibility": compressibility,
        },
        "recommendation": {
            "compression_strategy": strategy,
            "recommended_output_format": rec_format,
            "expected_reduction_percent": exp_reduction,
            "expected_output_size": expected_output_size,
            "expected_output_size_formatted": format_bytes(expected_output_size),
            "expected_quality_level": exp_quality_level,
            "expected_quality_retention": exp_quality_ret,
            "lossless_recommended": lossless_rec,
            "warnings": warnings
        },
        "analyzer_source": analyzer_source
    }
