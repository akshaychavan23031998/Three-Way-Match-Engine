# Three-Way Match Engine

A full-stack procurement reconciliation platform that compares **Purchase Orders, Goods Receipt Notes, and Invoices** to detect quantity, pricing, MRP, SKU, delivery, and document-level discrepancies.

The system extracts structured information from uploaded files using Gemini, resolves items against an SKU Master, computes three-way reconciliation results, stores immutable audit snapshots, and displays everything through a responsive dashboard.

---

## Live Application

| Resource | Live URL |
|---|---|
| Frontend Application | https://three-way-match-engine-web.vercel.app |
| Login | https://three-way-match-engine-web.vercel.app/login |
| Backend API | https://three-way-match-engine-api.vercel.app |
| API Health | https://three-way-match-engine-api.vercel.app/api/health |
| Database Readiness | https://three-way-match-engine-api.vercel.app/api/ready |
| Swagger Documentation | https://three-way-match-engine-api.vercel.app/api/docs/ |
| Developer Portfolio | https://akshay-chavan-portfolio.vercel.app/ |

---

## The Problem

Procurement teams generally work with three related documents:

1. **Purchase Order:** what was ordered.
2. **Goods Receipt Note:** what was delivered and accepted.
3. **Invoice:** what the supplier is requesting payment for.

These documents may contain inconsistencies such as:

- Ordered quantity not fully delivered
- Invoice quantity greater than received quantity
- Invoice rate different from the purchase order
- Price outside the negotiated tolerance
- MRP inconsistency
- Missing PO, GRN, or invoice
- Duplicate documents
- Unknown or conflicting SKU codes
- Rejected goods still included in an invoice

Manually finding these discrepancies is repetitive, slow, and error-prone.

The Three-Way Match Engine automates this process while maintaining a traceable audit history.

---

# System Overview

```mermaid
flowchart LR
    USER[Procurement User]

    WEB[Next.js Web Application]
    API[Express API]
    GEMINI[Gemini Document Parser]
    DB[(MongoDB Atlas)]
    TMP[Vercel Temporary Storage]

    USER -->|Bearer token login| WEB
    WEB -->|HTTPS REST requests| API

    API -->|Temporarily save upload| TMP
    API -->|Document content and prompt| GEMINI
    GEMINI -->|Structured JSON| API

    API -->|Store SKU, documents and audits| DB
    API -->|Delete temporary file| TMP

    API -->|Summary and reconciliation results| WEB
    WEB -->|Dashboard and audit views| USER
```

---

# End-to-End Workflow

```mermaid
flowchart TD
    A[User logs in with bearer token]
    B[Manage or review SKU Master]
    C[Upload PO, GRN or Invoice]
    D[Validate file type and size]
    E[Store file temporarily]
    F[Send document to Gemini]
    G[Validate structured response]
    H[Store parsed document]
    I[Normalize PO number]
    J[Find related documents]
    K[Resolve each SKU]
    L[Aggregate quantities and prices]
    M[Apply matching rules]
    N[Create immutable audit snapshot]
    O[Refresh dashboard summary]
    P[Display match details and reasons]

    A --> B
    B --> C
    C --> D

    D -->|Invalid| Q[Return safe validation error]
    D -->|Valid| E

    E --> F
    F --> G

    G -->|Invalid or provider failure| R[Remove temporary file and return safe error]
    G -->|Valid| H

    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N --> O
    O --> P
```

---

# Why Three-Way Matching?

A two-document comparison is not enough.

Comparing only the PO and invoice confirms what was ordered versus billed, but it cannot prove that the goods were received.

Comparing only the GRN and invoice confirms what was received versus billed, but it does not verify the negotiated PO quantity and price.

The three-way approach connects all three facts:

```text
Purchase Order → Commercial expectation
Goods Receipt  → Physical delivery
Invoice        → Payment request
```

A payment is safer when these three records agree.

---

