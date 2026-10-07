from fastapi import APIRouter
from typing import Dict, Any, List
from app.models.schemas import AIAssistantRequest, AIAssistantResponse
from app.services.ai_gemini import is_gemini_available, answer_assistant_query_with_gemini

router = APIRouter(prefix="/api", tags=["Assistant"])

def get_local_expert_answer(question: str, context: Dict[str, Any] = None) -> AIAssistantResponse:
    q = question.lower()
    
    # 1. Why low compression?
    if "only compress" in q or "low compression" in q or "small reduction" in q or "20%" in q or "why" in q and "not smaller" in q:
        return AIAssistantResponse(
            answer="""### Why Files May Compress Less Than Expected

1. **Already Compressed Media**: Modern JPGs, MP4s, WebP, and MP3s already use lossy compression with high entropy. Re-compressing already-optimized data yields diminishing returns.
2. **Text / Vector PDFs**: If a PDF consists of raw text and vector paths rather than heavy raster scans, it's already compact.
3. **Small Initial File Size**: Files below 100 KB have container header overhead (ID3 tags, MP4 atoms, PDF xref tables) that cannot be compressed further without corrupting the file structure.

**Pro-Tip**: To achieve higher compression, consider lowering the target resolution (e.g. 1080p to 720p) or switching to modern container formats like **WebP** or **AVIF**.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Switch target format to WebP",
                "Try 75% downscaling",
                "Select 'Maximum Compression' preset"
            ]
        )

    # 2. Which format to use?
    if "which format" in q or "best format" in q or "what format" in q or "codec" in q:
        return AIAssistantResponse(
            answer="""### Recommended Formats by Media Type

- **Photos & Web Graphics**: Use **WebP**. It is 25–35% smaller than JPEG at identical visual quality and natively supports transparency.
- **Documents & Forms**: Keep as **PDF** with stream deflate. Only convert pages to images if strictly archiving scans.
- **Videos for Web / Sharing**: Use **MP4 with H.264 (libx264)** for universal hardware playback across all browsers, mobile devices, and TVs.
- **Speech Audio / Podcasts**: Use **MP3 at 64–96 kbps (mono)** or AAC at 64 kbps.
- **Music Audio**: Use **MP3 at 128–192 kbps (stereo)** for transparent acoustic fidelity.""",
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

Yes! You can use the **Target Size** input in the Compression Engine step.

How our engine achieves your target:
1. **Adaptive Bitrate / Quality Search**: The engine calculates the mathematical bit budget `(Target Bytes × 8) ÷ Duration` or runs iterative binary search on quantization matrices.
2. **Graceful Quality Floor**: If the target cannot be reached without severe visual degradation (e.g. trying to squeeze a 4K 1-hour video into 2 MB), the engine stops at the safe minimum quality and warns you.

**Recommendation**: Enter your target in the "Target File Size" field before clicking Compress.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Enter Target Size (e.g. 5 MB)",
                "Enable Resolution Scaling",
                "Use Balanced Preset"
            ]
        )

    # 4. Will compression reduce quality?
    if "quality" in q or "degrade" in q or "loss" in q or "lossless" in q or "artifact" in q:
        return AIAssistantResponse(
            answer="""### Will Compression Reduce Visual Quality?

- **Lossless Mode**: Zero pixel or structural loss. Preserves exact mathematical data. Recommended for legal records, medical scans, or master artwork.
- **Balanced Mode (Recommended)**: Uses psychoacoustic and perceptual visual models (exploiting limitations of human eye contrast sensitivity). Retains **92–96% SSIM** while cutting file size by 50–70%.
- **Maximum Compression**: Noticeable reduction in high-frequency detail (micro-textures or subtle gradients) in exchange for dramatic 70–85% file size cuts.

Our engine displays an authentic **Quality Check (SSIM / Fidelity score)** after every run so you can inspect the exact fidelity before downloading.""",
            provider="Local Knowledge Engine",
            suggested_actions=[
                "Choose Lossless for documents",
                "Choose Balanced for web photos",
                "Inspect SSIM score after run"
            ]
        )

    # General fallback
    return AIAssistantResponse(
        answer=f"""### AI Compression Assistant

I can help guide you on the best compression strategy for your files!

- **Target Size**: Enter an exact target (e.g. 5 MB) to let the engine automatically calculate optimal quantization and downscaling.
- **Format Modernization**: Converting PNGs and JPGs to WebP typically saves 30–60% with imperceptible difference.
- **Transparency**: RGBA channels are strictly preserved for transparent PNGs and WebP images.
- **Fidelity Guarantee**: We calculate structural similarity (SSIM) on images and provide measured quality metrics so you always know your file's retention rate.

Ask me about formats, quality presets, or specific file targets!""",
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
