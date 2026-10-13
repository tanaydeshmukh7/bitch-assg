from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.section import SectionResponse, SectionCreate, BulkSectionsUpdate
from app.services import db_service

router = APIRouter(tags=["sections"])


@router.get("/projects/{project_id}/sections", response_model=List[SectionResponse])
async def get_project_sections(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    sections = await db_service.list_sections(project_id, user.id, token)
    return sections


@router.put("/projects/{project_id}/sections", response_model=List[SectionResponse])
async def save_project_sections(
    project_id: str,
    payload: BulkSectionsUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    sections_dicts = [s.model_dump(exclude_unset=True) for s in payload.sections]
    saved = await db_service.save_bulk_sections(project_id, user.id, sections_dicts, token)
    return saved


@router.post("/projects/{project_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_single_section(
    project_id: str,
    payload: SectionCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    sec_data = {
        "project_id": project_id,
        "user_id": user.id,
        "title": payload.title,
        "section_type": payload.section_type,
        "content": payload.content,
        "sort_order": payload.sort_order,
        "source_asset_ids": payload.source_asset_ids
    }
    created = await db_service.create_section(sec_data, token)
    return created
