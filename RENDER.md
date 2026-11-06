# Render Frontend Deployment

This React app is deployed as a Render Static Site, separately from the PHP backend.

## Deploy

1. Connect the `Docuquest-Frontend` GitHub repository to Render and create a Blueprint from `render.yaml`.
2. Set `VITE_API_BASE` to the backend API URL, including `/api`, for example `https://docuquest-backend.onrender.com/api`.
3. Set `VITE_GOOGLE_CLIENT_ID` to the same public Web OAuth client ID configured on the backend. Set `VITE_RECAPTCHA_SITE_KEY` when reCAPTCHA is enabled.
4. After the first deploy, add the frontend's exact HTTPS origin to the backend's `CORS_ALLOWED_ORIGINS` Render variable, for example `https://docuquest-frontend.onrender.com`, then redeploy the backend.
5. Add the frontend HTTPS origin to the Google OAuth client's authorized JavaScript origins. Use the frontend origin, not the backend URL.

The build command uses `npm ci` and `npm run build:render`, which publishes `dist/`. The rewrite in `render.yaml` sends direct navigation and refreshes on app routes to `index.html`.

`VITE_*` values are public build-time configuration and become visible in the downloaded JavaScript. Never put API secrets, OAuth client secrets, passwords, private keys, or tokens in these variables. Backend secrets belong only in the backend Render service.