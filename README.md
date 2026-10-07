# AI Compressor

An intelligent, multi-format media optimization and compression platform designed to drastically reduce file sizes while maintaining perceptual fidelity. Powered by automated content diagnostics, structural similarity index (SSIM) verification, adaptive quantization algorithms, and an AI-assisted recommendation layer.

---

## 📌 Problem Statement
Traditional compression tools either aggressively destroy visual fidelity with fixed quality presets or produce bloated files due to unoptimized container overhead and unquantized raster streams. Users rarely know the optimal combination of CRF, bitrate, chroma subsampling, and container format needed for their specific media file.

**AI Compressor** bridges this gap by automatically diagnosing file structure, recommending optimal encoding profiles, dynamically iterating toward user-specified target file sizes (e.g. *"under 5 MB"*), and verifying objective quality (measured SSIM) before download.

---

## ✨ Features

- **5-Step Directed Workflow Stepper**: `Upload` ➔ `Content Analysis` ➔ `Compression Engine` ➔ `Quality Check` ➔ `Output & Download`.
- **True Multi-Format Support**:
  - **Images**: JPG, JPEG, PNG, WEBP, GIF (animated frame-by-frame optimization).
  - **Videos**: MP4, MOV, MKV, AVI (H.264/AAC with two-pass and CRF support).
  - **PDF Documents**: Embedded raster downsampling, font subsetting, and object stream deflation while preserving 100% vector text readability.
  - **Audio Tracks**: MP3, WAV, AAC, M4A with dedicated Speech and Hi-Fi Music psychoacoustic profiles.
- **Real AI-Assisted Diagnostics**:
  - Direct integration with Google Gemini 2.5 Flash via `GEMINI_API_KEY`.
  - Transparent deterministic fallback labeled **"Local AI-assisted analysis"** when no API key is supplied.
- **Target Size Matching**:
  - Iteratively executes binary search on quantization parameters and downscale factors until user-defined size limits (e.g. 5 MB) are satisfied.
  - Enforces safe quality floors to prevent severe pixelation.
- **Mathematical Quality Verification**:
  - Computes objective **Structural Similarity Index (SSIM)** on images via block-based luminance variance.
  - Distinguishes measured mathematical metrics from empirical psychoacoustic/VMAF estimates.
- **Interactive Previews**:
  - Side-by-side and A/B toggle visual comparisons for images.
  - First-page rendered previews for PDFs.
  - Native HTML5 dual-player comparisons for videos and audio streams.
- **Batch Processing & ZIP Archival**:
  - Simultaneous multi-file queuing, analysis, and compression.
  - Individual asset downloads or one-click **"Download All as ZIP"**.
- **Interactive AI Compression Assistant**:
  - Non-blocking slide-over drawer answering queries on codecs, compression limits, and quality tradeoffs.

---

## 🏗️ Architecture & Technology Stack

```
                   ┌────────────────────────────────────────┐
                   │           Frontend (SPA)               │
                   │    React + Vite + Tailwind CSS         │
                   │    Lucide Icons, Dark UI Dashboard     │
                   └──────────────────┬─────────────────────┘
                                      │ REST API / JSON
                                      ▼
                   ┌────────────────────────────────────────┐
                   │           FastAPI Backend              │
                   │   App Routing, Lifespan & File Guards  │
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

### Stack Components
- **Frontend**: React 19, Vite 6, Tailwind CSS 3.4, Lucide React icons.
- **Backend**: Python 3.10+ / 3.14, FastAPI, Uvicorn, Pydantic v2.
- **Processing Libraries**: Pillow, PyMuPDF (fitz), NumPy, FFmpeg 9.0 (Gyan build).
- **AI Integration**: Google Gemini API via REST, deterministic local rule fallback.

---

## 📂 Project Structure

```
Webenoid/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic request/response contracts
│   │   ├── routers/
│   │   │   ├── health.py              # GET /api/health
│   │   │   ├── analyze.py             # POST /api/analyze
│   │   │   ├── compress.py            # POST /api/compress, /api/batch-compress, downloads
│   │   │   └── assistant.py           # POST /api/ai-assistant
│   │   ├── services/
│   │   │   ├── ai_gemini.py           # Gemini 2.5 Flash cloud client
│   │   │   ├── analyzer.py            # Content diagnostics & local rule engine
│   │   │   ├── image_compressor.py    # Pillow WebP/JPEG/PNG/GIF engine
│   │   │   ├── pdf_compressor.py      # PyMuPDF stream deflate & image re-encoder
│   │   │   ├── video_compressor.py    # FFmpeg H.264/AAC encoder with CRF & target bitrate
│   │   │   ├── audio_compressor.py    # FFmpeg MP3/AAC speech/music engine
│   │   │   ├── quality_checker.py     # NumPy SSIM and perceptual quality models
│   │   │   └── cleanup.py             # Auto-eviction of temporary files (>1 hour)
│   │   ├── utils/
│   │   │   ├── ffmpeg_utils.py        # FFmpeg & FFprobe binary auto-detection
│   │   │   └── file_utils.py          # Filename sanitization, categories & byte formatters
│   │   ├── config.py                  # Env variable loaders and filesystem directories
│   │   └── main.py                    # FastAPI root application & CORS middleware
│   ├── tests/
│   │   └── test_api.py                # 10 automated integration and unit test suites
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx             # System live badges & AI Assistant trigger
│   │   │   ├── WorkflowStepper.jsx    # 5-step progress indicator
│   │   │   ├── UploadZone.jsx         # Drag-and-drop zone & batch file queue
│   │   │   ├── ContentAnalysisCard.jsx# Diagnostics, compressibility & AI recommendations
│   │   │   ├── CompressionEngineCard.jsx # Presets, target size input, format selection
│   │   │   ├── QualityCheckCard.jsx   # SSIM score, before/after previews, players
│   │   │   ├── ResultOutputCard.jsx   # File downloads and batch ZIP archive
│   │   │   └── AIAssistantDrawer.jsx  # Slide-over chat consultation drawer
│   │   ├── services/
│   │   │   └── api.js                 # Fetch client with base URL & proxy support
│   │   ├── App.jsx                    # Root state coordinator
│   │   ├── index.css                  # Tailwind styles
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── README.md
└── .gitignore
```

---

## 🚀 Installation & Local Development

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm
- FFmpeg installed and in PATH (or auto-installed via winget `winget install Gyan.FFmpeg`)

### 1. Backend Setup
```bash
cd backend

