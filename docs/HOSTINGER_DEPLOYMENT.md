# KalaSearch — Hostinger / Node VPS Deployment Guide

> **Shared hosting / cPanel (including Hostinger shared and typical Iranian
> cPanel plans):** production is **PHP 8.1 + MySQL**. Follow
> [`CPANEL_PHP_DEPLOYMENT.md`](./CPANEL_PHP_DEPLOYMENT.md). Do **not** start
> Node, PM2, or `npm run start` on those plans. `/admin` authenticates against
> the PHP API (`POST /api/admin/login`).
>
> **This file is only for a Node.js VPS or Hostinger “Node.js Web App”** that
> you intentionally choose. The Node backend stays in the repo for local
> development (`npm run dev` / `npm run start`) and for that optional VPS path.

KalaSearch is a **React + Vite frontend with a real Node.js backend** (`server/index.mjs`) on this optional path.
The production server serves the built SPA from `dist/` **and** the `/api/*` endpoints
(orders, admin auth, health). It does **not** depend on `vite preview` or any Vite
process at runtime.

```
browser ──► https://mydomain.com ──► reverse proxy (Hostinger/nginx)
                                        │
                                        ▼
                              node server/index.mjs   (PORT, 0.0.0.0)
                              ├── /            → dist/index.html (SPA, + history fallback)
                              ├── /product/:id → dist/index.html (SPA fallback)
                              └── /api/*       → order/admin/health handlers
                                                 └── data file at ORDER_STORE_PATH
```

---

## 1. Required Hostinger plan / type

Two supported options (pick one):

| Option | Plan | When to choose it |
|---|---|---|
| **A. Managed “Node.js Web App”** | Business Web Hosting or any Cloud plan (Node.js Web Apps feature) | Cheapest, panel-managed (Git deploy, env vars UI, dashboard restart). Good enough if you accept panel-managed storage. |
| **B. VPS (recommended for a live shop)** | Any KVM VPS (e.g. Ubuntu 22.04/24.04, 2 GB+) | Full control of the process (PM2), a **predictable persistent data path**, Nginx + Certbot, cron backups. Recommended because KalaSearch stores real customer orders. |

> Static/shared hosting alone is **not enough** — the app needs a running Node
> process for `/api/*`.

## 2. Required Node.js version

- The app requires **Node.js ≥ 18.17** (tested on 20/22; Hostinger supports 18/20/22/24).
- Recommended: **Node 20 LTS or 22 LTS**.
- Managed Node.js Web Apps: select Node 20 or 22 in the app setup/build settings.
- VPS: install once with nvm or the NodeSource repo (see §VPS below).

## 3. Uploading the project

**Option A (managed Node.js Web App):**
1. hPanel → **Websites** → **Add Website** → **Deploy Web App**.
2. Choose **Import Git Repository** (GitHub) or **Upload your website files** (zip of the repo root — **excluding** `node_modules`, `dist`, `.env`, `data/`).
3. When the framework picker appears, choose **“Other”** and set:
   - Build command: `npm ci && npm run build`
   - Output directory: `dist`
   - Entry file: `server/index.mjs`
   - Node version: 20 or 22
4. Deploy. Hostinger places backend build files under
   `/home/{user}/domains/{domain}/nodejs` and auto-creates `.htaccess` routing
   in `public_html` — do not delete that `.htaccess`.

**Option B (VPS):** see the VPS section below (`git clone`/scp + PM2).

## 4. Installing dependencies

Local sanity check (and VPS):

```bash
npm ci          # clean install from package-lock.json
```

## 5–8. Creating `.env` and the admin credentials

The backend reads admin settings **only** from environment variables — never from
frontend code. Create `.env` in the project root (it is git-ignored):

```bash
# server/.env  (project root, never committed)
PORT=3000
HOST=0.0.0.0
ORDER_STORE_PATH=/home/{user}/kala-search-data/orders.json   # see §9

ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_password
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)   # or paste a long random string

VITE_DATA_PROVIDER_MODE=local-csv
VITE_API_BASE_URL=          # keep empty → same-origin /api calls
VITE_PUBLIC_SITE_URL=https://mydomain.com
```

> The full `.env.example` template (same keys) is at the bottom of this file.
> The sandbox that produced this repo cannot write `.env`-prefixed files, so if
> `.env.example` in your checkout is the old short version, replace its contents
> with the template at the bottom.

**Managed Node.js Web App alternative:** hPanel → app Dashboard →
**Environment Variables** → paste the same `KEY=value` lines (or upload your
`.env`). Variables added there are **not** stored in the repository. After
changing env vars, **redeploy** so the new build picks them up.