# Core Matching Model

```mermaid
flowchart LR
    PO[Purchase Order]
    GRN[Goods Receipt Note]
    INV[Invoice]
    SKU[SKU Master]

    ENGINE[Three-Way Match Engine]

    PO -->|Ordered quantity, rate, MRP| ENGINE
    GRN -->|Received, accepted, rejected| ENGINE
    INV -->|Invoiced quantity, rate, MRP| ENGINE
    SKU -->|ERP, EAN, agreed rate, tolerance| ENGINE

    ENGINE --> MATCHED[Matched]
    ENGINE --> PARTIAL[Partially Matched]
    ENGINE --> MISMATCH[Mismatched]
    ENGINE --> PENDING[Pending]
```

---

# Matching Statuses

| Status | Meaning |
|---|---|
| `matched` | All required documents exist and relevant quantities, rates, SKUs, and MRP values agree |
| `partially_matched` | Some values agree, but there is an incomplete delivery or limited discrepancy |
| `mismatched` | Important quantity, price, SKU, MRP, or duplicate-document conflicts exist |
| `pending` | A required document is missing or the reconciliation is not yet complete |

---

# SKU Resolution Strategy

Every line item must first be mapped to a known SKU.

```mermaid
flowchart TD
    ITEM[Parsed document item]
    ERP{ERP code present?}
    ERP_MATCH{ERP match found?}
    EAN{EAN code present?}
    EAN_MATCH{EAN match found?}
    CONFLICT{ERP and EAN resolve to different SKUs?}

    RESOLVED[Resolved SKU]
    UNKNOWN[Unmapped SKU]
    ERROR[SKU conflict reason]

    ITEM --> ERP

    ERP -->|Yes| ERP_MATCH
    ERP -->|No| EAN

    ERP_MATCH -->|No| EAN
    ERP_MATCH -->|Yes| CONFLICT

    EAN -->|Yes| EAN_MATCH
    EAN -->|No| UNKNOWN

    EAN_MATCH -->|No| UNKNOWN
    EAN_MATCH -->|Yes| CONFLICT

    CONFLICT -->|No| RESOLVED
    CONFLICT -->|Yes| ERROR
```

## Why ERP First?

ERP codes are internal business identifiers and are usually the most authoritative reference.

EAN is used as the fallback because:

- Suppliers may provide EAN more consistently than internal ERP codes.
- Scanned documents may omit one identifier.
- Legacy procurement documents may contain only barcode values.

When ERP and EAN point to different SKU records, the engine does not silently choose one. It creates a conflict reason because silently resolving contradictory identifiers could produce a false match.

---

# Quantity Logic

For each resolved SKU, the engine aggregates quantities across related documents.

```text
Ordered quantity  = Sum of PO quantities
Received quantity = Sum of GRN received quantities
Accepted quantity = Sum of GRN accepted quantities
Rejected quantity = Sum of GRN rejected quantities
Invoiced quantity = Sum of invoice quantities
Pending quantity  = Ordered quantity - Received quantity
```

Typical discrepancy examples:

```text
Received < Ordered
→ Pending delivery

Invoiced > Accepted
→ Supplier may be billing for goods not accepted

Invoiced > Received
→ Supplier may be billing for goods not received

Accepted + Rejected != Received
→ GRN internal quantity inconsistency
```

---

# Price Matching Logic

Invoice rates are checked against both the PO rate and SKU Master agreement.

```mermaid
flowchart TD
    PRICE[Invoice price]
    PO_RATE[PO price]
    AGREED[SKU agreed rate]
    TOLERANCE[Configured tolerance]

    PO_DIFF[Compare invoice with PO]
    MASTER_DIFF[Compare invoice with agreed rate]

    OK[Price accepted]
    FAIL[Price mismatch reason]

    PRICE --> PO_DIFF
    PO_RATE --> PO_DIFF

    PRICE --> MASTER_DIFF
    AGREED --> MASTER_DIFF
    TOLERANCE --> MASTER_DIFF

    PO_DIFF -->|Within rule| OK
    PO_DIFF -->|Outside rule| FAIL

    MASTER_DIFF -->|Within tolerance| OK
    MASTER_DIFF -->|Outside tolerance| FAIL
```

