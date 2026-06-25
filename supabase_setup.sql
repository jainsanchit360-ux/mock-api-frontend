-- ==========================================================
-- QuickMock API - Supabase Setup Script
-- Run this in your Supabase project's SQL Editor
-- ==========================================================

-- 1. Create the mock_endpoints table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.mock_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    json_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.mock_endpoints ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow anon insert" ON public.mock_endpoints;
DROP POLICY IF EXISTS "Allow anon select" ON public.mock_endpoints;

-- 4. Allow anyone (anon) to INSERT new mock endpoints
CREATE POLICY "Allow anon insert"
ON public.mock_endpoints
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Allow anyone (anon) to SELECT mock endpoints (for retrieval)
CREATE POLICY "Allow anon select"
ON public.mock_endpoints
FOR SELECT
TO anon
USING (true);
