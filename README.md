# Three-Way Match Engine

A production-oriented monorepo foundation for uploading Purchase Orders, Goods Receipt Notes (GRNs),
and invoices, parsing them with Gemini, resolving lines against a SKU Master, persisting records in
MongoDB, and calculating a three-way match.

This initial version deliberately provides the platform and API contracts—not the finished parsing or
matching rules.

## Architecture and stack

- `apps/api`: Node.js, Express, TypeScript, Mongoose, Zod, Multer, Gemini SDK, Swagger, Vitest
- `apps/web`: Next.js App Router, Tailwind CSS, TanStack Query, Axios, React Hook Form, Zod
- `packages/shared`: framework-independent constants and TypeScript API/domain contracts
- `docs`: API notes, integration artifacts, and representative JSON
- MongoDB 7 via Docker Compose; npm workspaces coordinate packages

The API follows routes → controllers → services → repositories/models. Cross-application contracts
live in the shared package. The frontend uses providers, typed data hooks, and small local UI
components.

## Prerequisites

- Node.js 20 or newer and npm 10 or newer
- Docker Desktop (recommended) or a MongoDB 7 instance

## Local setup

From the repository root in Command Prompt:

```bat
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
npm run docker:up
npm run dev
```

PowerShell environment-file equivalents:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

The web app is at `http://localhost:3000`, API at `http://localhost:5000`, Swagger at
`http://localhost:5000/api/docs`, and MongoDB at `mongodb://localhost:27017`.

## Environment

The API validates its environment with Zod and fails with a readable startup error for missing
required values. `GEMINI_API_KEY` may be blank during scaffolding; parsing then returns
`gemini_not_configured`. Never commit real `.env` files.

## Scripts

- `npm run dev` / `dev:api` / `dev:web`: run both or one development server
- `npm run build`: build shared contracts, API, and web
- `npm run typecheck`, `npm run lint`: static checks
- `npm run test` / `test:api`: API tests
- `npm run format` / `format:check`: Prettier
- `npm run docker:up` / `docker:down`: MongoDB lifecycle
- `npm run seed:sku`: SKU seed entry point

## API and authentication

Public routes:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/docs`

Login accepts any valid non-empty email and password and returns `STATIC_AUTH_TOKEN`. Other routes
require `Authorization: Bearer <STATIC_AUTH_TOKEN>`.

Protected routes cover document upload/list/detail/file, match and summary lookup by PO number, and
SKU Master create/list/detail/update/delete. Placeholder endpoints always return a valid response
envelope while their persistence workflows are developed.

## Status and planned phases

Implemented: workspace/configuration, validated environment, Mongo connection and schemas, upload
guardrails, auth foundation, Swagger, API error handling, typed frontend client/query foundation,
login, dashboard shell, SKU screens, Docker MongoDB, samples, and baseline tests.

Planned:

1. Persist uploads and add document retrieval.
2. Implement Gemini structured extraction and validation.
3. Resolve document lines against the SKU Master.
4. Implement and test matching rules and audit steps.
5. Connect dashboard detail/preview/match workflows.
6. Add operational security, observability, and deployment configuration.

The assignment explicitly treats `invoice_date_after_po_date` as a mismatch. This is unusual in
standard procurement workflows, where invoices commonly occur after a PO; it is retained as a stated
domain rule for the sample and future implementation.
