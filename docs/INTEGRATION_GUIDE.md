# Integration Guide — AAPDA Grid

> This guide explains how to set up the development environment, connect the frontend to the API, and run the full demo for the AAPDA Grid hackathon project.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Branch Setup](#2-clone--branch-setup)
3. [Environment Variables](#3-environment-variables)
4. [Frontend Setup](#4-frontend-setup)
5. [Mock API Adapter](#5-mock-api-adapter)
6. [API Client Architecture](#6-api-client-architecture)
7. [Next.js App Router — Module Mapping](#7-nextjs-app-router--module-mapping)
8. [Build & Lint](#8-build--lint)
9. [Demo Mode](#9-demo-mode)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18 LTS or 20 LTS | Runtime for Next.js |
| npm | 9+ (bundled with Node) | Package manager |
| pnpm *(optional)* | 8+ | Faster alternative to npm |
| Git | 2.40+ | Version control |
| Docker *(optional)* | 24+ | Run PostgreSQL + backend in containers |

> **Windows users:** Use PowerShell or Git Bash. WSL2 is recommended for the best experience.

### Installing Node.js

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

### Installing pnpm (optional)

```bash
npm install -g pnpm
```

---

## 2. Clone & Branch Setup

```bash
# Clone the repository
git clone <REPO_URL> innovathon2
cd innovathon2

# The working branch is already feature/frontend-dashboard
git checkout feature/frontend-dashboard

# Pull the latest changes (if resuming)
git pull origin feature/frontend-dashboard

# Never commit to main
# All work stays on feature/frontend-dashboard
```

### Branch Rules

| Branch | Purpose |
|--------|---------|
| `main` | Protected — do NOT push directly |
| `feature/frontend-dashboard` | All frontend development work |

---

## 3. Environment Variables

The frontend uses Next.js public environment variables (prefixed `NEXT_PUBLIC_`) that are baked into the client bundle at build time.

### Setup

```powershell
# Windows PowerShell
Copy-Item .env.example frontend\.env.local
```

```bash
# macOS / Linux / Git Bash
cp .env.example frontend/.env.local
```

Then open `frontend/.env.local` and edit:

```env
# Required — Backend API base URL
# Development (local backend):
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Development (mock mode — no backend needed):
NEXT_PUBLIC_API_BASE_URL=mock

# Staging (team server):
# NEXT_PUBLIC_API_BASE_URL=https://api-staging.aapda-grid.local

# Map tiles (optional — defaults to OpenStreetMap)
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=© OpenStreetMap contributors
```

> **Never commit `.env.local`.** It is listed in `.gitignore`. The `.env.example` file (committed) contains placeholder values only.

### Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | — | Backend API base URL or `mock` |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | OSM tiles | Leaflet tile layer URL |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | No | OSM attribution | Map attribution string |

---

## 4. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
# or: pnpm install

# Start the development server
npm run dev
# or: pnpm dev
```

The app starts at **http://localhost:3000**.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Hot-reload development server |
| Build | `npm run build` | Production build |
| Start (prod) | `npm run start` | Serve production build |
| Lint | `npm run lint` | Run ESLint |
| Type check | `npm run typecheck` | Run TypeScript compiler (no emit) |

---

## 4B. Backend Setup & Local Server Execution (FastAPI)

The AAPDA Grid backend is a modular **Python 3.11+ / FastAPI** service with an embedded SQLite database (`aapda_grid.db`), SQLAlchemy ORM, NetworkX routing, and automated demo database seeding.

### Installation & Startup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run tests with pytest
python -m pytest

# Start development server on port 8000
python main.py
# or: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend boots at **http://localhost:8000**.

### Backend URLs & Endpoints

| Resource | Path | Description |
|---|---|---|
| Interactive OpenAPI Docs | `/docs` | Swagger UI testbed |
| ReDoc Specification | `/redoc` | Full endpoint specifications |
| Health Check | `/api/v1/health` and `/health` | Live database status & timestamp |
| Incidents Engine | `/api/v1/incidents` | Incident reports, details, and review queue |
| Road Sentinels | `/api/v1/roads` & `/api/v1/roads/closures` | Highway tracking and closures |
| Mountain Routes | `/api/v1/routes/alternatives` | NetworkX alternative route pathfinding |
| Relief Operations | `/api/v1/relief/requests` | Last-mile aid coordination |
| Public Citizen Portal | `/api/v1/public/report` | Zero-PII citizen damage submission |

> **Automated Seeding:** On startup, the server automatically checks `aapda_grid.db` and populates realistic synthetic Jammu & Kashmir disaster scenario records (Ramban, Shopian, Doda, NH-44, Mughal Road) if empty. All records carry `is_simulated = True`.

---

## 5. Mock API Adapter

When the backend is unavailable (e.g. during frontend-only development or demos), the mock adapter intercepts all API calls and returns realistic simulated data.

### Location

```
frontend/lib/api/mock-adapter.ts
```

### How It Works

```typescript
// frontend/lib/api/mock-adapter.ts

import type { ApiAdapter } from './types'
import { mockIncidents, mockRoads, mockReliefRequests } from './mock-data'

export const mockAdapter: ApiAdapter = {
  // AAPDA Lens
  getIncidents: async (params) => ({
    data: mockIncidents.filter(i =>
      (!params.status || i.status === params.status) &&
      (!params.severity || i.severity === params.severity)
    ),
    total: mockIncidents.length,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total_pages: 1
  }),
  getIncident: async (id) => mockIncidents.find(i => i.id === id) ?? null,

  // MargRakshak
  getRoads: async (params) => mockRoads.filter(r =>
    (!params.status || r.status === params.status)
  ),

  // RahatGrid
  getReliefRequests: async (params) => mockReliefRequests,

  // ... all other endpoints follow the same pattern
}
```

### Enabling Mock Mode

Set `NEXT_PUBLIC_API_BASE_URL=mock` in `frontend/.env.local`. The API client factory automatically returns the mock adapter when it detects this value.

### Mock Data Files

```
frontend/lib/api/
├── mock-adapter.ts        # Adapter implementation
├── mock-data/
│   ├── incidents.ts       # Sample incident objects
│   ├── roads.ts           # Sample road/closure objects
│   ├── relief.ts          # Sample requests, inventory, deliveries
│   └── users.ts           # Sample user objects
```

> **Data provenance:** All mock objects include a `_demo: true` flag. UI components check this flag and display a **DEMO** or **SIMULATED DATA** badge to ensure no confusion with real data.

---

## 6. API Client Architecture

### Directory Structure

```
frontend/lib/api/
├── index.ts               # Public re-export / factory
├── types.ts               # ApiAdapter interface + all request/response types
├── http-client.ts         # Real HTTP client (uses fetch with auth headers)
├── mock-adapter.ts        # Mock adapter (in-memory)
├── incidents.ts           # Typed wrappers for /api/incidents/*
├── roads.ts               # Typed wrappers for /api/roads/*
├── relief.ts              # Typed wrappers for /api/relief/*
├── auth.ts                # Typed wrappers for /api/auth/*
└── public.ts              # Typed wrappers for /api/public/*
```

### ApiAdapter Interface

Every adapter (real and mock) implements the same interface defined in `types.ts`. This ensures the swap is entirely transparent to UI components.

```typescript
// frontend/lib/api/types.ts

export interface ApiAdapter {
  // Auth
  login(creds: LoginRequest): Promise<LoginResponse>
  getMe(): Promise<User>

  // Incidents
  getIncidents(params: IncidentListParams): Promise<PaginatedResponse<Incident>>
  getIncident(id: string): Promise<Incident>
  createIncident(body: IncidentCreate): Promise<Incident>
  updateIncidentStatus(id: string, body: StatusUpdate): Promise<Incident>
  getIncidentDuplicates(id: string): Promise<DuplicatesResponse>
  verifyIncident(id: string, body: VerifyRequest): Promise<Incident>

  // Roads
  getRoads(params: RoadListParams): Promise<Road[]>
  getRoad(id: string): Promise<Road>
  reportClosure(roadId: string, body: ClosureCreate): Promise<RoadClosure>
  getRoutes(params: RouteParams): Promise<RoutesResponse>
  getSettlements(params: SettlementParams): Promise<Settlement[]>
  getFacilities(params: FacilityParams): Promise<Facility[]>

  // Relief
  getReliefRequests(params: ReliefListParams): Promise<PaginatedResponse<ReliefRequest>>
  createReliefRequest(body: ReliefRequestCreate): Promise<ReliefRequest>
  getReliefRequest(id: string): Promise<ReliefRequestDetail>
  updateReliefRequestStatus(id: string, body: StatusUpdate): Promise<ReliefRequest>
  getInventory(params: InventoryParams): Promise<InventoryItem[]>
  adjustInventory(body: InventoryAdjust): Promise<InventoryItem>
  getAllocations(params: AllocationParams): Promise<Allocation[]>
  createAllocation(body: AllocationCreate): Promise<Allocation>
  getDeliveries(params: DeliveryParams): Promise<Delivery[]>
  updateDeliveryStatus(id: string, body: DeliveryStatusUpdate): Promise<Delivery>

  // Public
  submitPublicReport(body: PublicReport): Promise<PublicReportResponse>
  getPublicReportStatus(trackingId: string): Promise<PublicReportStatus>
}
```

### Factory — Swapping Mock for Real

```typescript
// frontend/lib/api/index.ts

import { mockAdapter } from './mock-adapter'
import { createHttpClient } from './http-client'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'mock'

export const api =
  BASE_URL === 'mock'
    ? mockAdapter
    : createHttpClient(BASE_URL)
```

**To switch from mock to real backend:** change `NEXT_PUBLIC_API_BASE_URL` in `.env.local` from `mock` to `http://localhost:8000` and restart the dev server. No code changes required.

### Auth Token Handling

The HTTP client reads the JWT from `localStorage` (key: `aapda_token`) and injects it as `Authorization: Bearer <token>` on every non-public request.

```typescript
// frontend/lib/api/http-client.ts (excerpt)

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aapda_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
```

---

## 7. Next.js App Router — Module Mapping

```
frontend/app/
├── layout.tsx                     # Root layout (nav, auth context)
├── page.tsx                       # Landing / redirect to /dashboard
├── (auth)/
│   ├── login/page.tsx             # Login page → POST /api/auth/login
│   └── layout.tsx                 # Unauthenticated layout
├── (dashboard)/
│   ├── layout.tsx                 # Authenticated layout (sidebar)
│   ├── dashboard/page.tsx         # Overview — all three modules summary
│   │
│   ├── lens/                      # AAPDA Lens — Incident Management
│   │   ├── page.tsx               # Incident list → GET /api/incidents
│   │   ├── [id]/page.tsx          # Incident detail → GET /api/incidents/:id
│   │   ├── [id]/review/page.tsx   # Review queue → PATCH, POST /api/incidents/:id/*
│   │   └── new/page.tsx           # Report form → POST /api/incidents
│   │
│   ├── roads/                     # MargRakshak — Roads & Routes
│   │   ├── page.tsx               # Road map → GET /api/roads
│   │   ├── [id]/page.tsx          # Road detail → GET /api/roads/:id
│   │   ├── routes/page.tsx        # Route planner → GET /api/roads/routes
│   │   └── settlements/page.tsx   # Isolated settlements → GET /api/settlements
│   │
│   └── relief/                    # RahatGrid — Relief Coordination
│       ├── page.tsx               # Request dashboard → GET /api/relief/requests
│       ├── requests/[id]/page.tsx # Request detail → GET /api/relief/requests/:id
│       ├── inventory/page.tsx     # Inventory view → GET /api/inventory
│       ├── allocations/page.tsx   # Allocations → GET /api/allocations
│       └── deliveries/page.tsx    # Delivery tracking → GET /api/deliveries
│
└── public-report/
    └── page.tsx                   # Citizen report form → POST /api/public/report
```

### Shared Components

```
frontend/app/components/
├── ui/              # shadcn/ui wrappers (Button, Card, Badge, etc.)
├── map/             # Leaflet map components (MapContainer, MarkerLayer, RouteLayer)
├── incidents/       # IncidentCard, SeverityBadge, AIScoreDisplay
├── roads/           # RoadStatusBadge, ClosureMarker, RouteCard
├── relief/          # RequestCard, PriorityBadge, AllocationTable
└── shared/          # DemoBanner, LoadingSpinner, ErrorBoundary, HumanConfirmModal
```

> **Important:** The `HumanConfirmModal` component wraps every AI-recommended action. It displays AI reasoning with a clear `AI RECOMMENDATION` label and requires an explicit **Confirm** button click before any API write call is made.

---

## 8. Build & Lint

Always run these before committing:

```bash
cd frontend

# Type-check the entire project
npm run typecheck

# Lint (ESLint + Next.js rules)
npm run lint

# Production build (catches missing env vars, broken imports)
npm run build
```

### Pre-commit Checklist

- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero warnings in src/)
- [ ] `npm run build` succeeds
- [ ] Test navigation on a mobile viewport (375 px width)
- [ ] All AI-output UI elements carry `AI RECOMMENDATION` label
- [ ] No hardcoded coordinates, tokens, or API URLs in source

---

## 9. Demo Mode

Demo mode runs the full frontend with realistic mock data — no backend or database required.

### Starting Demo Mode

```powershell
# 1. Ensure .env.local has mock URL
Set-Content frontend\.env.local "NEXT_PUBLIC_API_BASE_URL=mock`nNEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

# 2. Install and start
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000** and log in with any of the demo credentials:

| Role | Email | Password |
|------|-------|---------|
| DDMA Officer | `ddma@demo.local` | `demo1234` |
| Field Officer | `field@demo.local` | `demo1234` |
| NGO Partner | `ngo@demo.local` | `demo1234` |
| Admin | `admin@demo.local` | `demo1234` |

### What Demo Mode Includes

- **AAPDA Lens:** 15 sample incidents across J&K districts, with varying severity and AI confidence scores, 3 duplicate pairs flagged for human review.
- **MargRakshak:** 20 road segments, 5 active closures, 3 isolated settlements, route planner showing 2–3 alternate routes.
- **RahatGrid:** 8 relief requests at various stages, inventory across 3 warehouses, 4 proposed AI allocations awaiting human approval, 6 deliveries being tracked.

> All demo data is clearly labelled with **[DEMO]** / **[SIMULATED DATA]** banners on each page and in every exported report.

---

## 10. Troubleshooting

### CORS Errors (when using real backend)

**Symptom:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin' header`.

**Fix:** Ensure the backend allows `http://localhost:3000`:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Temporary workaround (dev only):** Use Next.js API route proxy:

```typescript
// frontend/app/api/proxy/[...path]/route.ts
// Proxies /api/* to NEXT_PUBLIC_API_BASE_URL/* on the server side, bypassing CORS.
```

---

### Environment Variable Not Picked Up

**Symptom:** API calls go to `undefined` or the wrong URL.

**Fix checklist:**
1. File must be named `.env.local` (not `.env` or `.env.development`).
2. Variable must be prefixed `NEXT_PUBLIC_` to be available in the browser bundle.
3. Restart the dev server after editing `.env.local` (`Ctrl+C` then `npm run dev`).
4. Verify: open browser DevTools → Console → type `process.env.NEXT_PUBLIC_API_BASE_URL`.

---

### Map Tiles Not Loading

**Symptom:** Map shows grey tiles or `net::ERR_NAME_NOT_RESOLVED`.

**Fix options:**

```env
# Option 1 — Use a different OSM mirror
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Option 2 — Use Stadia Maps (free tier)
NEXT_PUBLIC_MAP_TILE_URL=https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png

# Option 3 — Offline tiles via Docker (mbtiles + tileserver-gl)
# docker run -p 8080:80 -v ./tiles:/data maptiler/tileserver-gl
# NEXT_PUBLIC_MAP_TILE_URL=http://localhost:8080/styles/basic-preview/{z}/{x}/{y}.png
```

> Leaflet requires a valid tile URL with `{z}`, `{x}`, `{y}` placeholders.

---

### `hydration mismatch` Error

**Symptom:** Next.js throws `Error: Hydration failed because the initial UI does not match...` on pages with maps.

**Fix:** Leaflet is browser-only. Import map components with `dynamic()` and `ssr: false`:

```typescript
// frontend/app/(dashboard)/roads/page.tsx

import dynamic from 'next/dynamic'

const RoadMap = dynamic(
  () => import('@/components/map/RoadMap'),
  { ssr: false, loading: () => <div className="h-96 bg-muted animate-pulse" /> }
)
```

---

### `Module not found` After `npm install`

**Symptom:** Build fails with `Cannot find module '@/components/...'`.

**Fix:**

```bash
# Clear Next.js cache and node_modules
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

### Git Commits Rejected (pre-commit hook)

**Symptom:** `git commit` fails with lint or type errors.

**Fix:** Resolve all errors reported by the hook:

```bash
cd frontend
npm run typecheck  # fix TypeScript errors first
npm run lint --fix # auto-fix ESLint issues
# then retry: git add . && git commit -m "..."
```

---

*Last updated: 2024 — AAPDA Grid Hackathon*
