import os
import time
import asyncio
import logging
from pathlib import Path
from app.config import UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR, FILE_RETENTION_SECONDS

logger = logging.getLogger("cleanup")

def cleanup_expired_files() -> int:
    """Removes temporary files older than FILE_RETENTION_SECONDS."""
    now = time.time()
    count = 0
    for target_dir in (UPLOAD_DIR, PROCESSED_DIR, PREVIEWS_DIR):
        if not target_dir.exists():
            continue
        try:
            for file_path in target_dir.iterdir():
                if file_path.is_file():
                    try:
                        mtime = file_path.stat().st_mtime
                        if now - mtime > FILE_RETENTION_SECONDS:
                            file_path.unlink(missing_ok=True)
                            count += 1
                    except (OSError, PermissionError, FileNotFoundError):
                        # File may be currently in use, locked by writer, or already deleted
                        continue
                    except Exception as e:
                        logger.debug(f"Could not remove old file {file_path}: {e}")
        except Exception as e:
            logger.debug(f"Error scanning directory {target_dir}: {e}")
    if count > 0:
        logger.info(f"Cleaned up {count} expired temporary files.")
    return count

async def run_periodic_cleanup(interval_seconds: int = 600):
    """Periodically purges expired temporary files while application is running."""
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            cleanup_expired_files()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug(f"Periodic cleanup cycle error: {e}")

