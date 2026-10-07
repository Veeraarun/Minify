# MINIFY
### Intelligent File Optimization

> *"Compress files intelligently while preserving the quality that matters."*

MINIFY is a modern, high-performance file optimization platform designed to drastically reduce asset footprints across images, video, audio, and PDF documents without sacrificing perceptual fidelity. Powered by automated content diagnostics, iterative binary-search quantization, measured Structural Similarity Index (SSIM) verification, and an intelligent recommendation layer.

---

## 📌 The Problem MINIFY Solves
Standard compression utilities either aggressively degrade visual clarity with arbitrary quality sliders or produce bloated files due to unoptimized container overhead and unquantized streams. Content creators and developers often don't know the exact combination of CRF, quantization matrices, chroma subsampling, and container profiles suited for their specific assets.

**MINIFY** solves this with an intelligent, 5-stage workflow:
1. **Content Diagnostics**: Inspects raster entropy, magic byte signatures, codec parameters, and alpha channels.
2. **Strategy Selection**: Recommends the optimal container format and compression profile with clear rationale (*"Why MINIFY chose this"*).
3. **Adaptive Quantization**: Dynamically tunes matrices or runs binary search to meet exact target size constraints (e.g. *"under 2.5 MB"*).
4. **Objective Quality Verification**: Quantifies visual fidelity with measured mathematical SSIM before delivery.
5. **Private Ephemeral Delivery**: Instant downloads with automated background purging.

---

## ✨ Features & Capabilities

- **5-Step Directed Pipeline**:
  - `01 Upload`: Multi-file drag-and-drop queue with magic-byte validation and live status indicators.
  - `02 Content Analysis`: Metadata diagnostics, compressibility rating, and explanatory rationale.
  - `03 Compression Engine`: Preset profiles (*Smart Optimize*, *Web Delivery*, *Email Safe*, *Social & Feed*, *Maximum Savings*, *Custom*), Quality vs Size slider, exact target size threshold, and collapsible advanced settings.
  - `04 Quality Check`: Measured SSIM scores, bytes saved callouts, and an **interactive before/after comparison slider** (plus side-by-side and A/B toggle modes).
  - `05 Output & Download`: Itemized download links or one-click **Batch ZIP Archive**.

- **Multi-Format Media Engine**:
  - **Images**: JPEG, PNG, WebP, GIF (alpha channel preservation, EXIF sanitization, WebP lossy/lossless).
  - **PDF Documents**: PyMuPDF object stream deflation, font subsetting, and raster downsampling while keeping vector text sharp.
  - **Videos**: MP4, MKV, MOV, AVI (H.264/AAC with CRF rate control, two-pass target size matching).
  - **Audio Tracks**: MP3, WAV, AAC, M4A with dedicated Voice/Speech and Hi-Fi Music psychoacoustic profiles.

- **Objective Quality Verification**:
  - Computes mathematical **Structural Similarity Index (SSIM)** against the reference master.
  - Interactive split slider enables real-time visual inspection at 1:1 pixel fidelity.
  - Dual players for video and audio stream verification; Page 1 rendered previews for PDF documents.

- **Transparent AI Diagnostics**:
  - Cloud-assisted recommendations via Google Gemini API (`GEMINI_API_KEY`).
  - Deterministic local rule engine fallback clearly labeled as **"Local analysis"** when no API key is supplied.
  - Slide-over **MINIFY Assistant** for conversational guidance on codecs, formats, and quality limits.

- **Private by Design & Production Hardened**:
  - **Magic-Byte Inspection**: Validates binary file headers to block disguised executable payloads.
  - **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict referrer policies.
  - **Automated Ephemeral Purging**: Background worker continuously evicts temporary files older than 1 hour.
  - **Local Optimization History**: Stores recent optimization receipts locally in the user's browser `localStorage` (no server-side tracking).

---

## 🏗️ Architecture & Technology Stack

