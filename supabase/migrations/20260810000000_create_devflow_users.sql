-- Migration: Create devflow_users table
-- Timestamp: 20260810000000

CREATE TABLE IF NOT EXISTS public.devflow_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on lowercase email for fast authentication lookups
CREATE INDEX IF NOT EXISTS idx_devflow_users_email ON public.devflow_users (LOWER(email));

-- Enable Row Level Security (RLS)
ALTER TABLE public.devflow_users ENABLE ROW LEVEL SECURITY;

-- Security Policy Note:
-- RLS is enabled on devflow_users. All server-side auth operations (sign-up, sign-in, user verification)
-- execute via the Supabase Service Role key (SUPABASE_SERVICE_ROLE_KEY) on the backend API proxy.