# Optional: Create and activate virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install backend dependencies
python -m pip install -r requirements.txt

# Create .env from template (optional, works out of the box with local engine)
copy .env.example .env

# Run FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running on `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend is now running on `http://localhost:5173`.

---

## 🧪 Automated Test Verification

Run the comprehensive pytest suite covering health checks, image analysis, WebP conversion, target-size iteration, PDF deflate, video encoding, audio downmixing, empty/invalid files, and the AI assistant:

```bash
cd backend
python -m pytest tests/test_api.py -v
```

All 10 test suites run against real synthesized image, audio, video, and PDF buffers:
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
============================== 10 passed in 37s ===============================
```

Verify frontend production build:
```bash
cd frontend
npm run build
```
Output: `✓ built in 11.9s` with 0 errors.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | `""` | Optional Google Gemini API key. If absent, transparently falls back to the local deterministic rule engine. |
| `MAX_FILE_SIZE_MB` | `100` | Maximum upload size limit per file in megabytes. |
| `HOST` | `0.0.0.0` | Server bind host. |
| `PORT` | `8000` | Server bind port. |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of allowed origins. |
| `FFMPEG_PATH` | `""` | Optional manual override path to FFmpeg executable if not in PATH. |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `""` | Base API URL. In local dev, leave empty to use Vite's `/api` proxy. In production, set to your deployed backend origin. |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns backend health, installed FFmpeg status, and Gemini flag |
| `POST` | `/api/analyze` | Accepts multipart file, validates format, runs diagnostics, returns metadata |
| `POST` | `/api/compress` | Compresses asset using specified preset or target size, computes SSIM |
| `POST` | `/api/batch-compress` | Compresses multiple assets and prepares a ZIP package |
| `GET` | `/api/download/{file_id}` | Streams individual compressed file with attachment disposition |
| `GET` | `/api/download-all/{zip_id}`| Streams batch ZIP archive |
| `GET` | `/api/preview/{file_id}/{variant}` | Serves original or compressed preview (image/PDF page 1/media stream) |
| `POST` | `/api/ai-assistant` | AI consultation chat endpoint |

---

## 🖥️ Demo Workflow

1. **Launch App**: Open `http://localhost:5173`. Observe **Engine Online** and **FFmpeg ✓** badges in the header.
2. **Upload Asset**: Drag and drop any JPG, PNG, PDF, MP4, or MP3 file into the drop zone.
3. **Inspect Content Analysis**: The app shifts to Step 2. Inspect the detected compressibility, image dimensions, audio bitrate, and the AI recommended strategy.
4. **Configure Target Size**: Proceed to Step 3. Select a preset (e.g. *Balanced*) or specify an exact target size (e.g. `1 MB`).
5. **Execute Compression**: Click *Start Smart Compression*. The backend iteratively optimizes quantization matrices.
6. **Inspect Quality Check**: The app transitions to Step 4. Inspect the exact percentage reduction, the measured **SSIM fidelity score**, and compare side-by-side or A/B toggles.
7. **Download**: Proceed to Step 5 and download the optimized file or test batch compression to download a combined ZIP.

---

## ☁️ Deployment Instructions

### Backend (Render / Railway / VPS)
1. Set the build command: `pip install -r backend/requirements.txt`
2. Install system packages: Ensure `ffmpeg` is available on the system image (e.g. via `apt-get install -y ffmpeg` or Render native packages).
3. Set start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Configure environment variables (`GEMINI_API_KEY`, `MAX_FILE_SIZE_MB`, `CORS_ORIGINS`).

### Frontend (Vercel / Netlify)
1. Root directory: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend-domain.com`

---

## ⚠️ Limitations & Edge Cases Handled

- **Encrypted / Password-Protected PDFs**: The backend flags encrypted documents with a friendly notification explaining that decryption is required before stream re-encoding.
- **Already Compressed Media**: The engine detects low byte-per-pixel densities and warns users against aggressive lossy re-encoding to avoid generation loss.
- **File Inflation Protection**: If re-encoding an already compact file would increase its size, the engine automatically preserves the original file.
- **FFmpeg Absence**: If FFmpeg is not installed, the application gracefully flags video/audio endpoints with actionable instructions while keeping image and PDF compression 100% operational.
- **Large Files**: Uploads exceeding `MAX_FILE_SIZE_MB` are rejected with HTTP 413 and cleanly purged from disk.
- **Privacy & Hygiene**: Stored uploads and processed files are isolated in temporary storage and cleaned up automatically after 1 hour.
