# Three-Way Match Engine

## Project overview

Three-Way Match Engine is a full-stack procurement application that extracts Purchase Orders,
Goods Receipt Notes (GRNs), and invoices with Gemini, resolves their lines through a SKU Master,
and produces deterministic, auditable match results. It addresses the manual effort and error risk
in comparing ordered, received, accepted, and invoiced goods.

## Features

- Static bearer-token login and protected application routes
- PDF and image upload with size, count, MIME, and extension checks
- Gemini parsing followed by strict Zod validation and MongoDB persistence
- SKU catalogue CRUD with normalized, case-insensitive ERP/EAN uniqueness
- ERP-first, EAN-fallback resolution; repeated-line aggregation
- Quantity, price, MRP, date, missing-item, mapping, and duplicate-document rules
- Immutable audit history, manual recomputation, and PO-level summary
- Responsive document, SKU, dashboard, match-detail, and history screens
- Public Swagger, process health, and database readiness endpoints

## Architecture

The npm monorepo contains:

```text
apps/api       Express API, domain services, repositories, models, tests
apps/web       Next.js App Router client
packages/shared  Shared constants and TypeScript API contracts
docs           Architecture, testing, deployment, and demo guidance
sample-documents  Synthetic parsed-data examples
```

The API follows routes → validation/controllers → services → repositories/Mongoose. The web client
uses Axios for transport, TanStack Query for server state, React Hook Form/Zod for forms, and shared
discriminated unions for document responses. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech stack

Node.js 20+, Express, TypeScript, MongoDB/Mongoose, Zod, Multer, Google Gemini SDK, Swagger,
Vitest/Supertest, Next.js App Router, React, Tailwind CSS, TanStack Query, Axios, React Hook Form,
and Docker Compose.

## Matching rules and statuses

Documents associate by normalized PO number. Lines resolve by normalized ERP code, then EAN code.
The engine checks unmapped/conflicting SKUs, missing PO/GRN/invoice items, GRN and invoice
quantities, relative price tolerance (SKU tolerance or 5%), MRP within 0.01, invoice-before-PO
dates, and duplicate PO/GRN/invoice numbers.

- `matched`: all three document classes exist with no errors or incomplete warnings.
- `partially_matched`: document classes are incomplete or warnings exist, with no errors.
- `mismatched`: at least one error-level reason exists.
- `pending`: no PO, or only a PO with no error-level reason.

Domain mismatches are successful HTTP 200 responses. Audit snapshots preserve every computation.

## Document processing flow

The API stores a generated local filename, sends the file inline to the configured Gemini model,
validates JSON, persists the parsed document, then synchronously recomputes the match. Upload stays
successful if recomputation unexpectedly fails and reports `matchRecalculationStatus`. Deletion
also recomputes; it remains successful if that recomputation fails.

## Authentication

This assignment uses one static `AUTH_TOKEN`; it is not a user system. `POST /api/auth/login`
accepts any valid email and non-empty password and returns the configured token.
`GET /api/auth/validate` validates a bearer token without returning it. A frontend 401 clears the
token and protected query cache and redirects once to `/login`.

## Prerequisites and local setup

- Node.js 20 or newer and npm 10 or newer
- Docker Desktop, local MongoDB 7, or MongoDB Atlas
- A Gemini API key for real document parsing

From the repository root (Command Prompt):

```bat
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
npm run docker:up
npm run seed:sku
npm run dev
```

PowerShell:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
# Edit apps/api/.env: set AUTH_TOKEN and GEMINI_API_KEY
npm run docker:up
npm run seed:sku
npm run dev
```

Open `http://localhost:3000/login`. API Swagger is at `http://localhost:4000/api/docs`.

## Environment variables

API (`apps/api/.env`):

| Variable                | Required    | Format/default                                                |
| ----------------------- | ----------- | ------------------------------------------------------------- |
| `NODE_ENV`              | No          | `development`, `test`, or `production`; default `development` |
| `PORT`                  | No          | Positive integer; default `4000`                              |
| `MONGODB_URI`           | Yes         | MongoDB connection URI                                        |
| `AUTH_TOKEN`            | Yes         | Long random string; never commit it                           |
| `GEMINI_API_KEY`        | For uploads | May be empty when upload parsing is unused                    |
| `GEMINI_MODEL`          | No          | Default `gemini-2.5-flash`                                    |
| `CORS_ORIGIN`           | Yes         | Exact web origin, e.g. `http://localhost:3000`                |
| `MAX_UPLOAD_SIZE_BYTES` | No          | Positive integer; default `10485760`                          |
| `UPLOAD_DIR`            | No          | Local directory; default `uploads`                            |

