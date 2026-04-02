<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/49efe971-78f3-4ce0-b2be-0ce11e5b52bd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Netlify frontend + backend deploy

### 1) Deploy frontend to Netlify

1. Push this repo to GitHub.
2. In Netlify, create a new site from this repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add env var in Netlify:
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api`

`netlify.toml` is already included for SPA route fallback.

### 2) Deploy backend (Render/Railway/any Node host)

1. Deploy the `server/` project as a Node web service.
2. Install command: `npm install`
3. Start command: `npm start`
4. Copy vars from `server/.env.example` into host env settings.
5. Set `CORS_ORIGIN` to your Netlify domain.

### 3) Verify

1. Open `https://<your-netlify-site>`
2. Check product and auth requests hit `https://<your-backend-domain>/api/...`
3. Confirm backend `/health` returns `200`