## Why Store Tolerance in the SKU Master?

Different products may have different negotiated pricing flexibility.

A global tolerance would be too rigid because:

- Commodity prices may fluctuate.
- Some products have fixed contract pricing.
- Some products allow small rounding or tax-related differences.
- High-value products may require stricter tolerance.

Storing tolerance per SKU keeps the rule close to the commercial agreement.

---

# MRP Validation

The engine compares MRP values when available from:

- SKU Master
- Purchase Order
- Goods Receipt Note
- Invoice

MRP mismatches are recorded independently from price mismatches because MRP and procurement price represent different business concepts.

```text
MRP
→ Maximum retail value printed or declared for the product

Purchase/Invoice rate
→ Commercial amount paid by the organization
```

---

# Document Association

Related documents are grouped using a normalized Purchase Order number.

Normalization prevents formatting variations such as:

```text
PO-1001
po-1001
 PO-1001
```

from being treated as unrelated orders.

The normalized PO number becomes the reconciliation grouping key.

---

# Duplicate Detection

Multiple documents may legitimately exist for one PO, such as partial GRNs or multiple invoices.

Therefore, the system does not automatically classify every repeated document type as invalid.

Instead, duplicate detection considers identifiers and document context.

Potential duplicate conditions are included as explicit audit reasons so users can review them rather than having the system silently discard data.

---

# Audit Architecture

```mermaid
flowchart TD
    EVENT[Recalculation trigger]

    UPLOAD[Document upload]
    DELETE[Document deletion]
    MANUAL[Manual recomputation]

    MATCH[Compute current reconciliation]
    SNAPSHOT[Create immutable Match Audit]
    HISTORY[(Audit History)]
    LATEST[Latest Match View]

    UPLOAD --> EVENT
    DELETE --> EVENT
    MANUAL --> EVENT

    EVENT --> MATCH
    MATCH --> SNAPSHOT
    SNAPSHOT --> HISTORY
    SNAPSHOT --> LATEST
```

Every match calculation creates a new audit snapshot.

Existing snapshots are not overwritten.

This provides:

- Historical traceability
- Before-and-after comparison
- Recalculation history
- Document-deletion impact
- Easier debugging
- Assignment-scale audit compliance

---

# Why Immutable Match Audits?

An alternative would be to maintain only one current match result per PO.

That would be simpler, but it would lose information whenever:

- A new GRN arrives
- An invoice is uploaded
- A document is deleted
- An SKU Master value changes
- A user manually recomputes the match

Persisting immutable snapshots makes the match result explainable over time.

---

# Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js Frontend
    participant API as Express API

    User->>Web: Enter bearer token
    Web->>API: POST /api/auth/login
    API->>API: Compare token with AUTH_TOKEN

    alt Token is valid
        API-->>Web: Login success
        Web->>Web: Store token in browser storage
        Web->>API: GET /api/auth/validate
        API-->>Web: Token valid
        Web-->>User: Open dashboard
    else Token is invalid
        API-->>Web: 401 Unauthorized
        Web-->>User: Show login error
    end
