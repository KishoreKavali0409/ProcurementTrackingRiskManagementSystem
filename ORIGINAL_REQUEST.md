# Original User Request

## Initial Request — 2026-07-16T19:31:51+05:30

Rebuild and complete the ProcureTrack Enterprise web application to accurately model a real-world General Purchase Process for procurement. The existing codebase is a Next.js 14 + Tailwind CSS frontend with a Supabase PostgreSQL database. The task is to: (1) add a Python FastAPI backend as the intelligence/business-logic layer, (2) refactor the frontend to call FastAPI instead of Supabase directly, (3) update the procurement pipeline to match the real 10-stage process flow, (4) add supplier registry and quotation comparison features, and (5) ensure the entire system works end-to-end with the database. This is for a hackathon demo (Imobiliothon 6.0).

Working directory: d:\imobiliothon 6.0\procuretrack-enterprise
Integrity mode: development

## Context: Existing Codebase

The project already has a working Next.js 14 App Router frontend in `src/` with:
- SAP Fiori / Salesforce Lightning-style dark sidebar UI (AppShell component)
- Pages: Dashboard (`/`), Cases (`/cases`), Case Detail (`/cases/[id]`), Risk Monitor (`/risk`), Reports (`/reports`), Login (`/login`)
- Zustand state store in `src/lib/store.ts` currently calling Supabase directly
- Tailwind config with enterprise color tokens in `tailwind.config.ts`
- Supabase schema SQL in `src/lib/supabase-schema.sql`
- Risk engine in `src/lib/data.ts` (computeRisks function)
- The app compiles and builds successfully (`npm run build` passes)

## Requirements

### R1. Python FastAPI Backend

Create a FastAPI backend in a `backend/` directory at the project root. It must:
- Connect to the same Supabase PostgreSQL database using `supabase-py` or `asyncpg`
- Expose REST API endpoints for all case CRUD, supplier CRUD, quotation CRUD, and risk computation
- Use Pydantic models for request/response validation
- Structure: `backend/app/main.py`, `backend/app/routers/`, `backend/app/services/`, `backend/app/schemas/`, `backend/app/db.py`
- Include a `backend/requirements.txt` with all Python dependencies
- The backend must be runnable with `uvicorn app.main:app --reload` from the `backend/` directory
- Include a health check endpoint at `GET /api/health`

### R2. Domain-Accurate 10-Stage Procurement Pipeline

Replace the current simplified status flow with the real procurement process. The case status options must be, in order:
1. RFQ Draft
2. Bidders Defined
3. RFQ Shared
4. Offers Received
5. Technical Evaluation
6. Commercial Negotiation
7. Approval Pending
8. PO Released
9. Legal / NDA
10. GRN / Closed

Each stage transition must be logged in the case activity timeline. The UI must show a visual step-progress indicator on the case detail page showing which stage the case is at.

### R3. Supplier Registry & Quotation Comparison

- A **Suppliers** page (`/suppliers`) where users can add and view suppliers. Supplier fields: name, email, phone, category specialization, city/location, rating (1-5 stars).
- When creating or editing a case, users can select 2+ suppliers as bidders from the registry.
- Each bidder can have a quotation entry: unit price, total price, delivery timeline, payment terms, and notes.
- A **Quotation Comparison** tab/section on the case detail page showing all bids side-by-side in a table, with the lowest-price bid highlighted in green.
- Add a Suppliers nav item to the sidebar in the AppShell component.

### R4. Updated Supabase Database Schema

Update `src/lib/supabase-schema.sql` to include:
- `suppliers` table (id, name, email, phone, category, city, rating, created_at)
- `case_suppliers` junction table (case_id, supplier_id) for many-to-many bidder assignments
- `quotations` table (id, case_id, supplier_id, unit_price, total_price, delivery_days, payment_terms, notes, submitted_at)
- Update the `cases` table status CHECK constraint to use the new 10-stage values
- Add a `budget_category` column to cases: 'standard' (<50K EUR) or 'high_value' (>=50K EUR)

### R5. Frontend Refactoring

- Update `src/lib/store.ts` to call FastAPI endpoints (e.g., `GET /api/cases`, `POST /api/cases`, etc.) instead of calling Supabase directly
- Add the Suppliers page and Quotation Comparison components
- Update the case detail page with the visual stage-progress indicator
- Update all status badges, filters, and dropdowns to use the new 10-stage status values
- Show a budget category badge on cases: "Standard Procurement" (blue) for <50K EUR, "High Value" (orange) for >=50K EUR
- Keep the existing SAP/Salesforce enterprise dark-sidebar aesthetic

## Acceptance Criteria

### Backend
- [ ] `backend/` directory exists with a working FastAPI application
- [ ] Running `pip install -r backend/requirements.txt` and `cd backend && uvicorn app.main:app --reload` starts the server
- [ ] `GET /api/health` returns a 200 response
- [ ] `GET /api/cases` returns cases from the database
- [ ] `POST /api/cases` creates a new case in the database
- [ ] `PUT /api/cases/{id}` updates a case
- [ ] `DELETE /api/cases/{id}` deletes a case
- [ ] `GET /api/suppliers` returns suppliers
- [ ] `POST /api/suppliers` creates a supplier
- [ ] `POST /api/quotations` creates a quotation for a case+supplier
- [ ] `GET /api/cases/{id}/quotations` returns all quotations for a case

### Pipeline & Workflow
- [ ] Case status dropdown/selector shows exactly the 10 stages defined in R2
- [ ] Case detail page displays a horizontal step-progress bar showing the current stage
- [ ] Advancing a case to the next stage creates an activity log entry

### Suppliers & Quotations
- [ ] `/suppliers` page renders with a table of suppliers and an "Add Supplier" form/modal
- [ ] Supplier entries include name, email, phone, category, city, and a star rating display
- [ ] Case creation/edit form allows selecting multiple suppliers as bidders
- [ ] Case detail page has a "Quotations" tab showing a comparison table
- [ ] Lowest price quotation row is visually highlighted

### Database
- [ ] `src/lib/supabase-schema.sql` contains CREATE TABLE statements for `suppliers`, `case_suppliers`, and `quotations`
- [ ] Cases table status CHECK constraint uses the new 10-stage values

### Build & UI
- [ ] `npm run build` completes with zero errors
- [ ] All pages render with the enterprise dark-sidebar layout (no broken/unstyled pages)
- [ ] Navigation sidebar includes a "Suppliers" link

### Verification commands
```bash
cd "d:\imobiliothon 6.0\procuretrack-enterprise"
npm run build
```
