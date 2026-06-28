# API Client — Postman Clone

A full-featured Postman clone built with **Next.js (TypeScript)** and **FastAPI (Python)**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy (async) |
| Database | SQLite via `aiosqlite` |
| HTTP Runner | `httpx` (async, CORS-bypassing proxy) |

## Features

- **Multi-tab workspace** — open multiple requests simultaneously, each with independent state
- **Full HTTP methods** — GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request builder** — Params, Headers, Auth (None / Bearer / Basic), Body (raw JSON, form-data, urlencoded)
- **Real request execution** — backend proxies requests to avoid browser CORS limits
- **Response viewer** — Pretty / Raw views with JSON syntax highlighting, status, time, size
- **Collections** — Create, rename, delete collections; save/delete requests; nested display
- **Environments & Variables** — Create/edit environments with key-value variables; `{{variable}}` resolution at send time
- **History** — Last 100 requests auto-saved; re-open any entry; clear individual or all
- **Resizable layout** — drag sidebar width and request/response split

## Architecture

```
postman-clone/
├── backend/
│   ├── main.py         # FastAPI app, all API routes
│   ├── models.py       # SQLAlchemy ORM models
│   ├── schemas.py      # Pydantic request/response schemas
│   ├── database.py     # DB engine, session, seed data
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx    # Main workspace (tabs, layout, state)
    │   └── layout.tsx
    ├── components/
    │   ├── Sidebar.tsx         # Collections + History panel
    │   ├── RequestBuilder.tsx  # URL bar + Params/Headers/Auth/Body tabs
    │   ├── ResponseViewer.tsx  # Body/Headers response display
    │   ├── KVEditor.tsx        # Reusable key-value table editor
    │   ├── MethodSelector.tsx  # HTTP method dropdown
    │   ├── StatusBadge.tsx     # Status / time / size bar
    │   ├── EnvironmentModal.tsx
    │   └── Toast.tsx
    ├── lib/api.ts      # Axios API client
    └── types/index.ts  # TypeScript interfaces
```

## Database Schema

```sql
collections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME,
  updated_at DATETIME
)

saved_requests (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT,         -- GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS
  url TEXT,
  headers TEXT,        -- JSON: [{key, value, enabled}]
  params TEXT,         -- JSON: [{key, value, enabled}]
  body_type TEXT,      -- none | raw | form-data | x-www-form-urlencoded
  body_content TEXT,
  auth_type TEXT,      -- none | bearer | basic
  auth_data TEXT,      -- JSON: {token?, username?, password?}
  created_at DATETIME,
  updated_at DATETIME
)

environments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  variables TEXT,      -- JSON: [{key, value, enabled}]
  created_at DATETIME,
  updated_at DATETIME
)

history (
  id INTEGER PRIMARY KEY,
  method TEXT,
  url TEXT,
  headers TEXT,        -- JSON
  params TEXT,         -- JSON
  body_type TEXT,
  body_content TEXT,
  auth_type TEXT,
  auth_data TEXT,
  response_status INTEGER,
  response_time INTEGER,   -- milliseconds
  response_size INTEGER,   -- bytes
  created_at DATETIME
)
```

## Setup & Run

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The database is auto-created and seeded on first run at `backend/postman_clone.db`.

### Frontend

```bash
cd frontend
npm install
npm run dev       # development — http://localhost:3000
# or
npm run build && npm start   # production
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` (default) in `.env.local` if your backend runs elsewhere.

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/collections` | List all collections |
| POST | `/api/collections` | Create collection |
| PUT | `/api/collections/{id}` | Update collection |
| DELETE | `/api/collections/{id}` | Delete collection (cascades) |
| GET | `/api/collections/{id}/requests` | List requests in collection |
| POST | `/api/requests` | Create saved request |
| PUT | `/api/requests/{id}` | Update saved request |
| DELETE | `/api/requests/{id}` | Delete saved request |
| GET | `/api/environments` | List environments |
| POST | `/api/environments` | Create environment |
| PUT | `/api/environments/{id}` | Update environment |
| DELETE | `/api/environments/{id}` | Delete environment |
| GET | `/api/history` | List history (last 100) |
| DELETE | `/api/history` | Clear all history |
| DELETE | `/api/history/{id}` | Delete history item |
| POST | `/api/run` | **Execute HTTP request** (proxy runner) |
| GET | `/api/health` | Health check |

## Seed Data

On first start the database is seeded with:
- **2 collections**: JSONPlaceholder API (4 requests) + HTTPBin Testing (3 requests)
- **3 environments**: Development, Production, HTTPBin — each with `baseUrl`, `env`, `apiKey` variables
- **3 history entries** pointing at public test APIs

## Assumptions

- Single user workspace (no auth); user is treated as always logged in
- `form-data` body is stored as JSON key-value pairs and sent as multipart by the runner
- Environment variables use `{{varName}}` syntax, resolved at send time on the backend
- History is capped at 100 most recent entries