```

## Why Static Bearer Authentication?

The assignment required lightweight authentication rather than a complete user-management system.

Static bearer authentication was selected because it:

- Protects backend routes
- Demonstrates authorization headers
- Supports Swagger authorization
- Avoids unrelated user-registration complexity
- Keeps the focus on document processing and matching

For a production system, this should be replaced with:

- User accounts
- Hashed passwords or SSO
- Refresh/access tokens
- Role-based access control
- Session expiration
- Organization-level authorization

---

# Document Upload Sequence

```mermaid
sequenceDiagram
    participant User
    participant Web as Frontend
    participant API as Express API
    participant Temp as Temporary Storage
    participant Gemini
    participant DB as MongoDB

    User->>Web: Select document and type
    Web->>API: Multipart upload with bearer token

    API->>API: Validate MIME type, extension and size
    API->>Temp: Store generated temporary filename
    API->>Gemini: Send file and document-specific prompt
    Gemini-->>API: Structured JSON

    API->>API: Validate parsed schema
    API->>DB: Persist document
    API->>DB: Load related PO, GRN and invoice data
    API->>DB: Persist match audit
    API->>Temp: Delete temporary file

    API-->>Web: Parsed document and recomputation result
    Web-->>User: Refresh summary and match details
```

---

# Why Gemini Is Used

Procurement documents can vary significantly between suppliers:

- Different layouts
- Different field labels
- Scanned images
- Tabular PDFs
- Mixed ERP and EAN identifiers
- Different date and amount formatting

A fixed regular-expression parser would be fragile across these formats.

Gemini provides a flexible extraction layer that can transform semi-structured files into a validated internal schema.

However, Gemini output is never trusted directly.

The backend applies:

- Safe JSON parsing
- Document-specific schema validation
- Required-field validation
- Numeric validation
- Negative-value rejection
- Empty-item rejection
- Provider timeout handling
- Safe error conversion

---

# Why Validate AI Output?

AI extraction may return:

- Missing fields
- Incorrect field names
- Markdown around JSON
- Invalid JSON
- Negative or unrealistic values
- Empty line-item arrays
- Unexpected text

The AI is treated as an extraction assistant, not as the system of record.

Only validated structured data is persisted.

---

# Technology Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Lucide React
- React Testing Library
- Vitest
- jsdom

## Backend

- Node.js
- Express
- TypeScript
- MongoDB Atlas
- Mongoose
- Google Gemini
- Multer
- Zod
- Helmet
- CORS
- Swagger/OpenAPI
- Vitest
- Supertest
- mongodb-memory-server

## Infrastructure

- npm workspaces
- Vercel
- MongoDB Atlas
- Gemini API
- Vercel `/tmp` storage
- Docker support

---

# Why This Architecture?

## Monorepo

```text
apps/api
apps/web
packages/shared
```

A monorepo was selected because both applications share:

- API response envelopes
- Document types
- Match statuses
- Match-reason structures
- SKU contracts
- Pagination types

### Benefits

- One source of truth for contracts
- Safer frontend/backend changes
- Reduced type duplication
- Easier coordinated testing
- One repository for assignment review

### Alternative

Separate frontend and backend repositories.

### Why It Was Not Selected

Separate repositories would introduce:

- Duplicate types
- Version-management overhead
- More complicated local setup
- Greater risk of API contract drift

For a larger organization with independent teams, separate repositories or versioned shared packages may become appropriate.

---

## Express Backend

Express was selected because it offers:

- Simple middleware composition
- Mature multipart upload support
- Clear REST routing
- Straightforward Swagger integration
- Easy serverless export
- Familiar testing through Supertest

### Alternatives

- NestJS
- Fastify
- Next.js Route Handlers
- Serverless functions per endpoint

### Why Express Fits Here

The application needs a focused REST service with uploads, auth, validation, and matching services. Express provides these without the extra framework structure required by NestJS.

Fastify could provide higher throughput, but raw throughput is not the primary constraint because Gemini processing dominates request duration.

---

## MongoDB

MongoDB was selected because the system stores:

- Different document shapes
- Nested line items
- Match-reason arrays
- Immutable audit snapshots
- Evolving parsed AI output

### Benefits

- Natural storage for nested documents
- Flexible schemas during extraction evolution
- Easy Mongoose validation
- Simple audit-snapshot persistence
- Managed Atlas free tier for the assignment

### Alternative

PostgreSQL with normalized tables.

### When PostgreSQL May Be Better

PostgreSQL would be a strong production alternative when:

- Complex financial reporting is required
- Strict cross-table constraints are critical
- Large analytical joins are common
- Transactions span many entities
- Accounting-grade relational consistency is required

MongoDB fits this assignment because the core data is document-oriented and the main queries are grouped by PO number.

---

## TanStack Query

TanStack Query manages frontend server state.

It handles:

- Loading states
- Error states
- Query caching
- Refetching
- Mutation invalidation
- Summary refresh
- SKU refresh
- Match-detail refresh

### Alternative

Global Redux state or manual `useEffect` requests.

### Why TanStack Query Fits Better

API data is server state, not long-lived client state.

Using Redux for every API response would require extra reducers, actions, and synchronization logic.

TanStack Query keeps remote-data behavior close to the request that owns it.

---

# Serverless Deployment Architecture

```mermaid
flowchart LR
    CLIENT[Browser]

    WEB[Vercel Project: Web]
    API[Vercel Project: API]

    ATLAS[(MongoDB Atlas)]
    GEMINI[Gemini API]
    TEMP[/tmp Upload Directory]

    CLIENT -->|Open application| WEB
    WEB -->|REST requests| API

    API --> ATLAS
    API --> GEMINI
    API --> TEMP