```
                   ┌────────────────────────────────────────┐
                   │           Frontend (SPA)               │
                   │    React 19 + Vite 6 + Tailwind CSS    │
                   │    Lucide Icons, Dark SaaS Interface   │
                   └──────────────────┬─────────────────────┘
                                      │ REST API / JSON
                                      ▼
                   ┌────────────────────────────────────────┐
                   │             MINIFY Backend             │
                   │       FastAPI + Security Headers       │
                   └───────┬────────────────────────┬───────┘
                           │                        │
             ┌─────────────┴────────────┐     ┌─────┴──────────────────┐
             │ Content Analyzer Service │     │ AI Recommendation      │
             │ - PIL Metadata & Alpha   │     │ - Gemini 2.5 Flash API │
             │ - PyMuPDF Page & XRefs   │     │ - Local Knowledge Base │
             │ - FFprobe Bitrate & Codec│     └────────────────────────┘
             └─────────────┬────────────┘
                           │
      ┌────────────────────┴────────────────────────────────┐
      │               Core Compression Engines              │
      ├──────────────────┬─────────────────┬────────────────┤
      │  Pillow Engine   │  PyMuPDF Stream │ FFmpeg Engine  │
      │  WebP / JPG / PNG│  Deflate & JPEG │ H.264 & MP3    │
      └──────────────────┴─────────────────┴────────────────┘
                           │
             ┌─────────────┴────────────┐
             │ Quality Verification     │
             │ - NumPy Block-based SSIM │
             │ - Container Integrity    │
             └──────────────────────────┘
```

- **Frontend**: React 19, Vite 6, Tailwind CSS 3.4, Lucide React icons, Oxlint.
- **Backend**: Python 3.10+ (tested on Python 3.14), FastAPI, Uvicorn, Pydantic v2.
- **Core Processors**: Pillow, PyMuPDF (fitz), NumPy, FFmpeg.
- **AI Integration**: Google Gemini API via REST with deterministic local rule fallback.

---

## 📂 Project Structure

```
Webenoid/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic request/response contracts
│   │   ├── routers/
│   │   │   ├── health.py              # GET /api/health and GET /api/ready
│   │   │   ├── analyze.py             # POST /api/analyze (magic byte guard)
│   │   │   ├── compress.py            # POST /api/compress, /api/batch-compress, downloads
│   │   │   └── assistant.py           # POST /api/ai-assistant
│   │   ├── services/
│   │   │   ├── ai_gemini.py           # Gemini cloud recommendations
│   │   │   ├── analyzer.py            # Content diagnostics & local rule engine
│   │   │   ├── image_compressor.py    # Pillow WebP/JPEG/PNG/GIF engine
│   │   │   ├── pdf_compressor.py      # PyMuPDF stream deflate & image re-encoder
│   │   │   ├── video_compressor.py    # FFmpeg H.264/AAC encoder with CRF & target search
│   │   │   ├── audio_compressor.py    # FFmpeg MP3/AAC speech/music engine
│   │   │   ├── quality_checker.py     # NumPy SSIM calculation
│   │   │   └── cleanup.py             # Auto-eviction of temporary files (>1 hour)
│   │   ├── utils/
│   │   │   ├── ffmpeg_utils.py        # FFmpeg & FFprobe binary auto-detection
│   │   │   └── file_utils.py          # Magic byte validator, categories & formatters
│   │   ├── config.py                  # Product settings, limits & paths
│   │   └── main.py                    # FastAPI root application & security middleware
│   ├── tests/
│   │   └── test_api.py                # 10 automated integration and unit test suites
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx             # MINIFY wordmark, nav, live status, Assistant trigger
│   │   │   ├── WorkflowStepper.jsx    # 5-stage progress navigation
│   │   │   ├── UploadZone.jsx         # Drag-and-drop zone, queue pills & privacy pledge
│   │   │   ├── ContentAnalysisCard.jsx# Diagnostics, "Why MINIFY chose this" rationale
│   │   │   ├── CompressionEngineCard.jsx # Presets, slider, target size, advanced accordion
│   │   │   ├── QualityCheckCard.jsx   # SSIM score, interactive before/after split slider
│   │   │   ├── ResultOutputCard.jsx   # Optimization report receipt & batch ZIP download
│   │   │   └── AIAssistantDrawer.jsx  # Slide-over chat consultation drawer
│   │   ├── services/
│   │   │   └── api.js                 # API client with health, analyze, compress & assistant
│   │   ├── App.jsx                    # Root state coordinator with How-it-works, Privacy, History
│   │   ├── index.css                  # Dark theme stylesheet & custom scrollbars
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── README.md
└── .gitignore
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm
- FFmpeg in PATH (optional for video/audio, images & PDFs work without FFmpeg)

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate       # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
python -m pip install -r requirements.txt

# Create .env file (optional; local analysis works without keys)
copy .env.example .env

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API is available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The interface is available at `http://localhost:5173`.

