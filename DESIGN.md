# DESIGN.md — AAPDA Grid Visual Design System

## 1. Visual Identity

**Name:** AAPDA Grid  
**Tagline:** From incident to impact to relief.  
**Icon:** Shield (Lucide) in Emerald — represents protection, safety, authority.

---

## 2. Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary (Emerald) | `#10b981` / `emerald-500` | Active states, CTAs, highlights |
| Background | `slate-950` (`#020617`) | App shell |
| Surface | `slate-900` (`#0f172a`) | Cards, panels |
| Border | `slate-800` / `10% white` | Dividers |
| Text Primary | `slate-100` | Headings |
| Text Secondary | `slate-400` | Body, labels |
| Text Muted | `slate-500` | Timestamps, secondary info |
| Critical | `red-400` / `red-500` | Critical incidents, closed roads |
| High | `orange-400` | High severity, partial closures |
| Medium | `yellow-400` | Medium severity |
| Low | `blue-400` | Low severity, info |
| AI / Simulated | `purple-400` | AI recommendations, uncertainty scores |
| Demo Badge | `amber-400` | DEMO / SIMULATED warnings |

---

## 3. Typography

- **Font:** System sans-serif stack (no external font dependency — works offline)
- **Headings:** `font-bold`, sizes `text-2xl` (page titles), `text-lg` (section heads), `text-sm font-semibold` (sub-heads)
- **Body:** `text-sm`, `text-slate-300`
- **Mono:** `font-mono text-xs` for IDs, coordinates, report IDs
- **Labels/Badges:** `text-xs font-semibold uppercase tracking-wide`

---

## 4. Spacing & Layout

- **Page padding:** `p-6` (24px all sides)
- **Card gap:** `gap-4`
- **Section gap:** `space-y-5` / `space-y-6`
- **Border radius:** `rounded-lg` (8px), `rounded-xl` (12px) for cards
- **Sidebar width:** `w-60` expanded, `w-16` collapsed

---

## 5. Navigation

**Sidebar** (`src/components/layout/Sidebar.tsx`):
- Collapsible (desktop) — toggle button on right edge
- Groups: Overview, AAPDA Lens, MargRakshak, RahatGrid
- Active route: emerald left border + emerald text
- Bottom: Demo Role switcher + DEMO/SIMULATED badge
- Mobile: full-width, scrollable (non-collapsing in mobile view)

**Routes:**
| Path | Module | Description |
|---|---|---|
| `/` | Root | Redirects to `/dashboard` |
| `/dashboard` | Overview | Summary cards for all three modules |
| `/dashboard/incidents` | AAPDA Lens | Incident table, review queue, duplicate pair view |
| `/dashboard/incidents/report` | Public Form | Citizen incident report form |
| `/dashboard/roads` | MargRakshak | Leaflet map + road closure sidebar |
| `/dashboard/roads/settlements` | MargRakshak | Settlement access detail list |
| `/dashboard/relief` | RahatGrid | Requests, inventory, allocations, deliveries |

---

## 6. Screen Designs

### Overview Dashboard (`/dashboard`)
- 4 summary cards (Active Incidents, Road Closures, Isolated Settlements, Pending Relief) with DEMO badge
- 3 module cards (AAPDA Lens, MargRakshak, RahatGrid) with live stats
- Recent incidents list (last 3)
- Road alerts list

### AAPDA Lens (`/dashboard/incidents`)
- Tab bar: All Incidents | Review Queue | Duplicate Flags
- Search + status filter
- Table: ID, Title, District, Severity, Status, AI Confidence (DEMO), Dup. Prob. (DEMO), Reported
- Review Queue: Approve/Reject buttons → HumanConfirmModal before action applied
- Duplicate Flags: Side-by-side pair view with AI rationale and "Confirm Duplicate" button

### MargRakshak (`/dashboard/roads`)
- Split layout: Sidebar (road closures + settlements) | Leaflet map
- Map: Road polylines coloured by status, circle markers for settlements
- Overlay panel appears on road selection with alternate route info
- Map legend built into sidebar

### Settlements (`/dashboard/roads/settlements`)
- Grid of settlement cards, split Isolated | Connected
- Each card shows: name, district, population, nearest facility, access roads with status badges

### RahatGrid (`/dashboard/relief`)
- 4 tabs: Requests | Inventory | Allocations | Deliveries
- Requests: status badges, items list, AI suggestion box (DEMO), Approve/Reject buttons → HumanConfirmModal
- Inventory: table with stock bar charts
- Allocations: AI recommendation panel with feasibility score (DEMO), Review & Approve button → HumanConfirmModal
- Deliveries: live status badges (in-transit pulses)

### Public Report Form (`/dashboard/incidents/report`)
- Fields: Name (optional), Location*, Type*, Severity* (radio cards), Description*, Photo (optional)
- Client-side validation, min 20 chars description
- Success screen with generated report ID
- Clear notice: emergencies → call 112, AI only assists

---

## 7. Map Legend

| Colour | Meaning |
|---|---|
| Red polyline | Road fully closed |
| Orange polyline | Road partially open (1 lane) |
| Green polyline | Road open |
| Purple circle (large) | Isolated settlement |
| Grey circle (small) | Connected settlement |

---

## 8. Responsiveness

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 640px) | Sidebar stacks above main; summary cards 2×2 grid; tables scroll horizontally |
| Tablet (640–1023px) | Sidebar fixed left; cards 2-col grid |
| Desktop (≥ 1024px) | Full sidebar + main layout; map split-view active; 3-col module cards |

---

## 9. Accessibility

- All interactive elements have `aria-label` or `aria-current` where appropriate
- Colour is never the sole differentiator — badges include text labels
- Focus ring: `focus-visible:ring-2 focus-visible:ring-emerald-500/50`
- Form fields have `<label>` elements associated
- Tables have `aria-label`
- Modal uses `role="dialog" aria-modal="true"`
- DEMO badge has `role="status"` and `aria-label`

---

## 10. Loading / Error / Offline States

- **Map loading:** Spinner + "Loading map…" placeholder (lazy-loaded client-only)
- **Empty tables:** "No incidents match your filters." centred message
- **Empty deliveries:** Truck icon + "No active deliveries."
- **Error boundary:** Planned post-hackathon (not in MVP)
- **Offline:** Mock adapter requires zero network — works fully offline

---

## 11. Data Labelling Rules

> All synthetic data must be clearly labelled. No exceptions.

- `<DemoBadge />` inline on every column header that shows AI-generated scores
- `<DemoBadge variant="banner" />` at the top of every data-displaying page
- AI recommendation boxes: purple background + "AI Recommendation — Requires Human Review" header
- HumanConfirmModal: shown before any approve/reject/allocate action — cannot be bypassed

---

*Last updated: Hackathon Day — AAPDA Grid Team*