```

The same GitHub repository is deployed as two independent Vercel projects.

| Project | Root Directory | Framework |
|---|---|---|
| `three-way-match-engine-web` | `apps/web` | Next.js |
| `three-way-match-engine-api` | `apps/api` | Express |

---

# Why Separate Frontend and Backend Deployments?

Deploying them separately provides:

- Independent environment variables
- No backend secrets in the frontend
- Independent build configurations
- Clear frontend/API URLs
- Independent redeployments
- A realistic service boundary

An alternative would be to place the API inside Next.js route handlers.

That would reduce deployment setup but would tightly couple the backend to Next.js and reduce the clarity of the Express assignment architecture.

---

# Serverless Database Connection Strategy

Serverless functions may start multiple isolated runtime instances.

Opening a new MongoDB connection for every request would be inefficient.

The API therefore:

- Reuses an existing Mongoose connection
- Caches an in-progress connection promise
- Shares one connection attempt across concurrent cold requests
- Clears failed connection attempts so future calls can retry
- Avoids connecting for database-independent routes

Database-independent routes include:

```text
/api/health
/api/auth/login
/api/auth/validate
/api/docs/
```

Database-backed routes initialize MongoDB lazily.

---

# Temporary File Strategy

Local development uses the configured upload directory.

Vercel uses:

```text
/tmp/three-way-match-uploads
```

Temporary files are removed after:

- Successful parsing
- Parser failure
- Schema validation failure
- Database failure
- Unsupported-file rejection when a file exists

## Why Not Store Files Permanently?

Vercel function storage is ephemeral.

The application only needs the original document during parsing, so temporary storage is enough for the assignment.

### Production Alternative

Use durable object storage such as:

- Amazon S3
- Google Cloud Storage
- Azure Blob Storage
- Cloudflare R2

Object storage would support:

- Permanent file retention
- Signed downloads
- Reprocessing
- Compliance retention
- File-version history

---

# Repository Structure

```text
three-way-match-engine/
├── apps/
│   ├── api/
│   │   ├── index.ts
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── scripts/
│   │   ├── tests/
│   │   ├── uploads/
│   │   └── vercel.json
│   │
│   └── web/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── providers/
│       └── tests/
│
├── packages/
│   └── shared/
│       ├── src/
│       └── dist/
│
├── docs/
├── sample-documents/
├── package.json
└── README.md
```

---

# Backend Layering

```mermaid
flowchart TD
    ROUTES[Routes]
    MIDDLEWARE[Authentication, upload and error middleware]
    CONTROLLERS[Controllers]
    SERVICES[Business services]
    REPOSITORIES[Repositories]
    MODELS[Mongoose models]
    DATABASE[(MongoDB)]

    ROUTES --> MIDDLEWARE
    MIDDLEWARE --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> REPOSITORIES
    REPOSITORIES --> MODELS
    MODELS --> DATABASE
