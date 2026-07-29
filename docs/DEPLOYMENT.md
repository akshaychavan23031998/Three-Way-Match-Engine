# Deployment

## Vercel topology

Deploy the same GitHub repository as two independent projects:

```text
three-way-match-web (Next.js)
        |
        | HTTPS + user-entered static bearer token
        v
three-way-match-api (one Express Vercel Function)
        |-- MongoDB Atlas
        |-- Gemini API
        `-- /tmp/three-way-match-uploads
```

The API remains Express. `apps/api/index.ts` default-exports a serverless Express wrapper and never
calls `listen()`. It lazily connects for database-backed routes. `apps/api/src/server.ts` remains
the local/Docker entry point and connects before listening.

## Workspace settings

Use app roots, not the repository root, so Vercel detects the correct framework. Enable **Include
source files outside of the Root Directory in the Build Step** on both projects; `package-lock.json`,
the root workspace manifest, and `packages/shared` live above each app.

| Setting        | API                                       | Web                                       |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| Project        | `three-way-match-api`                     | `three-way-match-web`                     |
| Root Directory | `apps/api`                                | `apps/web`                                |
| Framework      | Express                                   | Next.js                                   |
| Install        | `npm install --prefix ../..`              | `npm install --prefix ../..`              |
| Build          | `npm run vercel-build:api --prefix ../..` | `npm run vercel-build:web --prefix ../..` |
| Output         | blank                                     | Next.js default (blank)                   |
| Node.js        | 22.x                                      | 22.x                                      |

The API’s `vercel.json` sets a 60-second maximum duration. It contains no routes or rewrites:
current Vercel Express detection preserves `/api/*` paths and serves the application as one
function. Swagger therefore remains `/api/docs`, not `/api/api/docs`.

## Environment variables

API Preview and Production:

```dotenv
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection URI>
AUTH_TOKEN=<long random demo token>
GEMINI_API_KEY=<Gemini API key>
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGIN=https://<frontend-production>.vercel.app
MAX_UPLOAD_SIZE_BYTES=4194304
UPLOAD_DIR=/tmp/three-way-match-uploads
```

`PORT` is not needed by the function, but may remain `4000` for local/Docker parity. Never create a
`NEXT_PUBLIC_` version of the token, Gemini key, or MongoDB URI.

Web Preview and Production:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://<backend-project>.vercel.app/api
```

`CORS_ORIGIN` is an exact comma-separated allow-list. Add each preview frontend URL that should call
the API, separated by commas, then redeploy the API. Unknown browser origins receive 403; curl,
health probes, and server-to-server requests without `Origin` remain allowed. Wildcards are not
used.

## MongoDB and readiness

Use a least-privilege Atlas user and an Atlas network policy appropriate to Vercel’s dynamic
egress. Warm invocations reuse Mongoose’s connection; concurrent cold requests share one promise.
A failed attempt is removed from the cache so a later invocation can retry. Functions do not
disconnect per request.

- `/api/health` checks the process and does not require MongoDB.
- `/api/ready` attempts the lazy connection, then returns 200 when connected or safe 503 otherwise.
- `/api/auth/validate` verifies the bearer token without returning it.

## Upload and function limits

Vercel runtime writes only to `/tmp/three-way-match-uploads`. Files use timestamp plus UUID names
and are deleted after parsing/persistence, parser errors, validation errors, and persistence errors.
Deletion succeeds when the temporary original is already absent.

The frontend and example backend configuration use 4 MiB. The backend remains authoritative and
`MAX_UPLOAD_SIZE_BYTES` is configurable for local/container deployments. Vercel also enforces its
own request payload limit, including multipart overhead. Large files require a future direct
object-storage upload design.

Gemini parsing is synchronous. The function allows up to 60 seconds, while the Gemini client has a
30-second provider timeout. Use small demo documents; large or complex documents can still time
out. Queues and background jobs are intentionally outside this assignment.

## Docker alternative

The existing container deployment remains supported:

```powershell
docker build -f apps/api/Dockerfile -t three-way-match-api .
docker run --rm -p 4000:4000 --env-file apps/api/.env three-way-match-api
```

Docker/local uploads remain in `UPLOAD_DIR` and may be retained. Use persistent object storage
before relying on originals in a production system.

See [VERCEL-CHECKLIST.md](VERCEL-CHECKLIST.md) for exact dashboard order and troubleshooting.
