from typing import Optional, Tuple
from fastapi import Header, HTTPException, status, Depends
from app.core.security import verify_supabase_token, extract_token_from_header, AuthenticatedUser
from app.core.supabase_client import get_supabase_anon_client, is_supabase_configured
import logging

logger = logging.getLogger(__name__)


async def get_auth_context(
    authorization: Optional[str] = Header(None)
) -> Tuple[AuthenticatedUser, Optional[str]]:
    """
    Dependency that extracts and validates the Bearer token.
    Returns (AuthenticatedUser, token_str).
    """
    token = extract_token_from_header(authorization)
    
    if not token:
        logger.warning("Authentication rejected: missing or malformed bearer header")
        # If in local dev / no auth header provided, raise 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Demo tokens are only valid when Supabase is intentionally disabled.
    if not is_supabase_configured() and (token.startswith("test_token_") or token == "demo-token"):
        user_id = token.replace("test_token_", "") or "demo-user-id"
        return AuthenticatedUser(
            id=user_id if user_id != "demo-token" else "demo-user-uuid",
            email=f"{user_id}@assignmentstudio.local",
            role="authenticated"
        ), token

    if token.count(".") != 2:
        logger.warning("Authentication rejected: bearer token has an invalid JWT shape")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not is_supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is not configured on the backend",
        )

    client = get_supabase_anon_client()
    if client is None:
        logger.error("Supabase authentication client is unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase authentication is unavailable",
        )
    user = verify_supabase_token(token, client)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user, token


async def get_current_user(auth_ctx: Tuple[AuthenticatedUser, Optional[str]] = Depends(get_auth_context)) -> AuthenticatedUser:
    return auth_ctx[0]


async def get_current_token(auth_ctx: Tuple[AuthenticatedUser, Optional[str]] = Depends(get_auth_context)) -> Optional[str]:
    return auth_ctx[1]
