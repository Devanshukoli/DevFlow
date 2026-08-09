-- Migration: Create analysis_jobs table
-- Timestamp: 20260808000000

CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0,
    current_stage TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_analysis_jobs_status CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    CONSTRAINT chk_analysis_jobs_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Security Policy Note:
-- RLS is enabled on analysis_jobs. Anonymous/public read and write policies are intentionally NOT created.
-- All database queries for creating and fetching analysis jobs are executed server-side via the
-- Supabase Service Role key (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS safely on the backend.
