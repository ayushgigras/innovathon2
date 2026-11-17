# AAPDA Grid — Disaster Intelligence Platform

> **From Incident to Impact to Relief**  
> AI-assisted disaster intelligence, mountain-road accessibility, and relief coordination for high-risk mountainous regions such as Jammu and Kashmir.

---

## 📌 Product Overview

AAPDA Grid is an operational command-and-control platform designed for District Disaster Management Authorities (DDMAs), emergency response teams, road maintenance crews, and humanitarian relief partners operating in rugged terrains.

### Core Modules

1. **AAPDA Lens (Incident Intelligence)**
   - Corroboration & duplicate report detection across citizen submissions and field reports
   - Multi-factor consistency checks (time window, geospatial proximity, semantic matching)
   - AI uncertainty scoring and quality indicators (`DEMO / SIMULATED`)
   - Human-in-the-loop verification queue with mandatory confirmation modals

2. **MargRakshak (Mountain Road & Route Sentinel)**
   - Interactive OpenStreetMap and Leaflet visualization of critical mountain corridors (e.g., NH-44, Mughal Road)
   - Real-time road status: Closed, Partially Open, or Open
   - AI-assisted alternate route recommendations
   - Automated detection and tracking of disconnected/isolated settlements

3. **RahatGrid (Last-Mile Relief Orchestration)**
   - Prioritized relief requests scored by population density, days cut off, and vulnerability
   - Warehouse stock visibility across food, water, medicine, shelter, and cold-weather supplies
   - AI-generated allocation suggestions with feasibility rationale
   - Strict human approval gate before any relief allocation or dispatch
   - In-transit delivery tracking

4. **Public Incident Reporting**
   - Accessible citizen report interface for rapid field damage reporting
   - Structured data capture: incident type, severity rating, location description, photo upload UI
   - Immediate reference tracking ID generation
   - Safety disclaimers directing urgent emergencies to emergency services (112)

---

## 🛡️ Core Operating Principles

- **AI Assists — Humans Decide:** The AI system only scores, highlights, and recommends. It never automatically verifies incidents, issues public evacuation warnings, or authorizes relief dispatches.
- **Truthful Data Provenance:** All simulated and synthetic datasets feature prominent `DEMO` or `SIMULATED` markers across cards, metrics, and tables.
- **Resilient & Offline-Ready:** Packaged with an independent Mock API adapter matching the typed backend contract 1:1, allowing seamless local evaluation with zero external dependencies.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create `.env.local` inside `frontend/`:
```env
NEXT_PUBLIC_API_BASE_URL=mock
```
Setting `NEXT_PUBLIC_API_BASE_URL=mock` enables the built-in offline mock adapter.

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The root path automatically redirects to `/dashboard`.

### 4. Production Build & Linting
```bash
npm run lint
npm run build
```

---

## 📂 Project Architecture

```
innovathon2/
├── docs/
│   ├── API_CONTRACT.md        # Comprehensive HTTP REST schemas, endpoints & enums
│   ├── DATABASE_SCHEMA.md     # Relational & PostGIS PostgreSQL schema definitions
│   └── INTEGRATION_GUIDE.md   # System architecture, deployment & integration steps
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/   # App Router control room routes
│   │   │   │   ├── dashboard/ # Overview, Incidents, Roads, Relief
│   │   │   ├── globals.css    # Tailwind CSS 4 setup & dark theme tokens
│   │   │   └── layout.tsx     # Global HTML shell and providers
│   │   ├── components/
│   │   │   ├── layout/        # Persistent navigation sidebar & drawer
│   │   │   ├── map/           # Dynamic Leaflet/OSM map components
│   │   │   ├── shared/        # Badges, HumanConfirmModal, alerts
│   │   │   └── ui/            # Buttons, primitives, interactive controls
│   │   ├── lib/
│   │   │   ├── api/           # API client and mock adapter
│   │   │   └── utils.ts       # Class merging & UI utilities
│   │   └── types/             # Strict TypeScript domain interfaces
├── COMPLETED_AND_REMAINING.md # Project milestone progress tracking
├── DESIGN.md                  # Design system, palette, typography & UX specifications
├── PLAN.md                    # Hackathon sprint architecture & milestones
├── RULES.md                   # Team development & safety governance rules
└── TASKS.md                   # Work breakdown structure and acceptance criteria
```

---

## 🧪 Demo Scenarios

1. **Citizen Submission:** Navigate to `/dashboard/incidents/report` or `/report` to submit an incident with location, severity, and photo UI.
2. **AAPDA Lens Verification:** Navigate to `/dashboard/incidents`, view the Review Queue and Duplicate Flags, inspect the AI confidence breakdown, and confirm or reject via the Human Review modal.
3. **MargRakshak Navigation:** Access `/dashboard/roads` to explore road segment closures, inspect alternate route recommendations, and check isolated settlements in the side panel or `/dashboard/roads/settlements`.
4. **RahatGrid Relief Allocation:** Go to `/dashboard/relief`, check inventory stock, review pending allocations with AI feasibility rationale, and approve with required human sign-off.
