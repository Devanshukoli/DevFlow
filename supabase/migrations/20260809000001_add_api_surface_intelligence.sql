-- Migration: Add api_surface field to analysis_results table
-- Timestamp: 20260809000001

ALTER TABLE public.analysis_results
    ADD COLUMN IF NOT EXISTS api_surface JSONB NOT NULL DEFAULT '{}'::jsonb;
