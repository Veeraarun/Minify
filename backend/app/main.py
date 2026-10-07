import os
import time
import asyncio
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import (
    CORS_ORIGINS, 
    UPLOAD_DIR, 
    PROCESSED_DIR, 
    PREVIEWS_DIR, 
    PRODUCT_NAME, 
    PRODUCT_TAGLINE
)
from app.routers import health, analyze, compress, assistant
from app.services.cleanup import cleanup_expired_files, run_periodic_cleanup

logger = logging.getLogger("minify_api")

# Lightweight in-memory rate limiting / abuse protection
# Sliding window: max 60 upload/compress requests per minute per IP
_RATE_LIMIT_WINDOW = 60.0
_MAX_REQUESTS_PER_WINDOW = 60
_request_history: dict[str, list[float]] = defaultdict(list)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure storage dirs exist and clean any stale temp files
    for d in (UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR):
        d.mkdir(parents=True, exist_ok=True)
    cleanup_expired_files()
    
    # Launch background periodic cleanup task (runs every 10 minutes)
    cleanup_task = asyncio.create_task(run_periodic_cleanup(interval_seconds=600))
    
    yield
    
    # Shutdown: cancel periodic task and perform final cleanup
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    cleanup_expired_files()

app = FastAPI(
    title=f"{PRODUCT_NAME} API",
    description=PRODUCT_TAGLINE,
    version="1.0.0",
    lifespan=lifespan
)

# Security and abuse protection middleware
@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # Lightweight rate limiting for expensive media endpoints
    path = request.url.path
    if path.startswith("/api/analyze") or path.startswith("/api/compress") or path.startswith("/api/batch-compress"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        # Clean older entries
        recent = [t for t in _request_history[client_ip] if now - t < _RATE_LIMIT_WINDOW]
        if len(recent) >= _MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please wait a moment before submitting additional files."}
            )
        recent.append(now)
        _request_history[client_ip] = recent

    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Cache control: prevent intermediate public proxy caching of user media files
    if path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

    return response

# CORS configuration
is_wildcard = "*" in CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else CORS_ORIGINS,
    allow_credentials=not is_wildcard,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(compress.router)
app.include_router(assistant.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing your request. Please try again."}
    )

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
