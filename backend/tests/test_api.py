import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import pymupdf

from app.main import app
from app.config import UPLOAD_DIR, PROCESSED_DIR

client = TestClient(app)

def create_sample_image(format="JPEG", size=(600, 400), color=(180, 50, 100)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color)
    # Add some pattern so it's not pure flat
    for x in range(0, size[0], 20):
        for y in range(0, size[1], 20):
            img.putpixel((x, y), (255, 255, 255))
    img.save(buf, format=format)
    return buf.getvalue()

def create_sample_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "MINIFY Test Document\nPreserving vector readability with fidelity.", fontsize=18)
    
    # Insert an uncompressed sample raster image
    img_bytes = create_sample_image(format="PNG", size=(300, 300), color=(20, 150, 220))
    rect = pymupdf.Rect(50, 150, 350, 450)
    page.insert_image(rect, stream=img_bytes)
    
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "pillow_version" in data
    assert "ffmpeg_available" in data
    assert "max_file_size_mb" in data

def test_upload_and_analyze_image():
    img_data = create_sample_image()
    response = client.post(
        "/api/analyze",
        files={"file": ("test_photo.jpg", img_data, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["file"]["filename"] == "test_photo.jpg"
    assert data["file"]["category"] == "image"
    assert data["content"]["width"] == 600
    assert data["content"]["height"] == 400
    assert "recommendation" in data
    assert data["recommendation"]["expected_reduction_percent"] > 0
    assert data["analyzer_source"] in ("Gemini AI (Cloud)", "Local AI-assisted analysis")


def test_compress_image():
    img_data = create_sample_image(size=(800, 600))
    # 1. Analyze
    upload_res = client.post(
        "/api/analyze",
        files={"file": ("sample_large.jpg", img_data, "image/jpeg")}
    )
    file_id = upload_res.json()["file"]["id"]

    # 2. Compress
    compress_res = client.post(
        "/api/compress",
        json={
            "file_id": file_id,
            "quality_preset": "balanced",
            "output_format": "webp"
        }
    )
    assert compress_res.status_code == 200
    data = compress_res.json()
    assert data["category"] == "image"
    assert data["compressed_filename"].endswith(".webp")
    assert data["quality"]["compressed_size"] > 0
    assert data["quality"]["quality_score"] > 80  # SSIM > 80
    assert data["quality"]["is_measured"] is True
    assert "SSIM" in data["quality"]["metric_name"]

def test_target_size_compression():
    img_data = create_sample_image(size=(1000, 800))
    upload_res = client.post(
        "/api/analyze",
        files={"file": ("target_test.jpg", img_data, "image/jpeg")}
    )
    file_id = upload_res.json()["file"]["id"]

    # Request target under 0.05 MB (approx 50 KB)
    compress_res = client.post(
        "/api/compress",
        json={
            "file_id": file_id,
            "target_size_mb": 0.05,
            "output_format": "webp"
        }
    )
    assert compress_res.status_code == 200
    data = compress_res.json()
    assert data["quality"]["target_size_bytes"] == int(0.05 * 1024 * 1024)
    assert data["quality"]["compressed_size"] <= int(0.05 * 1024 * 1024)
    assert data["quality"]["target_reached"] is True

def test_pdf_compression():
    pdf_bytes = create_sample_pdf()
    upload_res = client.post(
        "/api/analyze",
        files={"file": ("sample_doc.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 200
    file_id = upload_res.json()["file"]["id"]
    assert upload_res.json()["content"]["pages"] == 1

    compress_res = client.post(
        "/api/compress",
        json={
            "file_id": file_id,
            "quality_preset": "max_compression"
        }
    )
    assert compress_res.status_code == 200
    data = compress_res.json()
    assert data["category"] == "pdf"
    assert data["quality"]["compressed_size"] > 0
    assert data["quality"]["output_specs"]["pages"] == 1

def test_invalid_unsupported_file():
    bad_data = b"Some random executable code or binary blob"
    response = client.post(
        "/api/analyze",
        files={"file": ("malicious_script.exe", bad_data, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_empty_file_upload():
    empty_data = b""
    response = client.post(
        "/api/analyze",
        files={"file": ("empty.jpg", empty_data, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_video_and_audio_compression():
    from app.utils.ffmpeg_utils import get_ffmpeg_path, is_ffmpeg_available
    if not is_ffmpeg_available():
        pytest.skip("FFmpeg not available")

    import subprocess
    import tempfile
    from pathlib import Path

    ffmpeg = get_ffmpeg_path()
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        vid_path = tmp / "test_input.mp4"
        aud_path = tmp / "test_input.mp3"

        # Generate 1-sec test video and audio
        subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=10", "-pix_fmt", "yuv420p", str(vid_path)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", str(aud_path)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Video analyze and compress
        with open(vid_path, "rb") as f:
            v_res = client.post("/api/analyze", files={"file": ("clip.mp4", f.read(), "video/mp4")})
        assert v_res.status_code == 200
        vid_id = v_res.json()["file"]["id"]
        assert v_res.json()["content"]["width"] == 320

        vc_res = client.post("/api/compress", json={"file_id": vid_id, "quality_preset": "balanced"})
        assert vc_res.status_code == 200
        assert vc_res.json()["category"] == "video"

        # Audio analyze and compress
        with open(aud_path, "rb") as f:
            a_res = client.post("/api/analyze", files={"file": ("sound.mp3", f.read(), "audio/mpeg")})
        assert a_res.status_code == 200
        aud_id = a_res.json()["file"]["id"]

        ac_res = client.post("/api/compress", json={"file_id": aud_id, "audio_preset": "speech"})
        assert ac_res.status_code == 200
        assert ac_res.json()["category"] == "audio"

def test_batch_compression():
    img1 = create_sample_image(size=(400, 300))
    img2 = create_sample_image(size=(500, 400), color=(50, 150, 200))

    r1 = client.post("/api/analyze", files={"file": ("batch1.jpg", img1, "image/jpeg")})
    r2 = client.post("/api/analyze", files={"file": ("batch2.jpg", img2, "image/jpeg")})
    assert r1.status_code == 200 and r2.status_code == 200

    id1 = r1.json()["file"]["id"]
    id2 = r2.json()["file"]["id"]

    batch_res = client.post("/api/batch-compress", json={
        "file_ids": [id1, id2],
        "quality_preset": "balanced",
        "output_format": "webp"
    })
    assert batch_res.status_code == 200
    b_data = batch_res.json()
    assert len(b_data["results"]) == 2
    assert "download_all_zip_url" in b_data
    assert b_data["overall_reduction_percentage"] > 0

def test_ai_assistant():
    response = client.post(
        "/api/ai-assistant",
        json={"question": "Which format should I use for photos?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "WebP" in data["answer"]
    assert len(data["suggested_actions"]) > 0
    assert data["provider"] in ("Gemini AI", "Local Knowledge Engine")
