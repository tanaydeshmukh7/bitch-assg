import os
import uuid
import re
import logging
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.core.supabase_client import get_supabase_admin_client, is_supabase_configured

logger = logging.getLogger(__name__)

LOCAL_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "temp_storage"))
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    # Keep only alphanumeric, dots, underscores, hyphens
    name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
    return name[:100]  # truncate to reasonable length


def validate_file(file: UploadFile) -> Tuple[str, str, int]:
    """Validates file extension, mime type, and read size."""
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    return filename, ext, 0


async def save_uploaded_file(
    user_id: str,
    project_id: str,
    file: UploadFile
) -> Tuple[str, str, int, str]:
    """
    Saves uploaded file securely.
    Returns: (storage_path, local_temp_filepath, file_size, mime_type)
    """
    filename, ext, _ = validate_file(file)
    safe_name = sanitize_filename(filename)
    unique_id = str(uuid.uuid4())
    
    # Path inside storage: {user_id}/{project_id}/{unique_id}_{safe_name}
    storage_path = f"{user_id}/{project_id}/{unique_id}_{safe_name}"

    # First write to local buffer for processing and size validation
    local_dir = os.path.join(LOCAL_STORAGE_DIR, user_id, project_id)
    os.makedirs(local_dir, exist_ok=True)
    local_filepath = os.path.join(local_dir, f"{unique_id}_{safe_name}")

    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB"
        )

    with open(local_filepath, "wb") as f:
        f.write(content)

    mime_type = file.content_type or "application/octet-stream"

    # If Supabase is configured, upload to private bucket
    if is_supabase_configured():
        admin = get_supabase_admin_client()
        if admin:
            try:
                bucket = settings.STORAGE_BUCKET_ASSETS
                # Upload bytes directly
                admin.storage.from_(bucket).upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": mime_type, "upsert": "false"}
                )
                logger.info(f"Uploaded asset to Supabase Storage: {storage_path}")
            except Exception as e:
                logger.warning(f"Supabase storage upload failed, using local storage: {e}")

    return storage_path, local_filepath, file_size, mime_type


def get_local_file_path(storage_path: str) -> Optional[str]:
    """Resolves local file path from storage path if cached/stored locally."""
    parts = storage_path.split("/")
    local_path = os.path.join(LOCAL_STORAGE_DIR, *parts)
    if os.path.exists(local_path):
        return local_path
    return None


async def save_export_file(
    user_id: str,
    project_id: str,
    filename: str,
    file_bytes: bytes,
    mime_type: str
) -> Tuple[str, str]:
    """Saves generated PDF or DOCX export file."""
    unique_id = str(uuid.uuid4())
    safe_name = sanitize_filename(filename)
    storage_path = f"{user_id}/{project_id}/exports/{unique_id}_{safe_name}"

    local_dir = os.path.join(LOCAL_STORAGE_DIR, user_id, project_id, "exports")
    os.makedirs(local_dir, exist_ok=True)
    local_filepath = os.path.join(local_dir, f"{unique_id}_{safe_name}")

    with open(local_filepath, "wb") as f:
        f.write(file_bytes)

    if is_supabase_configured():
        admin = get_supabase_admin_client()
        if admin:
            try:
                admin.storage.from_(settings.STORAGE_BUCKET_EXPORTS).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": mime_type, "upsert": "false"}
                )
            except Exception as e:
                logger.warning(f"Supabase export upload failed, using local export: {e}")

    return storage_path, local_filepath
