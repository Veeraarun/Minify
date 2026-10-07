import json
import logging
import httpx
from typing import Optional, Dict, Any, List
from app.config import GEMINI_API_KEY

logger = logging.getLogger("ai_gemini")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

def is_gemini_available() -> bool:
    return bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 10)

async def analyze_file_with_gemini(
    filename: str,
    category: str,
    file_size_bytes: int,
    media_specs: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Sends file metadata to Gemini 2.5 Flash to generate content-aware compression recommendations.
    Returns structured dict or None on failure.
    """
    if not is_gemini_available():
        return None

    prompt = f"""
You are an expert file compression and media optimization AI engine.
Analyze the following file metadata and provide intelligent compression recommendations.

File Details:
- Filename: {filename}
- Category: {category}
- Original Size: {file_size_bytes} bytes ({file_size_bytes / (1024*1024):.2f} MB)
- Technical Specs: {json.dumps(media_specs)}

Return a strict JSON response (and nothing else) with this exact schema:
{{
  "detected_content": "Short description of detected content (e.g. High-res photograph with rich gradients, Vector text PDF with embedded raster scans, 1080p gaming video, etc.)",
  "compression_strategy": "Detailed strategy recommendation (e.g. Convert to modern WebP lossy at Q=82 with chroma subsampling)",
  "recommended_output_format": "recommended extension (e.g. webp, mp4, pdf, mp3)",
  "expected_reduction_percent": float percentage between 10.0 and 90.0,
  "expected_quality_level": "high" or "balanced" or "maximum",
  "expected_quality_retention": float percentage between 70.0 and 99.0,
  "lossless_recommended": true or false,
  "compressibility": "Very High" or "High" or "Moderate" or "Low" or "Already Compressed",
  "warnings": ["array of warnings if file is already compressed, contains alpha channels, text clarity risks, etc."]
}}
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    try:
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    clean_text = raw_text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    parsed = json.loads(clean_text)
                    return parsed
            else:
                logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")

    return None

async def answer_assistant_query_with_gemini(
    question: str,
    context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """Answers user compression queries using Gemini AI."""
    if not is_gemini_available():
        return None

    context_str = json.dumps(context) if context else "None"
    prompt = f"""
You are the MINIFY Assistant inside 'MINIFY: Intelligent File Optimization'.
You provide clear, friendly, and technically accurate advice on file compression, media codecs (WebP, AVIF, H.264, MP3), quality tradeoffs, and size targets.

User Question: {question}
Current File / System Context: {context_str}

Respond in concise markdown with helpful technical explanation and practical advice.
Also provide 2-3 short suggested next actions.

Return strict JSON:
{{
  "answer": "Your markdown answer",
  "suggested_actions": ["Action 1", "Action 2", "Action 3"]
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json"
        }
    }

    try:
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                return json.loads(raw_text)
    except Exception as e:
        logger.warning(f"Gemini assistant error: {e}")

    return None
