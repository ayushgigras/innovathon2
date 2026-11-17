# TASKS.md — AAPDA Grid Task Board

> Assigned tasks for all 4 team members. Update status as work progresses.
> Priority: **P0** = blocker (do first), **P1** = core feature, **P2** = nice-to-have.
> Status: `[ ]` = pending, `[~]` = in progress, `[x]` = done.

---

## Dev A — Frontend Lead

### FE-01 | P0 | Next.js Project Scaffold
**Status:** `[x]`  
**Acceptance:** `npx create-next-app@latest` completes with TypeScript, Tailwind, App Router, and ESLint configured. `npm run dev` starts without errors on port 3000.

### FE-02 | P0 | shadcn/ui Initialization
**Status:** `[x]`  
**Acceptance:** Custom button, card, badge, dialog/modal primitives added without TypeScript errors.

### FE-03 | P0 | App Shell — Sidebar + Navigation
**Status:** `[x]`  
**Acceptance:** Persistent sidebar with links to Overview, AAPDA Lens, MargRakshak, and RahatGrid renders at all viewport widths. Mobile: collapsible drawer. Active route is highlighted.

### FE-04 | P0 | TypeScript Type Definitions
**Status:** `[x]`  
**Acceptance:** `frontend/types/` contains typed interfaces for `Incident`, `Road`, `ReliefRequest`, `InventoryItem`, `AllocationRecommendation`, `PublicReport`. All types match `docs/API_CONTRACT.md`. No `any`.

### FE-05 | P0 | Mock API Adapter
**Status:** `[x]`  
**Acceptance:** `frontend/lib/api/mock-adapter.ts` exports functions matching all API client signatures in `frontend/lib/api/`. Returns realistic static data for all three modules. All returned data has DEMO/SIMULATED labels where displayed.

### FE-06 | P1 | Overview Dashboard
**Status:** `[x]`  
**Acceptance:** `/` route redirects to `/dashboard` which shows 4 summary cards (active incidents, road closures, pending relief requests, settlements at risk) with values from mock adapter. Each card has a visible DEMO badge. Links to respective modules work.

### FE-07 | P1 | AAPDA Lens Module
**Status:** `[x]`  
**Acceptance:** `/dashboard/incidents` route shows: (a) incident list table with severity, location, timestamp, duplicate-flag column; (b) Review Queue tab with approve/reject buttons; (c) duplicate pair comparison view; (d) uncertainty score column with SIMULATED badge; (e) human confirmation modal before approve/reject action is applied.

### FE-08 | P1 | MargRakshak Map Module
**Status:** `[x]`  
**Acceptance:** `/dashboard/roads` route shows Leaflet map centered on J&K with OpenStreetMap tiles. Road closure markers (red) and open road markers (green) display from mock data. Sidebar lists closures with AI-suggested alternate routes. Disconnected settlements are shown as a separate layer. Map loads without console errors.

### FE-09 | P1 | RahatGrid Module
**Status:** `[x]`  
**Acceptance:** `/dashboard/relief` route shows: (a) relief request list with priority scores (SIMULATED badge); (b) inventory table with item, quantity, location; (c) AI allocation recommendation panel with human confirmation button; (d) delivery tracking list with status badges. No allocation action proceeds without human confirmation.

### FE-10 | P1 | Public Report Form
**Status:** `[x]`  
**Acceptance:** `/dashboard/incidents/report` and `/report` routes show a form with fields: reporter name (optional), location (text + map pin placeholder), incident type (dropdown), severity (select), description, photo upload (UI only). Form validates required fields and shows a success screen with a generated report ID on submit.

### FE-11 | P1 | Responsive Layout Audit
**Status:** `[x]`  
**Acceptance:** All pages are tested and functional at 375px, 768px, and 1440px. No horizontal overflow. Text is legible. Navigation is accessible on mobile. Tables scroll horizontally on small screens.

### FE-12 | P2 | Dark Mode Support
**Status:** `[x]`  
**Acceptance:** Tailwind dark mode class strategy implemented. All pages readable in dark theme tokens. Accessible contrast throughout.

---

## Dev B — Backend Lead

