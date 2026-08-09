-- Migration: Add architecture intelligence fields to analysis_results table
-- Timestamp: 20260809000000

ALTER TABLE public.analysis_results
    ADD COLUMN IF NOT EXISTS architecture JSONB NOT NULL DEFAULT '{}'::jsonb;