```

## Why Use Layers?

Separating transport, business logic, and persistence makes it easier to:

- Test matching logic without HTTP
- Test controllers without duplicating database logic
- Replace Gemini implementation
- Modify persistence queries
- Keep route files small
- Avoid business logic inside Express handlers

For a very small prototype, all logic could be placed directly in routes. That approach becomes difficult to maintain as matching rules expand.

---

# Frontend Data Flow

```mermaid
flowchart LR
    PAGE[Next.js Page]
    COMPONENT[UI Component]
    HOOK[Query or Mutation Hook]
    CLIENT[Axios API Client]
    API[Express API]
    CACHE[TanStack Query Cache]

    PAGE --> COMPONENT
    COMPONENT --> HOOK
    HOOK --> CLIENT
    CLIENT --> API
    API --> CLIENT
    CLIENT --> HOOK
    HOOK --> CACHE
    CACHE --> COMPONENT
```

---

# Main Features

## Authentication

- Static bearer-token login
- Protected API routes
- Protected frontend routes
- Automatic authorization headers
- Centralized `401` handling
- Logout and cache clearing
- SSR-safe token storage
- Swagger bearer authorization

## SKU Master

- Create SKU
- List SKUs
- View SKU
- Update SKU
- Delete SKU
- Search and filtering
- Sorting and pagination
- ERP and EAN validation
- Agreed rate
- MRP
- Price tolerance
- Duplicate-code protection

## Documents

- Upload Purchase Orders
- Upload Goods Receipt Notes
- Upload Invoices
- List parsed documents
- View document details
- Delete documents
- Temporary-file cleanup
- Automatic match recomputation
- Document-type validation

## Matching

- SKU resolution
- Multi-document aggregation
- Quantity comparison
- Price comparison
- MRP comparison
- Missing-document detection
- Duplicate detection
- Unmapped-SKU detection
- Conflict detection
- Manual recomputation
- Immutable audit history

## Frontend

- Responsive dashboard
- Match-status summary cards
- Search and filters
- URL-backed state
- Paginated tables
- Match-details screen
- Audit-history selection
- Document upload modal
- SKU Master forms
- Loading and error states
- Accessible dialogs
- Logout flow

---

# API Overview

Base URL:

```text
https://three-way-match-engine-api.vercel.app/api
```

## Public Routes

```http
GET  /health
GET  /ready
POST /auth/login
GET  /docs/
```

## Protected Routes

### Authentication

```http
GET /auth/validate
```

### Documents

```http
POST   /documents/upload
GET    /documents
GET    /documents/:id
DELETE /documents/:id
```

### SKU Master

```http
POST   /masters/sku
GET    /masters/sku
GET    /masters/sku/:id
PATCH  /masters/sku/:id
DELETE /masters/sku/:id
```

### Matches

```http
GET  /matches/audits/:id
GET  /matches/:poNumber
POST /matches/:poNumber/recompute
GET  /matches/:poNumber/history
```

### Summary

```http
GET /summary
```

Full schemas and request examples are available through Swagger:

```text
https://three-way-match-engine-api.vercel.app/api/docs/
```

---

# API Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

## Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Readable error message",
    "details": null
  }
}
```

Consistent envelopes make frontend error handling predictable.

---

# Local Setup

## Requirements

- Node.js 22+
- npm
- MongoDB Atlas or local MongoDB
- Gemini API key

## Clone and Install

```bash
git clone https://github.com/akshaychavan23031998/Three-Way-Match-Engine.git
cd Three-Way-Match-Engine
npm ci --include=dev
```

## Backend Environment

Create:

