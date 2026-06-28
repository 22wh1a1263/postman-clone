import json
import re
import time
import base64
from contextlib import asynccontextmanager
from typing import List, Optional

import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from database import get_db, init_db
from models import Collection, SavedRequest, Environment, History
from schemas import (
    CollectionCreate, CollectionUpdate, CollectionOut,
    SavedRequestCreate, SavedRequestUpdate, SavedRequestOut,
    EnvironmentCreate, EnvironmentUpdate, EnvironmentOut,
    HistoryOut, RunRequest, RunResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Postman Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ────────────────────────────────────────────────────────────────────
def resolve_variables(text: str, variables: list[dict]) -> str:
    """Replace {{key}} placeholders with environment variable values."""
    for var in variables:
        if var.get("enabled", True):
            text = text.replace(f"{{{{{var['key']}}}}}", var["value"])
    return text


# ── Collections ────────────────────────────────────────────────────────────────
@app.get("/api/collections", response_model=List[CollectionOut])
async def list_collections(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Collection).order_by(Collection.created_at))
    return result.scalars().all()


@app.post("/api/collections", response_model=CollectionOut)
async def create_collection(data: CollectionCreate, db: AsyncSession = Depends(get_db)):
    col = Collection(**data.model_dump())
    db.add(col)
    await db.commit()
    await db.refresh(col)
    return col


@app.put("/api/collections/{col_id}", response_model=CollectionOut)
async def update_collection(col_id: int, data: CollectionUpdate, db: AsyncSession = Depends(get_db)):
    col = await db.get(Collection, col_id)
    if not col:
        raise HTTPException(404, "Collection not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(col, k, v)
    await db.commit()
    await db.refresh(col)
    return col


@app.delete("/api/collections/{col_id}")
async def delete_collection(col_id: int, db: AsyncSession = Depends(get_db)):
    col = await db.get(Collection, col_id)
    if not col:
        raise HTTPException(404, "Collection not found")
    await db.delete(col)
    await db.commit()
    return {"ok": True}


# ── Saved Requests ─────────────────────────────────────────────────────────────
@app.get("/api/collections/{col_id}/requests", response_model=List[SavedRequestOut])
async def list_requests(col_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SavedRequest).where(SavedRequest.collection_id == col_id).order_by(SavedRequest.created_at)
    )
    return result.scalars().all()


@app.post("/api/requests", response_model=SavedRequestOut)
async def create_request(data: SavedRequestCreate, db: AsyncSession = Depends(get_db)):
    req = SavedRequest(**data.model_dump())
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


@app.put("/api/requests/{req_id}", response_model=SavedRequestOut)
async def update_request(req_id: int, data: SavedRequestUpdate, db: AsyncSession = Depends(get_db)):
    req = await db.get(SavedRequest, req_id)
    if not req:
        raise HTTPException(404, "Request not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(req, k, v)
    await db.commit()
    await db.refresh(req)
    return req


@app.delete("/api/requests/{req_id}")
async def delete_request(req_id: int, db: AsyncSession = Depends(get_db)):
    req = await db.get(SavedRequest, req_id)
    if not req:
        raise HTTPException(404, "Request not found")
    await db.delete(req)
    await db.commit()
    return {"ok": True}


# ── Environments ───────────────────────────────────────────────────────────────
@app.get("/api/environments", response_model=List[EnvironmentOut])
async def list_environments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Environment).order_by(Environment.created_at))
    return result.scalars().all()


@app.post("/api/environments", response_model=EnvironmentOut)
async def create_environment(data: EnvironmentCreate, db: AsyncSession = Depends(get_db)):
    env = Environment(**data.model_dump())
    db.add(env)
    await db.commit()
    await db.refresh(env)
    return env


