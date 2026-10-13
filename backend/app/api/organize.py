from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_current_token
from app.core.security import AuthenticatedUser
from app.schemas.ai import OrganizeRequest, AIAssignmentProposal
from app.services import db_service, ai_service

router = APIRouter(tags=["organize"])


@router.post("/projects/{project_id}/organize")
async def organize_assignment(
    project_id: str,
    payload: OrganizeRequest = OrganizeRequest(),
    user: AuthenticatedUser = Depends(get_current_user),
    token: str = Depends(get_current_token)
):
    project = await db_service.get_project(project_id, user.id, token)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")

    # Create background tracking job
    job = await db_service.create_job(project_id, user.id, job_type="ai_organization", access_token=token)

    try:
        # Fetch project assets
        all_assets = await db_service.list_assets(project_id, user.id, token)
        if payload.selected_asset_ids:
            assets = [a for a in all_assets if a["id"] in payload.selected_asset_ids]
        else:
            assets = all_assets

        await db_service.update_job(job["id"], user.id, {"progress": 40}, token)

        # Run AI generation
        proposal: AIAssignmentProposal = await ai_service.generate_assignment_organization(
            title=project["title"],
            subject=project["subject"],
            project_metadata=project.get("metadata", {}),
            materials=assets,
            custom_instructions=payload.custom_instructions,
            template=payload.target_template or project.get("metadata", {}).get("formatting_template", "academic_standard")
        )

        await db_service.update_job(job["id"], user.id, {"progress": 75}, token)

        # Convert proposal sections to database section format
        sections_data = []
        for idx, sec in enumerate(proposal.sections):
            # Resolve source asset ids from indices
            source_ids = []
            for src_idx in sec.source_asset_indices:
                if 0 <= src_idx < len(assets):
                    source_ids.append(assets[src_idx]["id"])

            sections_data.append({
                "title": sec.title,
                "section_type": sec.section_type,
                "content": {"html": sec.content, "confidence_note": sec.confidence_note},
                "sort_order": idx,
                "source_asset_ids": source_ids
            })

        # Save generated sections into database
        saved_sections = await db_service.save_bulk_sections(project_id, user.id, sections_data, token)

        # Update project status
        await db_service.update_project(project_id, user.id, {"status": "organized"}, token)

        # Mark job complete
        await db_service.update_job(job["id"], user.id, {"status": "completed", "progress": 100}, token)

        return {
            "job_id": job["id"],
            "proposal": proposal.model_dump(),
            "sections": saved_sections,
            "status": "success"
        }

    except Exception as e:
        err_msg = str(e)
        await db_service.update_job(job["id"], user.id, {"status": "failed", "error_message": err_msg}, token)
        raise HTTPException(status_code=500, detail=f"AI assignment organization failed: {err_msg}")
