# Vercel deployment checklist

No Vercel CLI authentication is required. Use the dashboard and import the same Git repository
twice.

## Deployment order

1. Create MongoDB Atlas database and least-privilege application user.
2. Create the API Vercel project.
3. Add API environment variables.
4. Deploy the API.
5. Test health and readiness.
6. Create the frontend Vercel project from the same repository.
7. Add the API URL to the frontend.
8. Deploy the frontend.
9. Add the final frontend domain to API `CORS_ORIGIN`.
10. Redeploy the API.
11. Run the smoke tests.

## Backend dashboard

1. Choose **Add New → Project**, import the Git repository, and set project name
   `three-way-match-api`.
2. Set **Root Directory** to `apps/api`.
3. Enable **Include source files outside of the Root Directory in the Build Step**. This is required
   for the root lockfile/workspace and `packages/shared`.
4. Select **Framework Preset: Express**.
5. Set **Install Command** to `npm install --prefix ../..`.
6. Set **Build Command** to `npm run vercel-build:api --prefix ../..`.
7. Leave **Output Directory** blank.
8. Select **Node.js 22.x**.
9. Add these to Preview and Production as appropriate:

   - `NODE_ENV=production`
   - `MONGODB_URI=<Atlas URI>`
   - `AUTH_TOKEN=<strong demo token>`
   - `GEMINI_API_KEY=<Gemini key>`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `CORS_ORIGIN=https://<initial-frontend-domain>`
   - `MAX_UPLOAD_SIZE_BYTES=4194304`
   - `UPLOAD_DIR=/tmp/three-way-match-uploads`

10. Deploy, then check:

    - `https://<api-project>.vercel.app/api/health`
    - `https://<api-project>.vercel.app/api/ready`
    - `https://<api-project>.vercel.app/api/docs`

The configured 60-second maximum duration comes from `apps/api/vercel.json`. Do not add secrets to
that file.

## Frontend dashboard

1. Import the same Git repository again and name the project `three-way-match-web`.
2. Set **Root Directory** to `apps/web`.
3. Enable **Include source files outside of the Root Directory in the Build Step**.
4. Select **Framework Preset: Next.js**.
5. Set **Install Command** to `npm install --prefix ../..`.
6. Set **Build Command** to `npm run vercel-build:web --prefix ../..`.
7. Leave **Output Directory** blank to use the Next.js default.
8. Select **Node.js 22.x**.
9. Add to Preview and Production:
   `NEXT_PUBLIC_API_BASE_URL=https://<api-project>.vercel.app/api`.
10. Deploy and open `https://<frontend-project>.vercel.app/login`.
11. Copy the final frontend origin into API `CORS_ORIGIN` and redeploy the API. Add exact preview
    frontend origins, comma-separated, only when those previews need API access.

## Smoke tests

- Health is 200; readiness is 200 after Atlas connects.
- Swagger UI CSS and scripts load and Try It Out targets one `/api` prefix.
- Enter the configured bearer token and reach the dashboard.
- List/modify SKU records, then upload a small PO, GRN, and invoice.
- Inspect summary, matched/mismatched detail, history, and manual recomputation.
- Delete a document and verify recalculation feedback and summary refresh.
- Logout and confirm protected screens return to login.

## Troubleshooting

- **Cannot find `@three-way-match/shared`:** confirm both app projects include source outside their
  root and use the exact root-prefix install/build commands.
- **MongoDB connection failure:** verify Atlas URI, user permissions, network access, and
  `/api/ready`; the API never logs the URI.
- **CORS rejection:** add the exact scheme/host of the frontend to comma-separated `CORS_ORIGIN`.
  Do not add paths, trailing wildcards, or `*`.
- **401:** the user-entered token must exactly match API `AUTH_TOKEN`; never expose it as
  `NEXT_PUBLIC_*`.
- **Gemini timeout:** verify key/model, use a smaller/clearer file, and inspect safe function logs.
- **Payload too large:** keep the source below the 4 MiB application limit; multipart overhead also
  counts toward Vercel’s platform limit.
- **Function timeout:** use small demo files. Synchronous parsing is bounded by provider and
  function durations; queues are not part of this project.
- **Duplicate `/api` prefix:** frontend base URL ends in one `/api`; endpoint methods add
  `/summary`, `/documents`, etc. Do not append another `/api`.
- **Temporary directory failure:** set `UPLOAD_DIR=/tmp/three-way-match-uploads`, confirm the API is
  using the Node.js/Express function, and do not point it into the read-only deployment bundle.
- **Swagger assets fail:** remove custom catch-all rewrites. Current Express framework detection
  routes `/api/docs/*` to the single exported app automatically.
