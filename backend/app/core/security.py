from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = "authenticated"
    user_metadata: Dict[str, Any] = {}


def extract_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    parts = auth_header.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1]:
        return parts[1]
    return None


def verify_supabase_token(token: str, supabase_client=None) -> Optional[AuthenticatedUser]:
    """
    Verifies a Supabase Bearer JWT.
    Uses supabase.auth.get_user(token) when client is configured.
    Falls back to payload decoding if in offline/demo mode.
    """
    if not token:
        return None

    # A configured Supabase client is the only trusted verification path.
    if supabase_client is not None:
        try:
            response = supabase_client.auth.get_user(token)
            if response and response.user:
                return AuthenticatedUser(
                    id=str(response.user.id),
                    email=response.user.email,
                    role=response.user.role,
                    user_metadata=response.user.user_metadata or {}
                )
        except Exception as e:
            logger.warning("Supabase auth verification failed for bearer token: %s", type(e).__name__)
        return None

    return None
