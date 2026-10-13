from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SectionCreate(BaseModel):
    title: str = Field(..., min_length=1)
    section_type: str = Field(default="theory")
    content: Dict[str, Any] = Field(default_factory=dict)
    sort_order: int = 0
    source_asset_ids: List[str] = Field(default_factory=list)


class SectionUpdate(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    section_type: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    sort_order: Optional[int] = None
    source_asset_ids: Optional[List[str]] = None


class SectionResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    title: str
    section_type: str
    content: Dict[str, Any] = {}
    sort_order: int
    source_asset_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BulkSectionsUpdate(BaseModel):
    sections: List[SectionUpdate]
