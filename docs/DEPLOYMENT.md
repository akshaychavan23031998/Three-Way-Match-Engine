# Deployment

## Recommended topology

- MongoDB Atlas or another managed MongoDB service
- API on a Docker-compatible Node host
- Next.js web on Vercel or equivalent

## Database and API

Create a least-privilege MongoDB user, restrict network access, and provide its URI as a runtime
secret. Build from the repository root:

```powershell
docker build -f apps/api/Dockerfile -t three-way-match-api .
docker run --rm -p 4000:4000 --env-file apps/api/.env three-way-match-api
```

Set `NODE_ENV=production`, `PORT=4000`, `MONGODB_URI`, a long random `AUTH_TOKEN`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, the exact HTTPS `CORS_ORIGIN`, `MAX_UPLOAD_SIZE_BYTES`, and a
writable `UPLOAD_DIR`. Do not bake `.env` into the image.

Use `GET /api/health` for process liveness and `GET /api/ready` for MongoDB readiness. Both are
public and contain no secrets. Run the seed once against the target database if sample SKUs are
wanted; it is idempotent.

## Web

Deploy `apps/web` with the monorepo root available for `packages/shared`. Set
`NEXT_PUBLIC_API_BASE_URL=https://your-api.example/api` at build time. Set API `CORS_ORIGIN` to the
exact deployed web origin and smoke-test preflight, login, refresh, and 401 behavior.

## Upload storage limitation

The API writes originals to local disk. Most managed containers use ephemeral filesystems, so files
may disappear after restart, replacement, or redeploy. MongoDB retains parsed documents, matches,
summaries, and audit history, but original-file access then fails. Mount persistent storage for a
small deployment or replace local storage with object storage before relying on original files.

## Smoke test

Confirm health/ready, Swagger, login, SKU list, all three uploads, a matched and mismatched result,
history/recompute, deletion refresh, summary counts, logout, and server logs without secrets.
