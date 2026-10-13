from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Assignment Studio API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Supabase credentials
    SUPABASE_URL: str = Field(default="", description="Supabase Project URL")
    SUPABASE_PUBLISHABLE_KEY: str = Field(default="", description="Supabase Anon Key")
    SUPABASE_SECRET_KEY: str = Field(default="", description="Supabase Service Role Key")

    # Hugging Face AI settings
    HF_TOKEN: Optional[str] = Field(default="", description="Hugging Face API Token")
    HF_MODEL: str = Field(
        default="Qwen/Qwen2.5-32B-Instruct",
        description="HF Model Identifier (e.g. Qwen/Qwen2.5-32B-Instruct, Qwen/Qwen2.5-Coder-32B-Instruct)"
    )
    HF_BASE_URL: str = Field(
        default="https://api-inference.huggingface.co/models",
        description="HF or OpenAI-compatible Inference Base URL"
    )

    # Allowed CORS Origins
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # File Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB per file
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf", ".docx", ".doc", ".txt", ".md", ".py", ".java", ".c", ".cpp",
        ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".sql",
        ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"
    ]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "text/markdown",
        "text/x-python",
        "text/javascript",
        "text/html",
        "text/css",
        "application/json",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "application/octet-stream"  # Checked with extension fallback
    ]

    # Storage buckets
    STORAGE_BUCKET_ASSETS: str = "assignment-studio-assets"
    STORAGE_BUCKET_EXPORTS: str = "assignment-studio-exports"

    class Config:
        env_file = Path(__file__).resolve().parents[3] / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
