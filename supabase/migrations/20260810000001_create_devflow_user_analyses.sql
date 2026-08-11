-- Migration: Create devflow_user_analyses table
-- Timestamp: 20260810000001

CREATE TABLE IF NOT EXISTS public.devflow_user_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.devflow_users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    repository_url TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    languages TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_user_analyses_status CHECK (status IN ('queued', 'running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_devflow_user_analyses_user_id ON public.devflow_user_analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_devflow_user_analyses_job_id ON public.devflow_user_analyses (job_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.devflow_user_analyses ENABLE ROW LEVEL SECURITY;
