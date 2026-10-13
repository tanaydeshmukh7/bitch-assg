from typing import Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectMetadata(BaseModel):
    college: Optional[str] = None
    department: Optional[str] = None
    class_name: Optional[str] = Field(None, alias="class")
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    teacher_name: Optional[str] = None
    instructions: Optional[str] = None
    formatting_template: Literal[
        "academic_standard",
        "lab_report",
        "technical_ieee",
        "modern_clean",
    ] = "academic_standard"

    class Config:
        populate_by_name = True


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=255)
    metadata: Optional[ProjectMetadata] = Field(default_factory=ProjectMetadata)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    title: str
    subject: str
    metadata: Dict[str, Any] = {}
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