```text
apps/api/.env
```

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@HOST/three-way-match-engine
AUTH_TOKEN=replace-with-a-strong-token
GEMINI_API_KEY=replace-with-your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGIN=http://localhost:3000
MAX_UPLOAD_SIZE_BYTES=4194304
UPLOAD_DIR=apps/api/uploads
```

## Frontend Environment

Create:

```text
apps/web/.env.local
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## Seed SKU Data

```bash
npm run seed:sku
```

The seed operation is idempotent.

## Start Development

```bash
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:3000
API:      http://localhost:4000/api
Swagger:  http://localhost:4000/api/docs/
```

---

# Testing

Run all automated tests:

```bash
npm run test
```

Run API tests:

```bash
npm run test:api
```

Run frontend tests:

```bash
npm run test:web
```

Other quality checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run vercel-build:api
npm run vercel-build:web
npm run verify:shared-runtime
git diff --check
```

Current verified coverage:

```text
API tests:      183 passing
Frontend tests: 18 passing
```

Test coverage includes:

- Authentication
- CORS
- API envelopes
- Serverless loading
- MongoDB connection caching
- Swagger HTML and static assets
- SKU CRUD
- File validation
- Temporary-file cleanup
- Gemini error handling
- Document persistence
- Matching rules
- Match audits
- Full upload-to-match flow
- API client behavior
- Frontend validation
- Query keys
- UI formatters

Some tests intentionally simulate failures, so expected error messages may appear in test output.

---

# Production Deployment

## Backend Vercel Project

```text
Project: three-way-match-engine-api
Root Directory: apps/api
Framework: Express
```

```text
Install Command:
npm ci --include=dev --prefix ../..

Build Command:
npm run vercel-build:api --prefix ../..
```

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas URI>
AUTH_TOKEN=<strong token>
GEMINI_API_KEY=<Gemini API key>
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGIN=http://localhost:3000,https://three-way-match-engine-web.vercel.app
MAX_UPLOAD_SIZE_BYTES=4194304
UPLOAD_DIR=/tmp/three-way-match-uploads
```

## Frontend Vercel Project

```text
Project: three-way-match-engine-web
Root Directory: apps/web
Framework: Next.js
```

```text
Install Command:
npm ci --include=dev --prefix ../..

Build Command:
npm run vercel-build:web --prefix ../..
```

Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://three-way-match-engine-api.vercel.app/api
```

Both projects require access to files outside their selected root because they use the root workspace and `packages/shared`.

---

# Security Decisions

The application includes:

- Environment-based secrets
- No committed `.env` files
- Exact bearer-token validation
- Protected routes
- Helmet security headers
- Swagger-specific Content Security Policy
- Exact-origin CORS
- No wildcard production CORS
- File-size limits
- MIME and extension checks
- Safe generated filenames
- Path-traversal protection
- Temporary-file cleanup
- Safe error responses
- No stack traces in production responses
- No MongoDB or Gemini credentials exposed to the frontend

---

# Limitations and Trade-Offs

## Static Authentication

Good for:

- Assignment review
- Controlled demonstration
- Lightweight API protection

Not enough for:

- Multiple users
- Role permissions
- Token rotation
- Session expiration
- Enterprise identity

## Synchronous Gemini Processing

Good for:

- Immediate feedback
- Simple workflow
- Assignment-scale documents

Limitations:

- Long-running uploads hold the request open
- Provider timeout affects the user request
- Large documents may exceed function duration

Production alternative:

```mermaid
flowchart LR
    UPLOAD[Upload document]
    STORE[Object storage]
    QUEUE[Job queue]
    WORKER[Parsing worker]
    DB[(Database)]
    UI[Frontend polling or websocket]

    UPLOAD --> STORE
    STORE --> QUEUE
    QUEUE --> WORKER
    WORKER --> DB
    DB --> UI
