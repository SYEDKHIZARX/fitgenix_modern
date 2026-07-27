"""Supabase client helpers for the FITGENIX API."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional, Tuple

from fastapi import Depends, Header, HTTPException

# Load project-root .env if present (local dev)
try:
    from dotenv import load_dotenv

    _root = Path(__file__).resolve().parents[1]
    # override=True so real .env values win over stale shell placeholders
    load_dotenv(_root / ".env", override=True)
except Exception:
    pass


def _env(name: str, *alts: str) -> Optional[str]:
    for n in (name, *alts):
        v = os.environ.get(n) or os.environ.get(n.lower())
        if not v:
            continue
        v = v.strip().strip('"').strip("'")
        if not v or "PASTE_YOUR" in v or v.endswith("_HERE"):
            continue
        return v
    return None


def supabase_configured() -> bool:
    return bool(_env("SUPABASE_URL") and _env("SUPABASE_KEY", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"))


@lru_cache(maxsize=1)
def get_admin_client():
    """Service-role or anon client for server-side ops."""
    # Re-load .env each process start (cache is per-process)
    try:
        from dotenv import load_dotenv as _ld

        _ld(Path(__file__).resolve().parents[1] / ".env", override=True)
    except Exception:
        pass
    if not supabase_configured():
        return None
    from supabase import create_client

    url = _env("SUPABASE_URL")
    key = (
        _env("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY")
        or _env("SUPABASE_KEY", "SUPABASE_ANON_KEY")
    )
    return create_client(url, key)


def get_user_from_token(token: str) -> Tuple[str, Any]:
    """Validate JWT via Supabase Auth. Returns (user_id, user)."""
    client = get_admin_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured on the API")
    try:
        res = client.auth.get_user(token)
        user = res.user
        if not user or not user.id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.id, user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth failed: {e}") from e


class AuthUser:
    def __init__(self, id: str, email: Optional[str] = None, token: Optional[str] = None):
        self.id = id
        self.email = email
        self.token = token


async def optional_user(
    authorization: Optional[str] = Header(default=None),
) -> Optional[AuthUser]:
    """Return AuthUser if Bearer token present and valid; else None."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    if not supabase_configured():
        return None
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None
    uid, user = get_user_from_token(token)
    return AuthUser(id=uid, email=getattr(user, "email", None), token=token)


async def require_user(user: Optional[AuthUser] = Depends(optional_user)) -> AuthUser:
    if user is None:
        if not supabase_configured():
            raise HTTPException(
                status_code=503,
                detail="Auth required but SUPABASE_URL / SUPABASE_KEY are not set on the API",
            )
        raise HTTPException(status_code=401, detail="Authorization Bearer token required")
    return user