### BE-01 | P0 | API Contract Documentation
**Status:** `[x]`  
**Acceptance:** `docs/API_CONTRACT.md` documents all endpoints with HTTP method, path, request body schema, response schema (typed), and example response. Covers: `/incidents`, `/incidents/:id/review`, `/roads`, `/relief-requests`, `/inventory`, `/allocations`, `/report` (POST). Frontend Lead has reviewed and signed off.

### BE-02 | P0 | Backend Project Initialization
**Status:** `[x]`  
**Acceptance:** Backend server (FastAPI) boots with `python -m uvicorn app.main:app` or `python main.py`. Returns `{"status":"ok"}` on `GET /health` and `GET /api/v1/health`. CORS configured for `localhost:3000`. Project is in `backend/` directory.

### BE-03 | P0 | Database Schema Design
**Status:** `[x]`  
**Acceptance:** `docs/DATABASE_SCHEMA.md` documents all tables/collections with column names, types, constraints, and relationships. Covers: incidents, road_closures, relief_requests, inventory, allocations, public_reports. Reviewed by Data/AI Lead.

### BE-04 | P1 | Incidents API Endpoints
**Status:** `[x]`  
**Acceptance:** `GET /api/v1/incidents` returns array of incidents matching schema. `PATCH /api/v1/incidents/:id/status` accepts status update and reviewer ID, writes to audit log, and returns updated incident. Corroboration reports via `POST/GET /api/v1/incidents/:id/reports`.

### BE-05 | P1 | Roads & Closures API Endpoints
**Status:** `[x]`  
**Acceptance:** `GET /api/v1/roads` returns road segments with closure status and coordinates. `POST /api/v1/roads/closures` records closures and flags disconnected settlements as isolated. `GET /api/v1/routes/alternatives` uses NetworkX graph routing.

### BE-06 | P1 | Relief & Inventory API Endpoints
**Status:** `[x]`  
**Acceptance:** `GET /api/v1/relief/requests` returns prioritized list. `GET /api/v1/relief/inventory` returns current stock. `POST /api/v1/relief/allocations` enforces human confirmation before reserving inventory and generating delivery tracking.

### BE-07 | P1 | Public Report Endpoint
**Status:** `[x]`  
**Acceptance:** `POST /api/v1/public/report` accepts citizen incident report, validates required fields, assigns tracking ID with status `queued_for_review`. Input sanitized and zero PII leaked.

### BE-08 | P2 | API Authentication Stub & Middleware
**Status:** `[x]`  
**Acceptance:** Role checks, human confirmation verification, and CORS middleware configured. Ready to enforce JWT / API keys post-hackathon.

---

## Dev C — Data/AI Lead

### AI-01 | P0 | Development Environment Setup
**Status:** `[ ]`  
**Acceptance:** Python venv (or Node env) is created, all dependencies installed, and a `README` in `ai/` describes how to run scripts. Environment is reproducible from `requirements.txt` or `package.json`.

### AI-02 | P0 | Database Seeding Scripts
**Status:** `[ ]`  
**Acceptance:** Seed scripts in `ai/seed/` populate the database (or generate JSON fixtures) with realistic synthetic data for J&K region: at least 20 incidents (5 duplicates), 15 road closure records, 10 relief requests, inventory for 5 items at 3 locations. All synthetic data includes a `is_synthetic: true` flag.

### AI-03 | P0 | Incident Deduplication Logic Stub
**Status:** `[ ]`  
**Acceptance:** `ai/deduplication.py` (or `.ts`) implements a function `findDuplicateCandidates(incidents)` that returns pairs with a similarity score. Uses at minimum: location proximity (< 2km), timestamp proximity (< 2h), incident type match. Returns `{pair: [id_a, id_b], score: number, reasons: string[]}`. Labelled as a heuristic estimate in output.

### AI-04 | P1 | Priority Scoring Algorithm
**Status:** `[ ]`  
**Acceptance:** `ai/priority_scoring.py` (or `.ts`) implements `scorePriority(reliefRequest)` returning a numeric score (0–100) based on: population affected, days since last supply, medical urgency flag, road accessibility score. Score is clearly documented as an estimate. Output includes `{request_id, score, factors: {...}, disclaimer: "AI estimate — requires human review"}`.

