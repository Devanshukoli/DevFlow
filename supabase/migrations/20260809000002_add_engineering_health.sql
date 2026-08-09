-- Migration: Add engineering_health field to analysis_results table
-- Timestamp: 20260809000002

ALTER TABLE public.analysis_results
    ADD COLUMN IF NOT EXISTS engineering_health JSONB NOT NULL DEFAULT '{}'::jsonb;
