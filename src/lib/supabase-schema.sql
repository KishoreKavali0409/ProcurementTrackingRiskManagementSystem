// src/lib/supabase-schema.sql
// ============================================================
//  ProcureTrack Enterprise — Supabase Database Schema
//  Run this in your Supabase SQL editor to set up the database
// ============================================================

-- ── Enable UUID extension ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users / Profiles ─────────────────────────────────────
-- This extends Supabase auth.users
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('requester', 'officer', 'manager', 'admin')),
  department  TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Procurement Cases ──────────────────────────────────────
CREATE TABLE public.cases (
  id                TEXT PRIMARY KEY,            -- e.g. PC-2025-001
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  department        TEXT NOT NULL,
  requester         TEXT NOT NULL,
  requester_id      UUID REFERENCES public.profiles(id),
  assigned_to       TEXT NOT NULL,
  assigned_to_id    UUID REFERENCES public.profiles(id),
  priority          TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status            TEXT NOT NULL CHECK (status IN ('Draft', 'Under Review', 'Sourcing', 'Negotiation', 'Approved', 'Closed', 'Cancelled')),
  vendor            TEXT,
  estimated_value   NUMERIC(15, 2) DEFAULT 0,
  approved_budget   NUMERIC(15, 2) DEFAULT 0,
  currency          TEXT DEFAULT 'INR',
  description       TEXT,
  opened_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_closure  DATE,
  last_updated      DATE DEFAULT CURRENT_DATE,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Case Updates / Activity ────────────────────────────────
CREATE TABLE public.case_updates (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  author      TEXT NOT NULL,
  author_id   UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Documents ─────────────────────────────────────────────
CREATE TABLE public.documents (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id       TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL,    -- RFQ, Vendor Quotes, etc.
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,    -- Supabase Storage URL
  uploaded_by   UUID REFERENCES public.profiles(id),
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Risk Flags (computed + manually overridden) ───────────
CREATE TABLE public.risk_flags (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id       TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,    -- Overdue, Stale, Budget Overrun, etc.
  severity      TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'healthy')),
  message       TEXT,
  auto_detected BOOLEAN DEFAULT TRUE,
  resolved      BOOLEAN DEFAULT FALSE,
  resolved_at   TIMESTAMPTZ,
  detected_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Summaries ──────────────────────────────────────────
CREATE TABLE public.ai_summaries (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id       TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  summary_type  TEXT NOT NULL,  -- 'risk_analysis', 'next_actions', 'weekly_report'
  content       TEXT NOT NULL,
  model_used    TEXT DEFAULT 'gemini-1.5-flash',
  generated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id     TEXT REFERENCES public.cases(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,    -- risk_alert, status_change, update_added
  title       TEXT NOT NULL,
  message     TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Case Document Checklist (per-type received status) ────
CREATE TABLE public.document_checklist (
  id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id   TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  doc_type  TEXT NOT NULL,
  received  BOOLEAN DEFAULT FALSE,
  UNIQUE(case_id, doc_type)
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_assigned_to_id ON public.cases(assigned_to_id);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_cases_opened_date ON public.cases(opened_date);
CREATE INDEX idx_case_updates_case_id ON public.case_updates(case_id);
CREATE INDEX idx_risk_flags_case_id ON public.risk_flags(case_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_checklist ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update their own
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cases: all authenticated users can read; officers/managers can write
CREATE POLICY "Authenticated users can view cases" ON public.cases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Officers and managers can insert cases" ON public.cases FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'manager', 'admin')));
CREATE POLICY "Officers and managers can update cases" ON public.cases FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('officer', 'manager', 'admin')));

-- Updates: authenticated users can read; can insert their own
CREATE POLICY "Authenticated users can view updates" ON public.case_updates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert updates" ON public.case_updates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications: users can only see their own
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── Functions ─────────────────────────────────────────────

-- Auto-update 'updated_at' on cases
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate case ID: PC-{YEAR}-{NNN}
CREATE OR REPLACE FUNCTION generate_case_id()
RETURNS TEXT AS $$
DECLARE
  year_str TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_num  INT;
  new_id   TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM public.cases WHERE id LIKE 'PC-' || year_str || '-%';
  new_id := 'PC-' || year_str || '-' || LPAD(seq_num::TEXT, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ── Sample Data Seed ─────────────────────────────────────
-- (Run after creating users in Supabase Auth)
-- INSERT INTO public.cases (id, title, category, ...) VALUES (...);
-- See src/lib/data.ts for sample case data to seed

-- ============================================================
-- SUPABASE SETUP INSTRUCTIONS
-- ============================================================
-- 1. Go to https://supabase.com → New Project
-- 2. Copy project URL and anon key
-- 3. Create .env.local in project root:
--    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- 4. Run: npm install @supabase/supabase-js @supabase/ssr
-- 5. Paste this entire file into Supabase SQL Editor → Run
-- 6. Enable email auth in Supabase Auth settings
-- 7. Create 4 demo user accounts matching DEMO_USERS in login/page.tsx
-- ============================================================
