# DevFlow — Monorepo Foundation

A clean, production-ready full-stack monorepo architecture built with React, Node.js, Express, TypeScript, and Supabase client setup.

## 🏗️ Architecture & Structure

```
├── apps/
│   ├── web/               # React + Vite + TypeScript Frontend Application
│   └── api/               # Node.js + Express + TypeScript Backend API Service
├── packages/
│   └── shared/            # Shared Types, Utilities, & Supabase Configuration
├── server.ts              # Unified Dev & Production Container Server Gateway (Port 3000)
├── package.json           # Monorepo Workspaces & Root Scripts
├── tsconfig.json          # Root TypeScript Configuration
└── .env.example           # Environment variable template
```

## 🚀 Features & Capabilities

- **Workspaces Monorepo**: Managed npm/bun workspace setup pairing `apps/web` and `apps/api`.
- **Frontend App (`apps/web`)**: React 18 SPA powered by Vite, Tailwind CSS, and Lucide Icons.
- **Backend Service (`apps/api`)**: Modular Express API with health check endpoints and router architecture.
- **Supabase Client Setup**: Initialized `@supabase/supabase-js` client with lazy initialization and environment safety guards.
- **Unified Linting**: Type-safe validation across both frontend, backend, and shared modules (`npm run lint`).

## 🛠️ Development & Commands

```bash
# Start full-stack development server (API + Web on Port 3000)
npm run dev

# Run typecheck and linting across all packages
npm run lint

# Build production bundle (Web assets + API server bundle)
npm run build

# Start production build
npm run start
```

## 🔌 Supabase Connection Configured

The Supabase client is configured connection-only in `packages/shared/src/supabase.ts` and exported to both frontend and backend packages:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
