from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    format: str = Field(..., pattern="^(pdf|docx)$")
    template: Optional[str] = "academic_standard"  # academic_standard, lab_report, technical_ieee, modern_clean
    include_cover_page: bool = True
    page_numbers: bool = True
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ExportResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    format: str
    storage_path: str
    status: str
    created_at: datetime
    download_url: Optional[str] = None

    class Config:
        from_attributes = True
