# backend/livekit_utils.py
import os
import time
from datetime import timedelta
import jwt  # PyJWT


def ensure_room(room_name: str) -> None:
    """
    Demo ke liye no-op: LiveKit room pehli join par auto-create ho jata hai.
    Agar chaho to yaha LiveKit Server REST se pre-create kar sakte ho.
    """
    return


def _get_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(
            f"Missing env var {name}. Did you set it in backend/.env and restart the server?"
        )
    return val


def create_access_token(
    identity: str,
    room: str,
    ttl: timedelta | None = None,
) -> str:
    """
    LiveKit JWT (HS256) build karta hai.
    - Cloud ke liye 'aud' == 'livekit' required.
    - Minimal video grants: join/publish/subscribe for a specific room.
    """
    if ttl is None:
        ttl = timedelta(hours=2)

    api_key = _get_env("LK_API_KEY")
    api_secret = _get_env("LK_API_SECRET")

    now = int(time.time())
    exp = now + int(ttl.total_seconds())

    payload = {
        "iss": api_key,          # API key (issuer)
        "sub": identity,         # participant identity (subject)
        "name": identity,
        "iat": now,              # issued at
        "nbf": now,              # not before
        "exp": exp,              # expiry
        "aud": "livekit",        # IMPORTANT for LiveKit Cloud
        "video": {               # grants
            "room": room,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
        },
    }

    token = jwt.encode(payload, api_secret, algorithm="HS256")
    return token.decode("utf-8") if isinstance(token, bytes) else token
