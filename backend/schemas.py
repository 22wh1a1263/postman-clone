from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ── Collections ────────────────────────────────────────────────────────────────
class CollectionCreate(BaseModel):
    name: str
    description: str = ""


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Saved Requests ─────────────────────────────────────────────────────────────
class SavedRequestCreate(BaseModel):
    collection_id: int
    name: str
    method: str = "GET"
    url: str = ""
    headers: str = "[]"
    params: str = "[]"
    body_type: str = "none"
    body_content: str = ""
    auth_type: str = "none"
    auth_data: str = "{}"


class SavedRequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[str] = None
    params: Optional[str] = None
    body_type: Optional[str] = None
    body_content: Optional[str] = None
    auth_type: Optional[str] = None
    auth_data: Optional[str] = None


class SavedRequestOut(BaseModel):
    id: int
    collection_id: int
    name: str
    method: str
    url: str
    headers: str
    params: str
    body_type: str
    body_content: str
    auth_type: str
    auth_data: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Environments ───────────────────────────────────────────────────────────────
class EnvironmentCreate(BaseModel):
    name: str
    variables: str = "[]"


class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    variables: Optional[str] = None


class EnvironmentOut(BaseModel):
    id: int
    name: str
    variables: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── History ────────────────────────────────────────────────────────────────────
class HistoryOut(BaseModel):
    id: int
    method: str
    url: str
    headers: str
    params: str
    body_type: str
    body_content: str
    auth_type: str
    auth_data: str
    response_status: Optional[int]
    response_time: Optional[int]
    response_size: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Request Runner ─────────────────────────────────────────────────────────────
class KVItem(BaseModel):
    key: str
    value: str
    enabled: bool = True


class AuthData(BaseModel):
    token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class RunRequest(BaseModel):
    method: str
    url: str
    headers: List[KVItem] = []
    params: List[KVItem] = []
    body_type: str = "none"
    body_content: str = ""
    auth_type: str = "none"
    auth_token: Optional[str] = None
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None
    environment_id: Optional[int] = None


class RunResponse(BaseModel):
    status: int
    status_text: str
    time_ms: int
    size_bytes: int
    headers: dict
    body: str
    is_json: bool
