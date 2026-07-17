<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6f2a794d-6277-450f-85c2-c252747e4cb7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Deploy to Vercel (added)

This project is prepared for Vercel deployment. Key notes:

- `vercel.json` routes `/api/*` to the serverless catch-all at `api/[...slug].js`.
- `frontend` is built by `npm --prefix frontend run build` and output goes to `frontend/dist`.
- The GitHub Actions workflow `.github/workflows/deploy-vercel.yml` will build and deploy to Vercel when you push to `main`.

Steps:

1. Push this repository to GitHub.
2. In GitHub repository settings, add repository secrets:
   - `VERCEL_TOKEN` — Vercel personal token
   - `VERCEL_ORG_ID` — Vercel organization id
   - `VERCEL_PROJECT_ID` — Vercel project id
3. Option A: Let Vercel auto-deploy via Git integration (Import repository in Vercel dashboard).
4. Option B: Use CLI: `vercel --prod` from repository root after logging in.

Environment:

- `VITE_API_BASE_URL`: optional build-time override for the API base URL. If empty, client calls `/api`.

Warning: The serverless backend uses temp-file-based persistence — not durable. Migrate to a managed DB for production.

