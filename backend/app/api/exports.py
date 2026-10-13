import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.export import ExportRequest, ExportResponse
from app.services import db_service, storage_service, export_service

router = APIRouter(tags=["exports"])


@router.post("/projects/{project_id}/exports", response_model=ExportResponse, status_code=status.HTTP_201_CREATED)
async def generate_export(
    project_id: str,
    payload: ExportRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    sections = await db_service.list_sections(project_id, user.id, token)

    fmt = payload.format.lower()
    title = project["title"]
    subject = project["subject"]
    metadata = project.get("metadata", {})

    if fmt == "docx":
        file_bytes = export_service.generate_docx_document(
            project_title=title,
            subject=subject,
            metadata=metadata,
            sections=sections,
            include_cover_page=payload.include_cover_page
        )
        filename = f"{title.replace(' ', '_')}.docx"
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif fmt == "pdf":
        file_bytes = export_service.generate_pdf_document(
            project_title=title,
            subject=subject,
            metadata=metadata,
            sections=sections,
            include_cover_page=payload.include_cover_page
        )
        filename = f"{title.replace(' ', '_')}.pdf"
        mime_type = "application/pdf"
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats are 'pdf' and 'docx'.")

    # Save to storage
    storage_path, local_filepath = await storage_service.save_export_file(
        user_id=user.id,
        project_id=project_id,
        filename=filename,
        file_bytes=file_bytes,
        mime_type=mime_type
    )

    # Record export in database
    export_record = await db_service.create_export({
        "project_id": project_id,
        "user_id": user.id,
        "format": fmt,
        "storage_path": storage_path,
        "status": "completed"
    }, token)

    export_record["download_url"] = f"/api/exports/{export_record['id']}/download"
    return export_record


@router.get("/projects/{project_id}/exports", response_model=List[ExportResponse])
async def list_project_exports(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    exports = await db_service.list_exports(project_id, user.id, token)
    for exp in exports:
        exp["download_url"] = f"/api/exports/{exp['id']}/download"
    return exports


@router.get("/exports/{export_id}", response_model=ExportResponse)
async def get_export_record(
    export_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    export_item = await db_service.get_export(export_id, user.id, token)
    if not export_item:
        raise HTTPException(status_code=404, detail="Export not found or access denied")

    export_item["download_url"] = f"/api/exports/{export_item['id']}/download"
    return export_item


@router.get("/exports/{export_id}/download")
async def download_export(
    export_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    export_item = await db_service.get_export(export_id, user.id, token)
    if not export_item:
        raise HTTPException(status_code=404, detail="Export not found or access denied")

    storage_path = export_item["storage_path"]
    local_path = storage_service.get_local_file_path(storage_path)

    if not local_path or not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Export file missing or expired")

    fmt = export_item["format"].lower()
    media_type = "application/pdf" if fmt == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    filename = os.path.basename(storage_path)

    return FileResponse(
        path=local_path,
        media_type=media_type,
        filename=filename
    )
