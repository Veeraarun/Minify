from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool
    ffmpeg_version: Optional[str] = None
    pillow_version: str
    pymupdf_available: bool
    gemini_api_configured: bool
    max_file_size_mb: int

class FileMetadata(BaseModel):
    id: str
    filename: str
    original_size: int
    formatted_size: str
    category: str  # image, video, audio, pdf
    extension: str
    mime_type: str

class AnalysisRecommendation(BaseModel):
    compression_strategy: str
    recommended_output_format: str
    expected_reduction_percent: float
    expected_output_size: int
    expected_output_size_formatted: str
    expected_quality_level: str  # high, balanced, maximum
    expected_quality_retention: float
    lossless_recommended: bool
    warnings: List[str] = []

class ContentDetails(BaseModel):
    # Media-specific metadata
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    pages: Optional[int] = None
    bitrate: Optional[int] = None
    fps: Optional[float] = None
    video_codec: Optional[str] = None
    audio_codec: Optional[str] = None
    has_transparency: Optional[bool] = None
    is_animated: Optional[bool] = None
    is_already_compressed: bool = False
    is_encrypted: bool = False
    content_category: str  # e.g. "Photographic Scene", "Text-heavy Document", "Speech Audio"
    compressibility: str   # "Very High", "High", "Moderate", "Low", "Already Compressed"

class FileAnalysisResponse(BaseModel):
    file: FileMetadata
    content: ContentDetails
    recommendation: AnalysisRecommendation
    analyzer_source: str  # "Gemini AI (Cloud)" or "Local AI-assisted analysis"
    preview_url: Optional[str] = None

class CompressionOptions(BaseModel):
    file_id: str
    target_size_mb: Optional[float] = None
    quality_preset: str = "balanced"  # max_compression, balanced, high_quality, lossless, custom
    custom_quality: Optional[int] = None  # 1 to 100
    output_format: Optional[str] = None  # webp, jpg, png, mp4, mp3, pdf, etc.
    resize_percentage: Optional[int] = None  # 100, 75, 50, etc.
    strip_metadata: bool = True
    audio_preset: Optional[str] = None  # speech, music

class QualityResult(BaseModel):
    original_size: int
    compressed_size: int
    original_formatted: str
    compressed_formatted: str
    reduction_percentage: float
    quality_score: float  # 0 to 100
    metric_name: str      # e.g., "SSIM (Structural Similarity)", "Perceptual Bitrate Score", "PDF Structural Compression"
    is_measured: bool     # True for real computed SSIM, False for model estimate
    target_size_bytes: Optional[int] = None
    target_reached: Optional[bool] = None
    quality_tradeoff_note: Optional[str] = None
    original_specs: Dict[str, Any] = {}
    output_specs: Dict[str, Any] = {}

class CompressionResult(BaseModel):
    file_id: str
    original_filename: str
    compressed_filename: str
    category: str
    download_url: str
    original_preview_url: Optional[str] = None
    compressed_preview_url: Optional[str] = None
    compression_method: str
    processing_time_ms: float
    quality: QualityResult
    warnings: List[str] = []

class BatchCompressRequest(BaseModel):
    file_ids: List[str]
    target_size_mb: Optional[float] = None
    quality_preset: str = "balanced"
    output_format: Optional[str] = None

class BatchCompressResponse(BaseModel):
    results: List[CompressionResult]
    total_original_size: int
    total_compressed_size: int
    overall_reduction_percentage: float
    download_all_zip_url: str

class AIAssistantRequest(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None

class AIAssistantResponse(BaseModel):
    answer: str
    provider: str  # "Gemini AI" or "Local Knowledge Engine"
    suggested_actions: List[str] = []
