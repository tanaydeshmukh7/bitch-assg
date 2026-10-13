import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_admin_client: Optional[Client] = None
_anon_client: Optional[Client] = None


def is_supabase_configured() -> bool:
    return bool(
        settings.SUPABASE_URL
        and settings.SUPABASE_URL.startswith("http")
        and settings.SUPABASE_PUBLISHABLE_KEY
    )


def get_supabase_admin_client() -> Optional[Client]:
    """Returns elevated client using secret service role key."""
    global _admin_client
    if not is_supabase_configured():
        return None

    if _admin_client is None:
        if not settings.SUPABASE_SECRET_KEY:
            logger.error("Supabase secret key is not configured for an admin client")
            return None
        key = settings.SUPABASE_SECRET_KEY
        try:
            _admin_client = create_client(settings.SUPABASE_URL, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase admin client: {e}")
            return None
    return _admin_client


def get_supabase_anon_client() -> Optional[Client]:
    """Returns client using anon / publishable key."""
    global _anon_client
    if not is_supabase_configured():
        return None

    if _anon_client is None:
        key = settings.SUPABASE_PUBLISHABLE_KEY
        try:
            _anon_client = create_client(settings.SUPABASE_URL, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase anon client: {e}")
            return None
    return _anon_client


def get_user_scoped_client(access_token: str) -> Optional[Client]:
    """
    Returns a client instance scoped to the user's JWT access token.
    This ensures all Supabase Postgres queries trigger Row Level Security (RLS)
    with auth.uid() set to the user.
    """
    if not is_supabase_configured() or not access_token or access_token.count(".") != 2:
        logger.warning(
            "User-scoped Supabase client not created: %s",
            "missing access token" if not access_token else "malformed access token",
        )
        return None

    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
        # Set only the user's JWT; the publishable key remains the API key.
        client.postgrest.auth(access_token)
        return client
    except Exception as e:
        logger.error(f"Failed to create user-scoped Supabase client: {e}")
        return None