@app.put("/api/environments/{env_id}", response_model=EnvironmentOut)
async def update_environment(env_id: int, data: EnvironmentUpdate, db: AsyncSession = Depends(get_db)):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(404, "Environment not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(env, k, v)
    await db.commit()
    await db.refresh(env)
    return env


@app.delete("/api/environments/{env_id}")
async def delete_environment(env_id: int, db: AsyncSession = Depends(get_db)):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(404, "Environment not found")
    await db.delete(env)
    await db.commit()
    return {"ok": True}


# ── History ────────────────────────────────────────────────────────────────────
@app.get("/api/history", response_model=List[HistoryOut])
async def list_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(History).order_by(History.created_at.desc()).limit(100))
    return result.scalars().all()


@app.delete("/api/history")
async def clear_history(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(History))
    await db.commit()
    return {"ok": True}


@app.delete("/api/history/{hist_id}")
async def delete_history_item(hist_id: int, db: AsyncSession = Depends(get_db)):
    h = await db.get(History, hist_id)
    if not h:
        raise HTTPException(404, "History item not found")
    await db.delete(h)
    await db.commit()
    return {"ok": True}


# ── Request Runner ─────────────────────────────────────────────────────────────
@app.post("/api/run", response_model=RunResponse)
async def run_request(data: RunRequest, db: AsyncSession = Depends(get_db)):
    # Resolve environment variables
    variables = []
    if data.environment_id:
        env = await db.get(Environment, data.environment_id)
        if env:
            variables = json.loads(env.variables)

    url = resolve_variables(data.url, variables)
    
    # Build query params
    params = {item.key: resolve_variables(item.value, variables)
              for item in data.params if item.enabled and item.key}

    # Build headers
    headers = {item.key: resolve_variables(item.value, variables)
               for item in data.headers if item.enabled and item.key}

    # Auth
    auth = None
    if data.auth_type == "bearer" and data.auth_token:
        headers["Authorization"] = f"Bearer {resolve_variables(data.auth_token, variables)}"
    elif data.auth_type == "basic" and data.auth_username:
        creds = base64.b64encode(
            f"{data.auth_username}:{data.auth_password or ''}".encode()
        ).decode()
        headers["Authorization"] = f"Basic {creds}"

    # Build body
    content = None
    body_content = resolve_variables(data.body_content, variables)
    if data.body_type == "raw" and body_content:
        content = body_content.encode()
        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"
    elif data.body_type == "urlencoded" and body_content:
        # parse key=value pairs
        pairs = {}
        for line in body_content.split("\n"):
            if "=" in line:
                k, _, v = line.partition("=")
                pairs[k.strip()] = v.strip()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        content = "&".join(f"{k}={v}" for k, v in pairs.items()).encode()

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.request(
                method=data.method,
                url=url,
                params=params,
                headers=headers,
                content=content,
            )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        body_bytes = resp.content
        body_text = body_bytes.decode("utf-8", errors="replace")
        size = len(body_bytes)
        is_json = "json" in resp.headers.get("content-type", "")
        status_code = resp.status_code

    except httpx.TimeoutException:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        body_text = "Request timed out after 30 seconds."
        size = len(body_text)
        is_json = False
        status_code = 0
        resp_headers = {}
    except Exception as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        body_text = f"Error: {str(e)}"
        size = len(body_text)
        is_json = False
        status_code = 0
        resp_headers = {}
    else:
        resp_headers = dict(resp.headers)

    # Save to history
    hist = History(
        method=data.method,
        url=data.url,
        headers=json.dumps([i.model_dump() for i in data.headers]),
        params=json.dumps([i.model_dump() for i in data.params]),
        body_type=data.body_type,
        body_content=data.body_content,
        auth_type=data.auth_type,
        auth_data=json.dumps({}),
        response_status=status_code if status_code else None,
        response_time=elapsed_ms,
        response_size=size,
    )
    db.add(hist)
    await db.commit()

    return RunResponse(
        status=status_code,
        status_text=str(status_code),
        time_ms=elapsed_ms,
        size_bytes=size,
        headers=resp_headers if status_code else {},
        body=body_text,
        is_json=is_json,
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
