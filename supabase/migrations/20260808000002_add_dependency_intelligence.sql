-- Migration: Add dependency intelligence fields to analysis_results table
-- Timestamp: 20260808000002

ALTER TABLE public.analysis_results
    ADD COLUMN IF NOT EXISTS dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS dependency_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS production_dependency_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS development_dependency_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS optional_dependency_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS peer_dependency_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dependency_manifests JSONB NOT NULL DEFAULT '[]'::jsonb;
