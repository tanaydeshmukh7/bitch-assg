from typing import List
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services import db_service

router = APIRouter(prefix="/projects", tags=["projects"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[ProjectResponse])
async def list_user_projects(
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    projects = await db_service.list_projects(user.id, token)
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_user_project(
    payload: ProjectCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project_dict = {
        "user_id": user.id,
        "title": payload.title,
        "subject": payload.subject,
        "metadata": payload.metadata.model_dump(by_alias=True) if payload.metadata else {},
        "status": "draft"
    }
    try:
        return await db_service.create_project(project_dict, token)
    except Exception as exc:
        logger.exception("Assignment creation failed for authenticated user %s", user.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Assignment could not be saved. Check the backend logs for the database error.",
        ) from exc


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_details(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project_details(
    project_id: str,
    payload: ProjectUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    # Verify ownership
    existing = await db_service.get_project(project_id, user.id, token)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    updates = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.subject is not None:
        updates["subject"] = payload.subject
    if payload.metadata is not None:
        # Merge or update metadata
        merged_meta = dict(existing.get("metadata", {}))
        merged_meta.update(payload.metadata)
        updates["metadata"] = merged_meta
    if payload.status is not None:
        updates["status"] = payload.status

    updated = await db_service.update_project(project_id, user.id, updates, token)
    return updated


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_project(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    existing = await db_service.get_project(project_id, user.id, token)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    await db_service.delete_project(project_id, user.id, token)
    return None