Rules (enforced by the app):
- `ADMIN_*` keys are backend-only. **Never** prefix them with `VITE_`.
- Keep `VITE_API_BASE_URL` empty so the frontend calls `https://mydomain.com/api/...`
  on the same origin (works automatically behind the domain/proxy; no localhost,
  no port hardcoding anywhere in the frontend).
- The boot log prints `admin configured: true/false` — confirm it says `true`.

## 9. Persistent order storage directory (critical)

Orders are stored in one JSON file (`read`/`write` per request, atomic tmp+rename).

- Default location (dev): `<project>/data/orders.json`.
- **Production must point `ORDER_STORE_PATH` at a directory that survives
  deployments/restarts** — never rely on a file inside `dist/` (it is rebuilt and
  wiped on every deploy).

Recommended production layout:

```bash
# Managed Node.js Web App (create with File Manager or SSH — sibling of the
# nodejs deploy dir, so app deployments never touch it):
mkdir -p /home/{user}/kala-search-data
chmod 700 /home/{user}/kala-search-data
# ORDER_STORE_PATH=/home/{user}/kala-search-data/orders.json

# VPS:
sudo mkdir -p /var/lib/kala-search
sudo chown -R $USER:www-data /var/lib/kala-search   # app user + group
chmod 750 /var/lib/kala-search
# ORDER_STORE_PATH=/var/lib/kala-search/orders.json
```

Sanity check after first start: the boot log prints
`order store: /…/orders.json`; place one test order and confirm the file exists.

## 10. Running `npm install`

```bash
npm ci          # deterministic; uses package-lock.json
```

## 11. Running the production build

```bash
npm run build   # vite build → dist/ (frontend + SPA shell)
```

## 12. Starting the Node.js app

Always start through the app entry (never `vite preview`):

```bash
npm run start            # == node server/index.mjs
```

**Managed Node.js Web App:** the panel runs your entry file automatically after
deploy (entry file `server/index.mjs`). Use the dashboard **Restart** button to
restart the process without redeploying.

**VPS:** run under PM2 so it survives reboots and crashes:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # follow the printed command
pm2 logs kala-search   # verify boot lines
```

The included `ecosystem.config.cjs` already sets `NODE_ENV=production`, restarts
on crash, and caps memory. Secrets are **not** in that file — the app loads
`.env` itself.

## 13. Connecting the custom domain

- **Managed Node.js Web App:** add the domain in hPanel (or point an existing
  domain’s **A record** to the hosting IP) and attach it to the app’s website.
  hPanel issues the SSL automatically.
- **VPS:** in your DNS provider point `mydomain.com` (and `www`) with **A records**
  to the VPS IP, then add an nginx `server_name mydomain.com www.mydomain.com;`
  block (template below in the VPS section).

## 14. Configuring PORT

- The server reads `PORT` (default **3000**) and binds `HOST` (default
  `0.0.0.0` — required behind a reverse proxy).
- Managed Node.js Web App: the platform normally injects/proxies the port — the
  default of 3000 plus `HOST=0.0.0.0` covers the common case.
- VPS with nginx: `PORT=3000`, nginx `proxy_pass http://127.0.0.1:3000;`.
- VPS with PM2 and no `.env` `PORT`: export it before `pm2 start`, or set
  `PORT` in the `.env` file (the app merges `.env` at startup).

## 15. HTTPS / SSL

- Managed Node.js Web App: enable **Free SSL** (Let’s Encrypt) in hPanel for the
  domain — automatic.
- VPS: `sudo certbot --nginx -d mydomain.com -d www.mydomain.com` (or use
  Cloudflare proxy in front). The app itself is plain HTTP **behind** the proxy;
  never terminate TLS directly in the Node process unless you add certs yourself.
- The admin session is a signed bearer token sent over HTTPS via the
  `Authorization` header (no cookies), so no cookie/secure-flag configuration is
  needed — just keep HTTPS on.

## 16. Restarting the app

```bash
# VPS (PM2)
pm2 restart kala-search
# or after code changes:
pm2 reload kala-search

# Managed Node.js Web App
# hPanel dashboard → Restart (no rebuild). Full redeploy rebuilds too.
```

Verify after every restart:

```bash
curl -s https://mydomain.com/api/health     # → {"ok":true}
```

## 17. Updating later without losing orders

The key rule: **`ORDER_STORE_PATH` points outside the deploy directory**, so a
deploy only ever replaces code.

1. `git pull` (or re-upload / panel redeploy).
2. `npm ci`
3. `npm run build`
4. `pm2 restart kala-search` (VPS) or dashboard **Redeploy** (managed).
5. `curl https://mydomain.com/api/health` and open the Admin Orders page —
   previous orders must still be listed (they are read from `ORDER_STORE_PATH`,
   which the deploy never touches).

