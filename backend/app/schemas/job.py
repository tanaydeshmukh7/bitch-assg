from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class JobResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    job_type: str
    status: str  # pending, running, completed, failed
    progress: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
