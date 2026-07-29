# Testing

## Automated coverage

- API unit tests cover normalization, aggregation, resolution, match rules, statuses, and helpers.
- API integration tests use Supertest and isolated `mongodb-memory-server` instances for auth, SKU
  CRUD, uploads, matching, audits, summary, deletion, and a complete seeded flow.
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
```

Tests use tiny in-memory upload buffers and remove temporary files. They do not require local
MongoDB, Gemini, or timing sleeps.

## Not covered automatically

Playwright/browser E2E is intentionally not installed, real Gemini accuracy and provider latency
are not asserted, Docker/provider networking is environment-specific, and local disk durability
cannot be guaranteed. Perform the manual QA below before a demo.

## Manual QA

1. Verify `/api/health`, `/api/ready`, and Swagger.
2. Log in, refresh a protected route, log out, and confirm back navigation remains protected.
3. Seed/list/create/edit/delete an SKU while preserving leading-zero codes.
4. Upload one PO, GRN, and invoice; inspect summary, match lines, totals, reasons, and history.
5. Upload a mismatch, manually recompute, then delete it and confirm summary/latest match refresh.
6. Try an unsupported extension, oversized file, invalid form, and invalid token.
7. Check keyboard navigation, modal Escape/focus restoration, narrow layout, loading, empty, and
   error states on all primary routes.
