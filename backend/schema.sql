-- Supabase Schema Initialization for ProcureTrack Enterprise
-- Run this in your Supabase SQL Editor to create the missing tables

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    category TEXT,
    city TEXT,
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cases Table (If not already created)
CREATE TABLE IF NOT EXISTS public.cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    vendor TEXT,
    category TEXT,
    estimated_value NUMERIC,
    approved_budget NUMERIC,
    status TEXT,
    priority TEXT,
    department TEXT,
    requester TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_closure TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updates JSONB DEFAULT '[]'::jsonb
);

-- 3. Case Suppliers Relation (Many-to-Many via JSONB or explicit table)
CREATE TABLE IF NOT EXISTS public.case_suppliers (
    case_id TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, supplier_id)
);

-- 4. Quotations Table
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    unit_price NUMERIC DEFAULT 0.0,
    total_price NUMERIC DEFAULT 0.0,
    delivery_days INTEGER DEFAULT 0,
    payment_terms TEXT,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Setup Row Level Security (RLS) policies to allow public access (for demo)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON public.suppliers FOR ALL USING (true);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON public.cases FOR ALL USING (true);

ALTER TABLE public.case_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON public.case_suppliers FOR ALL USING (true);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON public.quotations FOR ALL USING (true);