---

## 🧪 Verification & Testing

### Automated Backend Test Suite
Run the 10 automated test suites covering health checks, image analysis, WebP conversion, target-size iteration, PDF compression, security guards, empty uploads, video/audio encoding, batch processing, and the AI assistant:

```bash
cd backend
python -m pytest tests/test_api.py -v
```

Expected output:
```
tests/test_api.py::test_health_endpoint PASSED                           [ 10%]
tests/test_api.py::test_upload_and_analyze_image PASSED                  [ 20%]
tests/test_api.py::test_compress_image PASSED                            [ 30%]
tests/test_api.py::test_target_size_compression PASSED                   [ 40%]
tests/test_api.py::test_pdf_compression PASSED                           [ 50%]
tests/test_api.py::test_invalid_unsupported_file PASSED                  [ 60%]
tests/test_api.py::test_empty_file_upload PASSED                         [ 70%]
tests/test_api.py::test_video_and_audio_compression PASSED               [ 80%]
tests/test_api.py::test_batch_compression PASSED                         [ 90%]
tests/test_api.py::test_ai_assistant PASSED                              [100%]
============================== 10 passed in 6.33s ==============================
```

### Frontend Lint & Production Build
```bash
cd frontend
npm run lint    # Oxlint (0 errors, 0 warnings)
npm run build   # Vite production build (0 errors)
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Basic health status, installed FFmpeg status, and Gemini flag |
| `GET` | `/api/ready` | Structured subsystem readiness (`engine`, `image`, `pdf`, `ffmpeg`, `ai`) |
| `POST` | `/api/analyze` | Uploads file, verifies magic bytes, analyzes entropy & metadata |
| `POST` | `/api/compress` | Optimizes file with specified preset or target size, computes SSIM |
| `POST` | `/api/batch-compress` | Batch optimizes up to 25 files and prepares ZIP archive |
| `GET` | `/api/download/{file_id}` | Streams optimized individual file |
| `GET` | `/api/download-all/{zip_id}`| Streams combined batch ZIP archive |
| `GET` | `/api/preview/{file_id}/{variant}` | Serves preview stream (original or compressed) |
| `POST` | `/api/ai-assistant` | Context-aware compression guidance chatbot |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | `""` | Optional Google Gemini API key. If unset, MINIFY uses the deterministic local analyzer. |
| `MAX_FILE_SIZE_MB` | `100` | Maximum upload limit per file in megabytes. |
| `MAX_BATCH_FILES` | `25` | Maximum number of files in a single batch. |
| `HOST` | `0.0.0.0` | Server bind host. |
| `PORT` | `8000` | Server bind port. |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins. |
| `FFMPEG_PATH` | `""` | Optional manual path to FFmpeg binary if not in system PATH. |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `""` | Base API URL. In local dev, leave empty to use Vite's `/api` proxy. |

---

## 🔒 Security & Privacy Guarantees

1. **Magic-Byte Filtering**: Every uploaded file is inspected at byte offset 0 to verify authentic headers (e.g. `\xFF\xD8\xFF` for JPEG, `%PDF` for PDF, `RIFF...WEBP`) and reject binary executables (`MZ`, `ELF`).
2. **Ephemeral Disk Isolation**: Files exist only in isolated temporary workspaces on the server.
3. **Automated Pruning**: A background thread evicts temporary files older than 1 hour.
4. **Metadata Stripping**: Users can automatically strip EXIF geolocation, camera metadata, and document author tags.
5. **No Telemetry**: No document or image contents are logged or stored permanently.

---

## 📄 License
MIT License. Built with FastAPI, Pillow, PyMuPDF, FFmpeg, and React.