Never store runtime data inside `dist/`, and never commit `data/orders.json`,
`.env`, `node_modules`, or `dist` (the repo’s `.gitignore` already excludes them).

## 18. Backup strategy for order data

Back up **only the orders file** (plus your `.env`):

```bash
# one-shot
cp /var/lib/kala-search/orders.json /var/lib/kala-search/backups/orders-$(date +%F).json

# nightly cron (VPS) — /etc/cron.d/kala-backup
0 2 * * *  root  mkdir -p /var/lib/kala-search/backups && \
                 cp /var/lib/kala-search/orders.json /var/lib/kala-search/backups/orders-$(date +\%F-\%H\%M).json && \
                 find /var/lib/kala-search/backups -name 'orders-*.json' -mtime +30 -delete
```

For managed Node.js Web App: download `orders.json` via File Manager regularly,
or enable hPanel website backups (verify the backup includes your data path —
the default website backup may only cover `public_html`/`nodejs`).

Restore = copy a backup over `ORDER_STORE_PATH` and restart the app.

## VPS quick reference (Option B)

```bash
# 1. Node 20/22 on Ubuntu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs npm

# 2. project
cd /var/www && git clone https://github.com/karenkhoshro-spec/KKKKALASEARCH.git kala-search
cd kala-search
npm ci && npm run build

# 3. env + data dir (sections 5–9)
cp .env.example .env && nano .env
sudo mkdir -p /var/lib/kala-search && sudo chown -R $USER:www-data /var/lib/kala-search

# 4. PM2
npm i -g pm2
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup

# 5. nginx reverse proxy (/etc/nginx/sites-available/kala-search)
server {
    listen 80;
    server_name mydomain.com www.mydomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
sudo ln -s /etc/nginx/sites-available/kala-search /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. HTTPS
sudo certbot --nginx -d mydomain.com -d www.mydomain.com
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `dist/index.html not found. Run npm run build first.` | Start script ran before a build. Run `npm run build`, then restart. |
| `admin configured: false` in boot log | `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` missing in the app environment. Env vars changed in the panel require a **redeploy**. |
| `/api/health` works but the site shows the old frontend | Browser cache — index.html is served `no-cache`; hard-refresh once. |
| Blank page on a deep link (e.g. `/product/1100312`) | Only if a **static-only** server is used. The Node server handles SPA fallback; do not serve `dist/` from nginx directly. |
| Orders disappear after redeploy | `ORDER_STORE_PATH` pointed inside the deploy dir (e.g. `./data`). Move the file out (§9), restart, verify with `/api/health` + Admin Orders. |
| `pm2 start` boots but port busy | Another process on 3000. Change `PORT` in `.env`/export, restart PM2. |
| HTTP 502 from nginx | Node process down — `pm2 logs kala-search`, `pm2 restart`. |
| Admin login says “not configured” (503) | Same as `admin configured: false` above. |
| 403 after managed redeploy | Hostinger regenerated `.htaccess`; do not delete it; redeploy once. |

## Known production limitations (by design, documented honestly)

- **Customer order lookup is phone-number-gated only.** There is no SMS/OTP or
  password auth for customers: anyone who knows a customer’s phone number can
  call `GET /api/orders?phone=…` / `GET /api/customer/orders?phone=…` and view
  that customer’s orders. The current checkout + account model matches the
  existing app and was intentionally not redesigned. **Before handling real
  customers, add real customer authentication (SMS OTP / password) behind the
  customer endpoints.**
- Admin credentials, `ADMIN_SESSION_SECRET`, and all order data stay server-side;
  nothing secret is exposed through `VITE_*` variables.
- PDF files are generated **in the browser** (jsPDF) from the order JSON served
  by `/api/admin/orders`; there is no server-side PDF endpoint and none is needed
  for the current UX.

---

## `.env.example` (full template)

```bash
# =====================================================================
# KalaSearch environment template (copy to `.env` — never commit `.env`)
# =====================================================================

# --- Server -----------------------------------------------------------
PORT=3000
HOST=0.0.0.0

# Absolute path to the persistent orders file (survives deployments).
# Example: /home/u123456789/kala-search-data/orders.json
ORDER_STORE_PATH=

# --- Admin (backend-only — NEVER prefix with VITE_) -------------------
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

# --- Public frontend configuration (safe to prefix with VITE_) --------
VITE_API_BASE_URL=
VITE_PUBLIC_SITE_URL=
VITE_DATA_PROVIDER_MODE=local-csv
```
