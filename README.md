# PULSE // User Analytics & Heatmap Telemetry

A full-stack user behavior analytics application built for the CausalFunnel Full Stack Engineer assignment. It includes a lightweight vanilla JavaScript tracking SDK (`tracker.js`), a Node.js + Express + MongoDB ingestion and query API, a Next.js telemetry dashboard (Sessions & Click Heatmaps), and an instrumented e-commerce demo storefront (`/demo`).

---

## Tech Stack

- **Tracking SDK (`backend/public/tracker.js`):** Zero-dependency vanilla JS (`< 3 KB`), `localStorage` + cookie `session_id` persistence, `navigator.sendBeacon` with `fetch(..., { keepalive: true })` fallback, SPA navigation hooks.
- **Backend (`backend/`):** Node.js, Express, TypeScript, Mongoose, Zod validation.
- **Database:** MongoDB (MongoDB Atlas in production, with an optional `USE_IN_MEMORY_DB=true` local fallback via `mongodb-memory-server` for zero-config evaluation).
- **Frontend (`frontend/`):** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, HTML5 `<canvas>` heatmap rendering.

---

## Setup Steps

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI (or keep USE_IN_MEMORY_DB=true for local testing)
npm install
npm run dev
```
The API starts on `http://localhost:4000` and serves the tracking script at `http://localhost:4000/tracker.js`. On first boot with an empty database, it automatically seeds sample e-commerce sessions so the dashboard is immediately inspectable.

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```
Open `http://localhost:3000`:
- **`/sessions`** — View all tracked sessions, total event counts, and click any session to inspect its chronological user journey with time deltas.
- **`/heatmap`** — Select a tracked page URL and toggle between **Density Heat** (`<canvas>` radial gradient) and **Precision Dots** (exact coordinates + target element tooltip).
- **`/demo`** — Interactive e-commerce storefront (*KINETIC SUPPLY*) instrumented with `<script src="http://localhost:4000/tracker.js">`. Browse, filter, and add items to cart to see live events populate in the dashboard.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/events` | Ingests a single event or batch array (`page_view` or `click`) |
| `GET` | `/api/sessions` | Lists all sessions with total event counts, clicks, and timestamps |
| `GET` | `/api/sessions/:sessionId/events` | Fetches the ordered event timeline for a specific session |
| `GET` | `/api/urls` | Lists distinct tracked page URLs with click counts |
| `GET` | `/api/heatmap?url=...` | Fetches click coordinates and viewport metadata for a URL |

---

## Assumptions & Trade-offs

1. **`sendBeacon` vs. WebSockets:** `tracker.js` uses `navigator.sendBeacon` (with `fetch(..., { keepalive: true })` fallback) so clicks on outbound links or form submits are never dropped on navigation, avoiding the connection overhead of persistent WebSockets.
2. **Coordinate Normalization Across Viewports:** Raw `(x, y)` coordinates alone drift when viewed on different screen sizes. `tracker.js` records `viewport_w` and `viewport_h` alongside `(x, y)` so the heatmap normalizes clicks proportionally onto the preview container.
3. **MongoDB Compound Indexing:** Added `{ session_id: 1, timestamp: 1 }` and `{ url: 1, event_type: 1 }` compound indexes on the `events` collection to keep session journey timelines and heatmap queries fast as event volume grows.
4. **Polling vs. SSE/WebSockets on Dashboard:** The Sessions view uses an optional 5-second poll toggle (`Live Poll`) rather than a WebSocket server, keeping the backend stateless and straightforward to deploy on serverless/container platforms.