```

## Temporary Upload Storage

Good for:

- Parse-and-discard workflow
- Lower storage complexity
- Serverless assignment deployment

Limitations:

- Originals are not retained
- No download history
- No automatic reprocessing from source files

## Assignment-Scale Summary Queries

The summary is composed in memory using database results.

This is clear and maintainable at the assignment scale.

For large datasets, the system should use:

- Aggregation pipelines
- Materialized summaries
- Background reconciliation
- Indexed reporting collections
- Cursor pagination

---

# Potential Production Evolution

```mermaid
flowchart TD
    CURRENT[Current Assignment Architecture]

    AUTH[SSO and role-based access]
    STORAGE[Durable object storage]
    QUEUE[Background job queue]
    OCR[OCR fallback]
    RULES[Configurable reconciliation rules]
    OBS[Observability and alerting]
    SCALE[Aggregation and reporting layer]
    EVENTS[Event-driven recomputation]

    CURRENT --> AUTH
    CURRENT --> STORAGE
    CURRENT --> QUEUE
    CURRENT --> OCR
    CURRENT --> RULES
    CURRENT --> OBS
    CURRENT --> SCALE
    CURRENT --> EVENTS
```

Recommended future features:

- Multiple users and organizations
- Finance approver roles
- Supplier-level matching policies
- Configurable mismatch tolerances
- Approval workflows
- Object storage
- Background parsing jobs
- OCR fallback
- Email or Slack notifications
- Export to CSV or Excel
- ERP integrations
- Webhooks
- Audit reports
- Automated browser tests
- Rate limiting
- Monitoring and tracing

---

# Design Summary

| Decision | Why It Fits |
|---|---|
| Monorepo | Shared types and coordinated frontend/backend development |
| Express API | Clear REST architecture and middleware support |
| MongoDB | Document-oriented records and nested audit snapshots |
| Gemini parsing | Handles varying procurement-document layouts |
| Strict validation | Prevents unsafe AI output from becoming persistent data |
| TanStack Query | Clean server-state caching and mutation invalidation |
| Immutable audits | Preserves reconciliation history |
| Vercel serverless | Simple deployment for frontend and API |
| `/tmp` uploads | Appropriate for parse-and-discard processing |
| Static bearer token | Meets assignment authentication scope |
| Per-SKU tolerance | Reflects product-specific commercial agreements |

---

# Demo Flow

1. Open the frontend application.
2. Enter the configured bearer token.
3. Review or create SKU Master records.
4. Upload a Purchase Order.
5. Upload a corresponding GRN.
6. Upload a corresponding Invoice.
7. View the summary dashboard.
8. Open the PO reconciliation.
9. Review quantities, prices, MRP, and mismatch reasons.
10. View audit history.
11. Trigger manual recomputation.
12. Delete a document and confirm the match recalculates.
13. Log out.

---

# Sample Scenarios

Synthetic data is available in:

```text
sample-documents/
```

Included scenarios:

- Matching PO
- Matching GRN
- Matching Invoice
- Quantity mismatch
- Price mismatch
- Duplicate documents
- Unmapped SKU

The JSON files document expected extracted structures. Actual application uploads support PDF and image files.

---

# Additional Documentation

```text
docs/ARCHITECTURE.md
docs/TESTING.md
docs/DEPLOYMENT.md
docs/VERCEL-CHECKLIST.md
docs/DEMO-CHECKLIST.md
```

---

# Repository

https://github.com/akshaychavan23031998/Three-Way-Match-Engine

---

# Author

## Akshay Chavan

**Full Stack Engineer · Product Engineer · Backend-minded**

I build production-oriented web applications across frontend systems, backend APIs, data modeling, caching, event-driven architecture, testing, deployment, and operational ownership.

### Portfolio

[https://akshay-chavan-portfolio.vercel.app/](https://akshay-chavan-portfolio.vercel.app/)

Use the portfolio to:

- Explore additional engineering projects
- Review technical case studies
- Understand my experience and skills
- Download my latest resume
- Contact me directly