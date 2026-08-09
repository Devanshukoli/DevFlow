-- Migration: Create analysis_results table
-- Timestamp: 20260808000001

CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL UNIQUE REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    repository_url TEXT NOT NULL,
    file_count INTEGER NOT NULL,
    directory_count INTEGER NOT NULL,
    total_bytes BIGINT NOT NULL,
    extension_counts JSONB NOT NULL,
    detected_files JSONB NOT NULL,
    detected_languages JSONB NOT NULL,
    detected_frameworks JSONB NOT NULL,
    detected_package_manager TEXT,
    detected_app_type TEXT NOT NULL,
    api_surface_hints JSONB NOT NULL,
    architecture_hints JSONB NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Security Policy Note:
-- RLS is enabled on analysis_results. Anonymous/public read and write policies are intentionally NOT created.
-- All database queries for saving and retrieving analysis results are executed server-side via the
-- Supabase Service Role key (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS safely on the backend.
