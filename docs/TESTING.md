# Testing

## Automated coverage

- API unit tests cover normalization, aggregation, resolution, match rules, statuses, and helpers.
- API integration tests use Supertest and isolated `mongodb-memory-server` instances for auth, SKU
  CRUD, uploads, matching, audits, summary, deletion, and a complete seeded flow.
- Serverless tests cover handler import/no-listen behavior, lazy connection failure, cached
  connections, `/tmp` selection and cleanup, CORS/preflight, health/readiness/auth, Swagger assets,
  and single-prefix routing without calling Vercel APIs.
- Gemini is mocked at the parser boundary; automated tests never call the provider.
- Frontend Vitest/jsdom tests cover API envelopes/401 behavior, auth flow, formatting, and key UI
  interactions.

```powershell
npm run typecheck
npm run lint
npm run test:api
npm run test:web
npm run test
npm run build
npm run vercel-build:api
npm run vercel-build:web
```

Tests use tiny in-memory upload buffers and remove temporary files. They do not require local
MongoDB, Gemini, or timing sleeps.

## Not covered automatically

Playwright/browser E2E is intentionally not installed, real Gemini accuracy and provider latency
are not asserted, and Vercel/Atlas networking and platform limits are not reproduced locally.
Tests invoke the serverless Express wrapper directly but do not authenticate or deploy with the
Vercel CLI. Perform the manual QA below after dashboard deployment.

## Manual QA

1. Verify `/api/health`, `/api/ready`, and Swagger.
2. Log in, refresh a protected route, log out, and confirm back navigation remains protected.
3. Seed/list/create/edit/delete an SKU while preserving leading-zero codes.
4. Upload one PO, GRN, and invoice; inspect summary, match lines, totals, reasons, and history.
5. Upload a mismatch, manually recompute, then delete it and confirm summary/latest match refresh.
6. Try an unsupported extension, oversized file, invalid form, and invalid token.
7. Check keyboard navigation, modal Escape/focus restoration, narrow layout, loading, empty, and
   error states on all primary routes.