Web (`apps/web/.env.local`): `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.
Legacy API names from early scaffolding are accepted for upgrade compatibility but should not be
used in new environments.

## MongoDB and seed

`npm run docker:up` starts MongoDB 7 on port 27017; `npm run docker:down` stops it while retaining
the named volume. `npm run seed:sku` idempotently inserts or updates five synthetic SKU mappings;
codes remain strings. The API connects before listening and disconnects on SIGINT/SIGTERM.

## Commands

- Development: `npm run dev`, `npm run dev:api`, `npm run dev:web`
- Quality: `npm run typecheck`, `npm run lint`, `npm run format:check`
- Tests: `npm run test:api`, `npm run test:web`, `npm run test`
- Builds: `npm run build`, `npm run build:api`, `npm run build:web`
- Data/services: `npm run seed:sku`, `npm run docker:up`, `npm run docker:down`

## API routes

- Public: `GET /api/health`, `GET /api/ready`, `GET /api/docs`,
  `POST /api/auth/login`
- Auth: `GET /api/auth/validate`
- SKU: `POST|GET /api/masters/sku`, `GET|PATCH|DELETE /api/masters/sku/:id`
- Documents: `POST /api/documents/upload`, `GET /api/documents`,
  `GET|DELETE /api/documents/:id`
- Matches: `GET /api/matches/:poNumber`, `POST /api/matches/:poNumber/recompute`,
  `GET /api/matches/:poNumber/history`, `GET /api/matches/audits/:id`
- Summary: `GET /api/summary`

All routes except the public list require `Authorization: Bearer <AUTH_TOKEN>`.

## Frontend routes

`/login`, `/dashboard`, `/dashboard/[poNumber]`, `/documents`, `/masters`, `/masters/new`, and
`/masters/[id]/edit`. Browser protection is enforced after hydration because the assignment token
is stored in guarded `localStorage`.

## Sample workflow

1. Start MongoDB, seed SKUs, and run both apps.
2. Log in with a valid email/password.
3. Upload a PO, then its GRN and invoice.
4. Open the PO from the dashboard and review status, reasons, lines, totals, and history.
5. Recompute manually or delete a document and observe a new audit snapshot.

`sample-documents/` contains safe parsed JSON examples. The upload endpoint itself accepts PDF,
PNG, JPG/JPEG, and WEBP, not JSON.

## Deployment guide

Recommended topology: Next.js on Vercel or equivalent, the API on a Docker-compatible
Render/Railway/Fly.io-style provider, and MongoDB Atlas. Build the API with
`docker build -f apps/api/Dockerfile .`; inject environment variables at runtime. Configure
`CORS_ORIGIN` to the deployed web origin and `NEXT_PUBLIC_API_BASE_URL` to the public API `/api`.
Use `/api/health` for liveness and `/api/ready` for readiness. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Storage and security notes

Uploads currently use local disk. Many cloud filesystems are ephemeral, so originals can disappear
on restart/redeploy; persisted parsed data, summaries, and audit snapshots remain in MongoDB, but
original-file access does not. Use persistent object storage in a production evolution.

Practical protections include Helmet, configured CORS, strict validation, generated filenames,
upload limits, safe error envelopes, secret redaction, and non-root Docker execution. This is not
enterprise security: the static token is available to browser JavaScript and has no expiry,
rotation, per-user identity, or roles. Never commit environment files or customer documents.

## Known limitations and future improvements

- Static bearer auth; no OAuth, users, roles, or sessions
- Local ephemeral uploads; no object storage
- Synchronous Gemini parsing/recomputation; no queue or progress channel
- Summary listing uses assignment-scale in-memory composition
- No OCR fallback, approvals, notifications, or real-time updates
- Automated browser E2E is not installed; frontend jsdom and API integration tests cover behavior
- Existing dependency audit findings require separately planned upgrades, not blind autofix

Future work can add durable object storage, production authentication, queued parsing, observability,
larger-scale summary aggregation, and browser E2E without changing domain contracts.

## Submission checklist

- [ ] Copy and configure environment files without committing them
- [ ] Run `npm install`, typecheck, lint, both test suites, and full build
- [ ] Start MongoDB and run the idempotent SKU seed
- [ ] Smoke-test login, all three uploads, match/history, summary, delete, and logout
- [ ] Verify Swagger, health, and readiness endpoints
- [ ] Confirm Git contains no secrets, uploads, dependency folders, or generated output
- [ ] Review [docs/DEMO-CHECKLIST.md](docs/DEMO-CHECKLIST.md)
