# DevFlow — Monorepo Foundation

A clean, production-ready full-stack monorepo architecture built with React, Node.js, Express, TypeScript, and Supabase.

## 🏗️ Architecture & Structure

```
├── apps/
│   ├── web/               # React + Vite + TypeScript Frontend Application
│   └── api/               # Node.js + Express + TypeScript Backend API Service
├── packages/
│   └── shared/            # Shared Types, Utilities, & Analysis Job Schema
├── supabase/
│   └── migrations/        # SQL Migrations for Supabase (analysis_jobs & analysis_results)
├── server.ts              # Unified Dev & Production Container Server Gateway (Port 3000)
├── pnpm-workspace.yaml    # pnpm workspace definition (apps/*, packages/*)
├── package.json           # Monorepo Workspaces & Root Scripts
└── .env.example           # Environment variable template
```

## 🔄 Analysis Job Lifecycle

DevFlow tracks repository analysis jobs through the following state pipeline:

```
[queued] ──> (worker claim) ──> [running] ──> (clone + inspect + intelligence) ──> [completed] / [failed]
```

- **`queued`**: Initial job created upon user submission (`POST /api/analysis`).
- **`running`**: Worker picks up the job and executes cloning, metadata collection, intelligence derivation, and persistence.
- **`completed`**: Analysis finished successfully and intelligence result is persisted in Supabase (`analysis_results`).
- **`failed`**: Job encountered an unrecoverable failure during execution.

## 🧠 Repository Intelligence v1

The worker (`apps/api/src/worker.ts`) and intelligence analyzer (`apps/api/src/services/intelligence-analyzer.ts`) extract deterministic, structured insights from cloned repository filesystems without external LLM dependencies:

- **Languages**: Extension frequency mapping ranked with confidence scores (`high` / `medium` / `low`).
- **Frameworks**: Dependency detection from `package.json` and key project configuration markers.
- **Package Manager**: Deterministic detection (`pnpm`, `npm`, `yarn`, `bun`, `cargo`, `pip`, `go modules`, `maven`, `gradle`).
- **Application Type**: Categorization into `monorepo`, `full-stack app`, `backend API`, `frontend app`, `CLI tool`, `library/package`, or `documentation site`.
- **API Surface Hints**: Routing directory detection (`routes/`, `controllers/`, `handlers/`, `api/`) and framework structure analysis.
- **Architecture Hints**: Workspace layout boundaries, decoupled client/server setups, containerization (`Dockerfile`, `docker-compose`), and shared module detection.
- **Summary**: Concise, factual single-sentence summary of the repository.

## 🌐 API Endpoints

- `POST /api/analysis`: Creates a new repository analysis job.
- `GET /api/analysis/:jobId`: Retrieves job status and progress.
- `GET /api/analysis/:jobId/result`: Retrieves computed repository intelligence result for a completed job.

## 🔒 Supabase & Environment Security

- **Backend Privileged Client**: Server-side job operations execute via `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/src/lib/supabase.ts`.
- **Zero Browser Exposure**: The `SUPABASE_SERVICE_ROLE_KEY` exists exclusively in backend environment configurations and is never imported or exposed in client bundles.
- **Row Level Security (RLS)**: Enabled on `analysis_jobs` and `analysis_results` tables. Direct public/anonymous client mutations are disabled.

## 🛠️ Development & Commands

```bash
# Install workspace dependencies with pnpm
pnpm install

# Terminal 1: Start full-stack development server (API + Web on Port 3000)
pnpm run dev

# Terminal 2: Start background analysis worker
pnpm run worker

# Run typecheck across all workspace packages
pnpm run lint

# Run unit tests
pnpm test

# Build production bundle (Web assets + API server bundle)
pnpm run build
```

## 🚀 Production Deployment (Zerops)

DevFlow is fully configured for multi-service production deployment on **Zerops** using `/zerops.yaml`.

### Architecture Flow
```
[Frontend (Static SPA)] ──(HTTP)──> [API Service (Node.js Express)]
                                             │
                                    (Job Polling / Supabase)
                                             │
                                             ▼
                                    [Worker Service (Node.js Background)]
                                             │
                                   ┌─────────┼─────────┐
                                   ▼         ▼         ▼
                               Supabase   FalkorDB   Gemini AI
```

### Zerops Services Overview (`zerops.yaml`)
1. **`frontend` (Zerops Static Service)**:
   - Builds Vite frontend assets (`pnpm build`).
   - Serves the generated `dist/` directory with built-in SPA routing fallback.
2. **`api` (Zerops Node.js Service)**:
   - Runs the Express API server on `process.env.PORT` (binding to `0.0.0.0`).
   - Exposes public API routes and liveness health check at `GET /health`.
   - Secured with CORS via `WEB_ORIGIN`.
3. **`worker` (Zerops Node.js Service)**:
   - Runs `pnpm worker` (`apps/api/src/worker.ts`) as a continuous background job processing loop.
   - Does not expose public HTTP ports or health checks.
   - Requires Supabase service-role credentials and FalkorDB configuration.

### Health Endpoint
- **`GET /health`**: Returns HTTP 200 `{ "ok": true, "service": "devflow-api", "status": "online" }`. Used by Zerops container liveness health checks.

### Required Production Environment Variables
- `NODE_ENV=production`
- `PORT=3000`
- `WEB_ORIGIN=https://<frontend-zerops-domain>`
- `DEVFLOW_RUN_WORKER=false` (for API service instances)
- `SUPABASE_URL=`
- `SUPABASE_SERVICE_ROLE_KEY=`
- `FALKORDB_URL=` / credentials
- `GEMINI_API_KEY=`
- `VITE_API_BASE_URL=https://<api-zerops-domain>` (for frontend build)


