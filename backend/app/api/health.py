from fastapi import APIRouter
from app.core.config import settings
from app.core.supabase_client import is_supabase_configured
from app.services.ocr_service import is_ocr_available

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supabase_configured": is_supabase_configured(),
        "ocr_available": is_ocr_available(),
        "ai_model": settings.HF_MODEL,
        "ai_token_configured": bool(settings.HF_TOKEN and settings.HF_TOKEN != "hf_your_token_here")
    }
