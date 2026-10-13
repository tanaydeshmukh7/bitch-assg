from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.job import JobResponse
from app.services import db_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    job = await db_service.get_job(job_id, user.id, token)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    return job
