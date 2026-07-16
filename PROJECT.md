# Project: ProcureTrack Enterprise Rebuild

## Architecture
- **Frontend**: Next.js 14 + Tailwind CSS + Zustand store (existing, in `src/`)
- **Backend**: FastAPI (Python) — NEW, in `backend/`
- **Database**: Supabase PostgreSQL (schema in `src/lib/supabase-schema.sql`)
- **State Management**: Zustand store (`src/lib/store.ts`) — currently calls Supabase directly, must be refactored to call FastAPI

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend + Schema | R1 (FastAPI) + R4 (DB schema update) | none | PLANNED |
| 2 | Frontend Features | R2 (10-stage pipeline) + R3 (suppliers/quotations) + R5 (refactoring) | none | PLANNED |
| 3 | Integration & Build | Connect frontend to backend, ensure npm run build passes | M1, M2 | PLANNED |

## Interface Contracts
### Frontend Store ↔ FastAPI Backend
- `GET /api/health` → `{ status: "ok" }`
- `GET /api/cases` → `ProcurementCase[]`
- `POST /api/cases` → create case, return created case
- `PUT /api/cases/{id}` → update case
- `DELETE /api/cases/{id}` → delete case
- `GET /api/suppliers` → `Supplier[]`
- `POST /api/suppliers` → create supplier
- `PUT /api/suppliers/{id}` → update supplier
- `DELETE /api/suppliers/{id}` → delete supplier
- `POST /api/quotations` → create quotation
- `GET /api/cases/{id}/quotations` → `Quotation[]`
- `POST /api/cases/{id}/advance` → advance case to next stage (logs activity)
- `GET /api/cases/{id}/suppliers` → get bidders for a case
- `POST /api/cases/{id}/suppliers` → assign bidders to a case

### 10-Stage Pipeline Values
```
'RFQ Draft' | 'Bidders Defined' | 'RFQ Shared' | 'Offers Received' | 
'Technical Evaluation' | 'Commercial Negotiation' | 'Approval Pending' | 
'PO Released' | 'Legal / NDA' | 'GRN / Closed'
```

### Supplier Type
```typescript
interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  rating: number; // 1-5
  created_at: string;
}
```

### Quotation Type
```typescript
interface Quotation {
  id: string;
  case_id: string;
  supplier_id: string;
  supplier_name?: string;
  unit_price: number;
  total_price: number;
  delivery_days: number;
  payment_terms: string;
  notes: string;
  submitted_at: string;
}
```

## Code Layout
### Existing Frontend (`src/`)
- `src/app/` — Next.js App Router pages
- `src/components/` — React components (layout, cases, ui)
- `src/lib/` — utilities (store.ts, data.ts, supabaseClient.ts, auth.ts, export.ts)

### New Backend (`backend/`)
- `backend/app/main.py` — FastAPI app entry
- `backend/app/routers/` — route modules (cases.py, suppliers.py, quotations.py, health.py)
- `backend/app/services/` — business logic
- `backend/app/schemas/` — Pydantic models
- `backend/app/db.py` — database connection
- `backend/requirements.txt` — Python dependencies

### New/Modified Frontend Files
- `src/lib/data.ts` — update CaseStatus type to 10 stages
- `src/lib/store.ts` — refactor to call FastAPI (with Supabase fallback)
- `src/components/ui/Badge.tsx` — add 10-stage status mappings
- `src/components/layout/AppShell.tsx` — add Suppliers nav item
- `src/app/cases/[id]/page.tsx` — 10-stage progress bar, quotations tab
- `src/components/cases/CaseFormModal.tsx` — 10-stage dropdown, bidder selection
- `src/app/suppliers/page.tsx` — NEW suppliers page
- `src/app/cases/page.tsx` — update status tabs for 10 stages
- `src/lib/supabase-schema.sql` — add suppliers, case_suppliers, quotations tables

## Verification
```bash
cd "d:\imobiliothon 6.0\procuretrack-enterprise"
npm run build
```
Must complete with zero errors.
