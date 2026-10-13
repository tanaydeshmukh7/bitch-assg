from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.asset import AssetResponse
from app.services import db_service, storage_service, document_processor

router = APIRouter(tags=["assets"])


@router.post("/projects/{project_id}/assets", response_model=List[AssetResponse], status_code=status.HTTP_201_CREATED)
async def upload_project_assets(
    project_id: str,
    files: List[UploadFile] = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    # Verify project exists and user owns it
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    uploaded_records = []

    for file in files:
        # Save file to storage
        storage_path, local_filepath, file_size, mime_type = await storage_service.save_uploaded_file(
            user_id=user.id,
            project_id=project_id,
            file=file
        )

        # Run document extraction / OCR
        extracted_text, metadata, status_val, error_msg = document_processor.process_uploaded_document(
            file_path=local_filepath,
            original_filename=file.filename or "upload",
            mime_type=mime_type
        )

        if error_msg:
            metadata["error_message"] = error_msg

        asset_data = {
            "project_id": project_id,
            "user_id": user.id,
            "original_filename": file.filename or "upload",
            "storage_path": storage_path,
            "mime_type": mime_type,
            "file_size": file_size,
            "extracted_text": extracted_text,
            "processing_status": status_val,
            "metadata": metadata
        }

        created = await db_service.create_asset(asset_data, token)
        uploaded_records.append(created)

    return uploaded_records


@router.get("/projects/{project_id}/assets", response_model=List[AssetResponse])
async def list_project_assets(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    assets = await db_service.list_assets(project_id, user.id, token)
    return assets


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    asset = await db_service.get_asset(asset_id, user.id, token)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found or access denied")

    await db_service.delete_asset(asset_id, user.id, token)
    return None


@router.post("/assets/{asset_id}/retry", response_model=AssetResponse)
async def retry_asset_processing(
    asset_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    asset = await db_service.get_asset(asset_id, user.id, token)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found or access denied")

    local_path = storage_service.get_local_file_path(asset["storage_path"])
    if not local_path:
        raise HTTPException(status_code=400, detail="Underlying file not available locally for retry")

    extracted_text, metadata, status_val, error_msg = document_processor.process_uploaded_document(
        file_path=local_path,
        original_filename=asset["original_filename"],
        mime_type=asset["mime_type"]
    )

    updates = {
        "extracted_text": extracted_text,
        "processing_status": status_val,
        "metadata": metadata
    }

    updated = await db_service.update_asset(asset_id, user.id, updates, token)
    return updated
