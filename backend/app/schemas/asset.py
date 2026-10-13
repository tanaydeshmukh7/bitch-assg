from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class AssetResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    extracted_text: Optional[str] = None
    processing_status: str  # pending, processing, completed, failed
    metadata: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class AssetProcessRequest(BaseModel):
    asset_id: str
    force_ocr: bool = False
