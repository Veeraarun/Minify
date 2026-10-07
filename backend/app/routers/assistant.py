from fastapi import APIRouter
from typing import Dict, Any, List
from app.models.schemas import AIAssistantRequest, AIAssistantResponse
from app.services.ai_gemini import is_gemini_available, answer_assistant_query_with_gemini

router = APIRouter(prefix="/api", tags=["Assistant"])

def get_local_expert_answer(question: str, context: Dict[str, Any] = None) -> AIAssistantResponse:
    q = question.lower()
    
    # 1. Why low compression?
    if "only compress" in q or "low compression" in q or "small reduction" in q or "20%" in q or ("why" in q and "not smaller" in q):
        return AIAssistantResponse(
            answer="""### Why Files May Compress Less Than Expected

1. **Already Optimized Media**: Modern JPEGs, MP4s, WebP, and MP3s already utilize lossy entropy compression. Re-compressing already-optimized data yields diminishing returns.
2. **Text & Vector PDFs**: If a PDF consists of raw vector paths and embedded font subsets rather than high-DPI raster scans, it is already compact.
3. **Container Header Overhead**: Files below 100 KB have container header overhead (ID3 tags, MP4 atoms, PDF xref tables) that cannot be stripped without corrupting file structure.

**Recommendation**: To achieve higher compression, consider selecting the **Web** or **Maximum Savings** preset, or enabling 75% resolution scaling.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Switch to WebP format",
                "Try 75% downscaling",
                "Select 'Maximum Savings' preset"
            ]
        )

    # 2. Which format to use?
    if "which format" in q or "best format" in q or "what format" in q or "codec" in q:
        return AIAssistantResponse(
            answer="""### Recommended Formats by Media Type

- **Images & Photos**: Use **WebP**. It is typically 25–35% smaller than JPEG at identical visual quality and natively preserves alpha transparency.
- **Documents & Forms**: Retain **PDF** with stream deflate. Text remains 100% crisp and selectable.
- **Videos for Web / Sharing**: Use **MP4 with H.264 (libx264)** for universal hardware compatibility across all modern devices and browsers.
- **Speech & Voice**: Use **MP3 at 64–96 kbps (mono)** or AAC at 64 kbps.
- **Music & Hi-Fi**: Use **MP3 at 128–192 kbps (stereo)** for transparent acoustic fidelity.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Convert images to WebP",
                "Use MP4 H.264 for videos",
                "Use 128 kbps MP3 for audio"
            ]
        )

    # 3. Target size questions (under 5MB, etc.)
    if "under" in q or "below" in q or "target" in q or "5 mb" in q or "limit" in q or "target size" in q:
        return AIAssistantResponse(
            answer="""### Compressing to an Exact Target Size

Yes! You can specify an exact target size (e.g. 5 MB) under the **Target File Size** option.

How MINIFY achieves your target:
1. **Adaptive Bitrate & Quantization Search**: MINIFY computes the exact bit budget `(Target Bytes × 8) ÷ Duration` or runs iterative binary search on quantization parameters.
2. **Safe Quality Floor**: If the target cannot be safely reached without extreme visual degradation, MINIFY stops at the safe minimum quality and notifies you.

**Recommendation**: Enter your target in the target size input field before starting optimization.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Set Target Size (e.g. 5 MB)",
                "Enable Resolution Scaling",
                "Use Smart Optimize"
            ]
        )

    # 4. Will compression reduce quality?
    if "quality" in q or "degrade" in q or "loss" in q or "lossless" in q or "artifact" in q:
        return AIAssistantResponse(
            answer="""### Will Optimization Reduce Visual Quality?

- **Smart Optimize (Default)**: Uses perceptual psychoacoustic and contrast-sensitivity models. Retains **92–96% SSIM** while reducing size by 50–70%.
- **Lossless Mode**: Zero pixel or structural loss. Preserves exact mathematical data. Recommended for archival records, scans, or master artwork.
- **Maximum Savings**: Applies higher quantization to high-frequency textures for maximum space savings (70–85%).

MINIFY measures objective **Structural Similarity (SSIM)** on images so you can inspect verified fidelity before downloading.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Choose Smart Optimize",
                "Choose Lossless for archival",
                "Inspect SSIM score after run"
            ]
        )

    # General fallback
    return AIAssistantResponse(
        answer="""### MINIFY Assistant

I can help guide you on the best optimization strategy for your files:

- **Smart Optimize**: Automatically analyzes file characteristics and selects the ideal quantization and container settings.
- **Target Size**: Enter an exact target (e.g. 5 MB) to let MINIFY automatically calibrate bitrate and downscaling.
- **Transparency Preservation**: Alpha channels are strictly preserved for transparent PNGs and WebP graphics.
- **Quality Verification**: Objective structural similarity (SSIM) is computed for images to guarantee visual retention.

Ask me about formats, optimization presets, or file limits!""",
        provider="Local Knowledge Engine",
        suggested_actions=[
            "Why did my file only compress by 20%?",
            "Which format should I use?",
            "Can I compress this below 5 MB?",
            "Will compression reduce quality?"
        ]
    )

@router.post("/ai-assistant", response_model=AIAssistantResponse)
async def query_ai_assistant(req: AIAssistantRequest):
    if is_gemini_available():
        res = await answer_assistant_query_with_gemini(req.question, req.context)
        if res:
            return AIAssistantResponse(
                answer=res.get("answer", ""),
                provider="Gemini AI",
                suggested_actions=res.get("suggested_actions", [])
            )

    return get_local_expert_answer(req.question, req.context or {})
