# Three-Way Match Engine

A full-stack procurement operations application for uploading Purchase Orders, Goods Receipt Notes
(GRNs), and invoices; extracting structured data with Gemini; resolving lines through a SKU Master;
and producing deterministic, auditable three-way matches.

## Architecture

- `apps/api`: Express, TypeScript, Mongoose, Zod, Multer, Gemini SDK, Swagger, and Vitest
- `apps/web`: Next.js App Router, Tailwind CSS, TanStack Query, Axios, React Hook Form, and Zod
- `packages/shared`: framework-independent domain constants and API contracts
- `docs`: API notes and representative request/response samples
- MongoDB 7 through Docker Compose

The API follows routes → controllers → services → repositories/models. The web application keeps
authentication, API transport, query state, forms, and presentation concerns separate. Browser
requests use shared domain types and never duplicate authoritative matching logic.

## Completed features

- Static bearer-token authentication with protected application routes
- Gemini-backed PO, GRN, and invoice upload, parsing, validation, and persistence
- Paginated document catalogue with detail and deletion workflows
- SKU Master create, list, edit, delete, normalization, and duplicate protection
- ERP-first and EAN-fallback SKU resolution
- Deterministic line aggregation and three-way matching rules
- Persisted match audit history and manual recomputation
- PO-level dashboard summaries with search, status filtering, sorting, and pagination
- Responsive match-detail UI with totals, document references, reasons, line items, and history
- Swagger/OpenAPI documentation
- Isolated API and frontend automated tests

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop, or an accessible MongoDB 7 deployment
- A Gemini API key for document parsing

## Local setup

From the repository root:

```bat
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
npm run docker:up
npm run seed:sku
npm run dev
```

PowerShell alternatives:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Confirm that `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local` points to the API, including the
`/api` prefix. The supplied frontend example uses `http://localhost:4000/api`; adjust `PORT` and this
URL together if the API runs on a different port.

## Development commands

- `npm run dev`: run API and web together
- `npm run dev:api`: run only the API
- `npm run dev:web`: run only the web application
- `npm run docker:up` / `npm run docker:down`: manage MongoDB
- `npm run seed:sku`: idempotently seed the example SKU catalogue
- `npm run test:api`: run API unit and integration tests
- `npm run test:web`: run frontend tests in jsdom
- `npm run typecheck`: strict TypeScript validation
- `npm run lint`: lint all workspaces
- `npm run build`: production-build shared contracts, API, and web

## Authentication

The browser login accepts the static bearer token configured as `STATIC_AUTH_TOKEN` in the API
environment. It validates the token against a protected API endpoint before storing it locally.
Tokens are attached only as `Authorization: Bearer ...` headers and are never placed in URLs or
logs. A 401 clears authentication and protected query state before returning to `/login`.

The API also exposes `POST /api/auth/login` for programmatic scaffold authentication.

## Document upload flow

1. Select Purchase Order, GRN, or Invoice.
2. Select a PDF, PNG, JPG, JPEG, or WEBP file up to 10 MB.
3. The API stores the file, parses it with Gemini, validates and persists the document.
4. A match audit is recomputed synchronously for the associated PO.
5. The UI refreshes document and summary queries and reports match-recalculation status.

An unexpected matching failure does not remove an otherwise successful upload.

## Matching behavior

Documents associate through normalized PO number. Lines resolve through normalized ERP code first,
then normalized EAN. The engine aggregates repeated lines, retains distinct monetary evidence, and
checks document coverage, quantities, price tolerance, MRP, invoice date, duplicate documents, and
SKU mapping conflicts. Results are persisted as immutable audit snapshots with `matched`,
`partially_matched`, `mismatched`, or `pending` status.

Domain mismatches are valid HTTP 200 results, not transport errors.

## Application routes

- `/login`: static bearer-token login
- `/dashboard`: paginated PO summary
- `/dashboard/[poNumber]`: latest match, recomputation, and audit history
- `/documents`: upload and document catalogue
- `/masters`: SKU Master catalogue
- `/masters/new`: create SKU
- `/masters/[id]/edit`: edit SKU

Swagger is available at `/api/docs` on the configured API origin.

## Environment and security

The API validates environment variables at startup. `GEMINI_API_KEY` may be empty for non-parsing
development, but document parsing then returns a configuration error. Never commit `.env`,
`.env.local`, bearer tokens, API keys, uploaded documents, or generated build output.

## Known limitations

- Authentication is a single static bearer token, not user or role management.
- Files use local disk storage.
- Parsing has no OCR fallback.
- Recalculation is synchronous; there are no background queues or progress percentages.
- There are no approval workflows, notifications, or real-time updates.
- Deployment hardening and production observability are outside the current scope.
