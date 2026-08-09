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
│   └── migrations/        # SQL Migrations for Supabase (analysis_jobs table)
├── server.ts              # Unified Dev & Production Container Server Gateway (Port 3000)
├── pnpm-workspace.yaml    # pnpm workspace definition (apps/*, packages/*)
├── package.json           # Monorepo Workspaces & Root Scripts
└── .env.example           # Environment variable template
```

## 🔄 Analysis Job Lifecycle

DevFlow tracks repository analysis jobs through the following state pipeline:

```
[queued]  ──>  (future worker)  ──>  [running]  ──>  (future analysis stages)  ──>  [completed] / [failed]
```

- **`queued`**: Initial job created upon user submission (`POST /api/analysis`). *Implemented in Task 4.*
- **`running`**: Worker picks up the job and executes cloning, AST parsing, dependency mapping, and health audit. *(Not implemented yet)*
- **`completed`**: Analysis finished successfully and report dataset is persisted. *(Not implemented yet)*
- **`failed`**: Job encountered an unrecoverable failure during execution. *(Not implemented yet)*

> **Note**: The worker and analysis execution pipeline are intentionally not implemented yet. Task 4 establishes the job foundation, API contracts, Supabase persistence schema, and frontend queue integration.

## 🔒 Supabase & Environment Security

- **Backend Privileged Client**: Server-side job operations execute via `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/src/lib/supabase.ts`.
- **Zero Browser Exposure**: The `SUPABASE_SERVICE_ROLE_KEY` exists exclusively in backend environment configurations and is never imported or exposed in client bundles.
- **Row Level Security (RLS)**: Enabled on the `analysis_jobs` table. Direct public/anonymous client mutations are disabled.

## 🛠️ Development & Commands

```bash
# Install workspace dependencies with pnpm
pnpm install

# Start full-stack development server (API + Web on Port 3000)
pnpm run dev

# Run typecheck across all workspace packages
pnpm run lint

# Run unit tests
npx tsx --test apps/api/src/services/analysis-service.test.ts

# Build production bundle (Web assets + API server bundle)
pnpm run build
```
