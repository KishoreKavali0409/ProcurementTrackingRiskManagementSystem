# ProcureTrack Enterprise — 15-Day Build Plan

## Phase 1 — Foundation (Days 1–3)
- [x] Full project structure setup in Next.js 14 (App Router).
- [x] Develop AppShell with SAP Fiori / Salesforce Lightning aesthetic (navy shell, blue brand).
- [x] Build core UI pages: Dashboard, Case Registry, Detail Views, and Reports.
- [x] Configure global state (Zustand) and mock data logic (`data.ts`).
- [x] Enterprise login page UI and authentication context wrapper.

## Phase 2 — Core Database & Features (Days 4–7)
- [x] Design and execute Supabase PostgreSQL schema with RLS and triggers.
- [x] Replace `localStorage` mock logic with live Supabase client connection for CRUD operations.
- [ ] Implement Document upload capabilities (using Supabase Storage).
- [ ] Build PDF/Print export functionality for stakeholder reports.
- [ ] Implement inline status updates directly from the Case table.

## Phase 3 — AI Integration (Days 8–11)
- [ ] Integrate Gemini API for "Email-to-Case" structured data extraction.
- [ ] Build AI Risk Analyst explanations (explaining why a case is flagged as critical).
- [ ] Create AI automated weekly stakeholder report generator.
- [ ] Implement AI "Next Best Action" recommender for delayed cases.

## Phase 4 — Notifications & Polish (Days 12–13)
- [ ] Configure automated email alerts (via Resend) for critical risks.
- [ ] Set up Slack webhooks for department notifications.
- [ ] Wire up Supabase Realtime channels for live dashboard updates across clients.
- [ ] Finalize mobile responsiveness and cross-browser testing.

## Phase 5 — Deploy & Present (Days 14–15)
- [ ] Production deployment to Vercel/Railway.
- [ ] Seed final demo data for hackathon judges.
- [ ] Polish README documentation with deployment instructions and screenshots.
- [ ] Record final demo walkthrough video.
