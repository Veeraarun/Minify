import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS, UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR
from app.routers import health, analyze, compress, assistant
from app.services.cleanup import cleanup_expired_files

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure dirs exist and clean stale temp files
    for d in (UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR):
        d.mkdir(parents=True, exist_ok=True)
    cleanup_expired_files()
    yield
    # Shutdown
    cleanup_expired_files()

app = FastAPI(
    title="AI Compressor API",
    description="Smart content-aware file compression and quality optimization engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if "*" not in CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(compress.router)
app.include_router(assistant.router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