### AI-05 | P1 | Uncertainty Score Generation
**Status:** `[ ]`  
**Acceptance:** `ai/uncertainty.py` computes an uncertainty score (0–1) for each incident based on: number of corroborating reports, source credibility weight, recency of evidence. Output includes a human-readable label: "High Confidence", "Medium Confidence", "Low Confidence — Verify Before Acting".

### AI-06 | P1 | AI Model Integration Stubs
**Status:** `[ ]`  
**Acceptance:** Stub interfaces in `ai/models/` define the expected input/output for: (a) duplicate detection model, (b) road accessibility predictor, (c) relief priority ranker. Each stub logs its call and returns plausible mock output. Stubs are clearly marked `# STUB — Replace with real model` in comments.

### AI-07 | P2 | Feasibility Scoring for Deliveries
**Status:** `[ ]`  
**Acceptance:** `ai/feasibility.py` takes a delivery route and current road closure data and returns a feasibility score (0–1) with reasons. Accounts for: road closure overlap, distance, weather flag placeholder. Output includes disclaimer as an AI estimate.

### AI-08 | P2 | Evidence Consistency Checker
**Status:** `[ ]`  
**Acceptance:** `ai/evidence_consistency.py` takes an incident with multiple evidence items and checks for timestamp/location/type consistency. Returns `{is_consistent: bool, inconsistencies: string[]}`. Integrates with deduplication pipeline.

---

## Dev D — DevOps / Full-Stack

### DO-01 | P0 | Git Repository & Branch Setup
**Status:** `[x]`  
**Acceptance:** ✅ Completed — `feature/frontend-dashboard` branch created, initial scaffold committed (commit `555bba0`).

### DO-02 | P0 | Docker Compose Environment
**Status:** `[ ]`  
**Acceptance:** `docker-compose.yml` at project root starts all services: frontend (Next.js dev server), backend API, and PostgreSQL database. `docker-compose up` works from a clean clone. README documents the setup steps.

### DO-03 | P0 | Environment Variable Setup
**Status:** `[x]`  
**Acceptance:** `.env.example` files exist in `frontend/` with all required variable names documented. A setup guide in README explains which variables to populate. No real secrets are in any committed file.

### DO-04 | P1 | Integration Testing — Frontend ↔ Backend
**Status:** `[ ]`  
**Acceptance:** At least one happy-path flow is tested end-to-end with the real backend: citizen submits a report via the frontend form, the backend receives and stores it, and the DDMA dashboard shows it in the review queue. Test result is documented.

### DO-05 | P1 | CI Pipeline (GitHub Actions)
**Status:** `[ ]`  
**Acceptance:** `.github/workflows/ci.yml` runs on push to `feature/frontend-dashboard`: installs deps, runs `npm run lint`, runs `npm run build`. Pipeline status badge in README. Failing builds block merge.

### DO-06 | P1 | Demo Environment Deployment
**Status:** `[ ]`  
**Acceptance:** Application is accessible at a local or public demo URL (e.g., `localhost:3000` via Docker, or Vercel/Railway preview). Frontend and backend are both running and connected. Judges can access without installing anything.

### DO-07 | P1 | Demo Coordination Script
**Status:** `[ ]`  
**Acceptance:** A `DEMO_SCRIPT.md` in `docs/` describes the 4 demo scenarios step-by-step (citizen report, DDMA review, road closure map, relief allocation). Includes speaker notes, what to click, what to say. Rehearsed at least once by the team.

### DO-08 | P2 | Monitoring & Health Dashboard
**Status:** `[ ]`  
**Acceptance:** A simple health check page or endpoint (`/health`) shows: frontend build status, backend connectivity, database connection. Useful for demo stability monitoring.

---

## Task Summary

| Owner | Total | P0 | P1 | P2 | Done |
|---|---|---|---|---|---|
| Dev A (Frontend) | 12 | 5 | 6 | 1 | 12 |
| Dev B (Backend) | 8 | 3 | 4 | 1 | 2 |
| Dev C (Data/AI) | 8 | 3 | 3 | 2 | 0 |
| Dev D (DevOps) | 8 | 3 | 4 | 1 | 2 |
| **Total** | **36** | **14** | **17** | **5** | **16** |

---

*Last updated: Hackathon Day — AAPDA Grid Team*
