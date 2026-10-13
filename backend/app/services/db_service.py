import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.supabase_client import get_user_scoped_client, is_supabase_configured

logger = logging.getLogger(__name__)

# Local in-memory store for fallback / local testing when Supabase credentials are not provided
_local_store = {
    "projects": {},
    "assets": {},
    "sections": {},
    "jobs": {},
    "exports": {}
}


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ====================================================================
# PROJECTS
# ====================================================================

async def list_projects(user_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("projects").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase list_projects error: {e}")

    # Fallback to local store
    results = [p for p in _local_store["projects"].values() if p.get("user_id") == user_id]
    results.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return results


async def get_project(project_id: str, user_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase get_project error: {e}")

    p = _local_store["projects"].get(project_id)
    if p and p.get("user_id") == user_id:
        return p
    return None


async def create_project(project_data: Dict[str, Any], access_token: Optional[str] = None) -> Dict[str, Any]:
    project_id = str(uuid.uuid4())
    now = _now_iso()
    record = {
        "id": project_id,
        "user_id": project_data["user_id"],
        "title": project_data["title"],
        "subject": project_data["subject"],
        "metadata": project_data.get("metadata", {}),
        "status": project_data.get("status", "draft"),
        "created_at": now,
        "updated_at": now
    }

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("projects").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.exception("Supabase create_project failed")
            raise RuntimeError("Project could not be saved to Supabase") from e

    _local_store["projects"][project_id] = record
    return record


async def update_project(project_id: str, user_id: str, updates: Dict[str, Any], access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updates["updated_at"] = _now_iso()

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("projects").update(updates).eq("id", project_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase update_project error: {e}")

    p = _local_store["projects"].get(project_id)
    if p and p.get("user_id") == user_id:
        p.update(updates)
        return p
    return None


async def delete_project(project_id: str, user_id: str, access_token: Optional[str] = None) -> bool:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase delete_project error: {e}")

    p = _local_store["projects"].get(project_id)
    if p and p.get("user_id") == user_id:
        del _local_store["projects"][project_id]
        # Cascade local assets, sections, jobs, exports
        for aid in list(_local_store["assets"].keys()):
            if _local_store["assets"][aid].get("project_id") == project_id:
                del _local_store["assets"][aid]
        for sid in list(_local_store["sections"].keys()):
            if _local_store["sections"][sid].get("project_id") == project_id:
                del _local_store["sections"][sid]
        return True
    return False


# ====================================================================
# ASSETS
# ====================================================================

async def list_assets(project_id: str, user_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("assets").select("*").eq("project_id", project_id).eq("user_id", user_id).order("created_at").execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase list_assets error: {e}")

    return [a for a in _local_store["assets"].values() if a.get("project_id") == project_id and a.get("user_id") == user_id]


async def get_asset(asset_id: str, user_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase get_asset error: {e}")

    a = _local_store["assets"].get(asset_id)
    if a and a.get("user_id") == user_id:
        return a
    return None


async def create_asset(asset_data: Dict[str, Any], access_token: Optional[str] = None) -> Dict[str, Any]:
    asset_id = str(uuid.uuid4())
    record = {
        "id": asset_id,
        "project_id": asset_data["project_id"],
        "user_id": asset_data["user_id"],
        "original_filename": asset_data["original_filename"],
        "storage_path": asset_data["storage_path"],
        "mime_type": asset_data["mime_type"],
        "file_size": asset_data["file_size"],
        "extracted_text": asset_data.get("extracted_text"),
        "processing_status": asset_data.get("processing_status", "pending"),
        "metadata": asset_data.get("metadata", {}),
        "created_at": _now_iso()
    }

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("assets").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase create_asset error: {e}")

    _local_store["assets"][asset_id] = record
    return record


async def update_asset(asset_id: str, user_id: str, updates: Dict[str, Any], access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("assets").update(updates).eq("id", asset_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase update_asset error: {e}")

    a = _local_store["assets"].get(asset_id)
    if a and a.get("user_id") == user_id:
        a.update(updates)
        return a
    return None


async def delete_asset(asset_id: str, user_id: str, access_token: Optional[str] = None) -> bool:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("assets").delete().eq("id", asset_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase delete_asset error: {e}")

    a = _local_store["assets"].get(asset_id)
    if a and a.get("user_id") == user_id:
        del _local_store["assets"][asset_id]
        return True
    return False


# ====================================================================
# SECTIONS
# ====================================================================

async def list_sections(project_id: str, user_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("sections").select("*").eq("project_id", project_id).eq("user_id", user_id).order("sort_order").execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase list_sections error: {e}")

    secs = [s for s in _local_store["sections"].values() if s.get("project_id") == project_id and s.get("user_id") == user_id]
    secs.sort(key=lambda x: x.get("sort_order", 0))
    return secs


async def create_section(section_data: Dict[str, Any], access_token: Optional[str] = None) -> Dict[str, Any]:
    sec_id = str(uuid.uuid4())
    now = _now_iso()
    record = {
        "id": sec_id,
        "project_id": section_data["project_id"],
        "user_id": section_data["user_id"],
        "title": section_data["title"],
        "section_type": section_data.get("section_type", "theory"),
        "content": section_data.get("content", {}),
        "sort_order": section_data.get("sort_order", 0),
        "source_asset_ids": section_data.get("source_asset_ids", []),
        "created_at": now,
        "updated_at": now
    }

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("sections").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase create_section error: {e}")

    _local_store["sections"][sec_id] = record
    return record


async def save_bulk_sections(project_id: str, user_id: str, sections_data: List[Dict[str, Any]], access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Replaces or updates sections for a project in order."""
    now = _now_iso()

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            # Delete existing sections for clean replace/order
            client.table("sections").delete().eq("project_id", project_id).eq("user_id", user_id).execute()
            
            records_to_insert = []
            for idx, s in enumerate(sections_data):
                sec_id = s.get("id") or str(uuid.uuid4())
                records_to_insert.append({
                    "id": sec_id,
                    "project_id": project_id,
                    "user_id": user_id,
                    "title": s.get("title", f"Section {idx+1}"),
                    "section_type": s.get("section_type", "theory"),
                    "content": s.get("content", {}),
                    "sort_order": idx,
                    "source_asset_ids": s.get("source_asset_ids", []),
                    "created_at": now,
                    "updated_at": now
                })
            
            if records_to_insert:
                res = client.table("sections").insert(records_to_insert).execute()
                return res.data or []
            return []
        except Exception as e:
            logger.error(f"Supabase save_bulk_sections error: {e}")

    # Remove existing local sections for project
    for sid in list(_local_store["sections"].keys()):
        if _local_store["sections"][sid].get("project_id") == project_id and _local_store["sections"][sid].get("user_id") == user_id:
            del _local_store["sections"][sid]

    saved = []
    for idx, s in enumerate(sections_data):
        sec_id = s.get("id") or str(uuid.uuid4())
        rec = {
            "id": sec_id,
            "project_id": project_id,
            "user_id": user_id,
            "title": s.get("title", f"Section {idx+1}"),
            "section_type": s.get("section_type", "theory"),
            "content": s.get("content", {}),
            "sort_order": idx,
            "source_asset_ids": s.get("source_asset_ids", []),
            "created_at": now,
            "updated_at": now
        }
        _local_store["sections"][sec_id] = rec
        saved.append(rec)
    return saved


# ====================================================================
# PROCESSING JOBS
# ====================================================================

async def create_job(project_id: str, user_id: str, job_type: str, access_token: Optional[str] = None) -> Dict[str, Any]:
    job_id = str(uuid.uuid4())
    now = _now_iso()
    record = {
        "id": job_id,
        "project_id": project_id,
        "user_id": user_id,
        "job_type": job_type,
        "status": "running",
        "progress": 10,
        "error_message": None,
        "created_at": now,
        "updated_at": now
    }

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("processing_jobs").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase create_job error: {e}")

    _local_store["jobs"][job_id] = record
    return record


async def update_job(job_id: str, user_id: str, updates: Dict[str, Any], access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    updates["updated_at"] = _now_iso()

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("processing_jobs").update(updates).eq("id", job_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase update_job error: {e}")

    j = _local_store["jobs"].get(job_id)
    if j and j.get("user_id") == user_id:
        j.update(updates)
        return j
    return None


async def get_job(job_id: str, user_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("processing_jobs").select("*").eq("id", job_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase get_job error: {e}")

    j = _local_store["jobs"].get(job_id)
    if j and j.get("user_id") == user_id:
        return j
    return None


# ====================================================================
# EXPORTS
# ====================================================================

async def create_export(export_data: Dict[str, Any], access_token: Optional[str] = None) -> Dict[str, Any]:
    exp_id = str(uuid.uuid4())
    record = {
        "id": exp_id,
        "project_id": export_data["project_id"],
        "user_id": export_data["user_id"],
        "format": export_data["format"],
        "storage_path": export_data["storage_path"],
        "status": export_data.get("status", "completed"),
        "created_at": _now_iso()
    }

    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("exports").insert(record).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase create_export error: {e}")

    _local_store["exports"][exp_id] = record
    return record


async def get_export(export_id: str, user_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("exports").select("*").eq("id", export_id).eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Supabase get_export error: {e}")

    exp = _local_store["exports"].get(export_id)
    if exp and exp.get("user_id") == user_id:
        return exp
    return None


async def list_exports(project_id: str, user_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    if is_supabase_configured() and access_token:
        try:
            client = get_user_scoped_client(access_token)
            if client is None:
                raise RuntimeError("Unable to create a user-scoped Supabase client")
            res = client.table("exports").select("*").eq("project_id", project_id).eq("user_id", user_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase list_exports error: {e}")

    exps = [e for e in _local_store["exports"].values() if e.get("project_id") == project_id and e.get("user_id") == user_id]
    exps.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return exps
