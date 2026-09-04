# KalaSearch — cPanel / PHP / MySQL Deployment Guide

**This is the production path for shared hosting / cPanel.**

Production shared hosting uses **PHP 8.1+ and MySQL**. Node.js
(`server/index.mjs`, `npm run start`, PM2) is **only** for local development
and for an optional VPS that you deliberately choose. Do **not** start Node
on cPanel. `/admin` talks to `POST /api/admin/login` on the PHP API.

Production path for **standard Iranian cPanel shared hosting** (PHP 8.1+ and
MySQL/MariaDB — **no Node.js, no VPS, no PM2, no Docker, no nginx** required).

```
Browser
  ↓
Static React/Vite build in public_html/
  ↓
/api PHP endpoints (public_html/api/)
  ↓
MySQL database (orders, order_items, admin_sessions)
```

The existing Node.js server (`server/index.mjs`, `npm run start`) stays in the
repository **for local development and the Freebuff preview only**. On cPanel
the **PHP/MySQL backend is the production path**; Node.js is never started
there.

The API contract is byte-for-byte compatible with the Node API, so the React
frontend requires **no code changes** — it already calls relative `/api/...`.

---

## 1. Required hosting

- Any **cPanel shared hosting** plan that provides:
  - **PHP 8.1 or newer** (PHP 8.2/8.3 recommended)
  - **MySQL 5.7+ or MariaDB 10.4+**
  - phpMyAdmin (standard on cPanel)
- No SSH, no Node.js, no Composer, no extra software required.
- This works even on the cheapest shared plans; everything runs through Apache
  `.htaccess` + PHP-FPM.

## 2. Local build requirements (your computer, not the server)

- Node.js **18.17+** (only to build the frontend once)
- npm or Bun

## 3. Build the frontend locally

```bash
npm ci
npm run build
```

Output: `dist/` — pure static files (`index.html`, `assets/`, `images/`).

## 4. Create the MySQL database in cPanel

1. cPanel → **MySQL® Databases**
2. Under *Create New Database*, enter e.g. `kalasearch`, click **Create Database**.
   The real name will be prefixed, e.g. `karenk_kalasearch`.
3. **Create Database User** (e.g. `kalasearch` → `karenk_kalasearch`), pick a
   strong password, **Create User**.
4. **Add User To Database**, grant **ALL PRIVILEGES**, **Make Changes**.

## 5. Import the schema

1. cPanel → **phpMyAdmin** → select your database (left sidebar).
2. **Import** tab → **Choose File** → `database/schema.sql` → **Go**.
3. Verify these tables exist: `orders`, `order_items`, `admin_sessions`,
   `admin_credentials` (the last one is empty until you change the password
   in `/admin`; it is created by `schema.sql`).

Or via SSH on a VPS (not needed for cPanel):

```bash
mysql -u karenk_kalasearch -p karenk_kalasearch < database/schema.sql
```

## 6. Copy the built site into public_html/

Upload the **contents of `dist/`** (not the folder itself) so that:

```
public_html/
  index.html
  assets/...
  images/...
```

Use cPanel **File Manager** (Upload) or FTP. If an old site exists, clear
`public_html/` first (back up anything you need).

## 7. Copy the PHP API into public_html/api/

Upload the **contents of `php-api/`** into a new `public_html/api/` folder,
**excluding** the template and tests:

```
public_html/api/
  index.php
  lib/            (config.php, db.php, util.php, auth.php, orders.php, bootstrap.php)
  .htaccess
```

Do **not** upload `config.example.php`, `migrate-json-to-mysql.php`, or
`tests/` — they are not needed at runtime (harmless if present, but keep the
deployment clean).

*Optional:* if you migrate historical JSON orders that lack image snapshots,
also upload a copy of the image mapping so the server can fill missing images:

```bash
cp src/data/productImages.json php-api/images-mapping.json   # then upload as public_html/api/images-mapping.json
```

## 8. Create the config file (OUTSIDE public_html)

Copy `php-api/config.example.php` to a **non-public location**, e.g.:

```
/home/karenk/kalasearch-config.php        (i.e. public_html/../kalasearch-config.php)
```

The API auto-detects it at: `one level above public_html → kalasearch-config.php`.
Fill in:

```php
return [
  'db_host'              => '127.0.0.1',        // or 'localhost'
  'db_name'              => 'karenk_kalasearch',
  'db_user'              => 'karenk_kalasearch',
  'db_password'          => 'STRONG_DB_PASSWORD',
  // Bootstrap username — not compiled into the React app. Case-sensitive.
  'admin_username'       => 'admin',
  'admin_password_hash'  => '$2y$10$...',       // ← generate below; NEVER a raw password
  'admin_password'       => '',                 // leave empty once hash is set
  'admin_session_secret' => 'LONG_RANDOM_STRING_AT_LEAST_32_CHARS',
  'session_ttl_days'     => 7,
];
```

**Generate the admin hash** (run locally; paste the output into the config):

```bash
php -r "echo password_hash('YOUR_ADMIN_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
```

> **Migration from the old plaintext `ADMIN_PASSWORD`:** if you leave
> `admin_password_hash` empty and set `admin_password` instead, login still
> works (legacy mode). Set the hash and clear the plaintext as soon as
> possible — the plaintext fallback exists only for the transition.

**Environment variables** (some hosts let you set them via cPanel → *MultiPHP
INI Editor*, `php.ini`, or `SetEnv` in `.htaccess`): `DB_HOST`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. Env vars **override** the config
file. Never put any of these in the frontend or in `VITE_` variables.

**Fallback if the host blocks files above public_html:** place the config at
`public_html/api/config.local.php` — `api/.htaccess` blocks direct web access
to `config*.php`, but this is the **least safe** option; use the outside
location whenever possible.

## 9. Add the .htaccess files

1. Upload `deploy/.htaccess` as `public_html/.htaccess` (SPA routing + API
   passthrough + real 404s for missing assets).
2. `public_html/api/.htaccess` is uploaded in step 7 (routes `/api/*` to the
   PHP front controller, restores the `Authorization` header, blocks internal
   files).

## 10. Configure the domain

- cPanel → **Domains** → point `mydomain.com` (and `www`) at
  `public_html/` (default document root — nothing to change unless you used a
  subfolder; then select it).
- DNS: add an `A` record for the domain pointing to your account's IP (shown
  in cPanel). If your domain's nameservers are with another registrar, update
  the `A`/`CNAME` there.

## 11. Enable SSL (HTTPS)

- cPanel → **SSL/TLS Status** → **Run AutoSSL** (free Let's Encrypt). All
  requests should be `https://mydomain.com`.
- Add a redirect so HTTP → HTTPS (cPanel → *Domains* → *Force HTTPS
  Redirect*).

## 12. Permissions

- Directories: `755`
- Files: `644`
- `public_html/api/index.php` and `public_html/api/lib/*.php`: `644`
- The config file outside public_html: `600` (or at least `644` — it is never
  web-accessible there).
- **Never** `777`.

## 13. Test the deployment

Open the site and verify:

```text
GET  /api/health              → 200 {"ok":true}
POST /api/orders              → checkout creates an order (201)
POST /api/admin/login         → 200 {"token":"..."}   (wrong password → 401)
GET  /api/admin/orders        → 401 without Bearer token
GET  /api/admin/orders        → 200 with token, order list + images
PATCH /api/admin/orders/<n>/status → status persists in MySQL
GET  /api/customer/orders?phone=… → customer sees only their orders
GET  /product/<id>            → refresh a React route → SPA loads (not 404)
GET  /assets/<missing>.js     → real 404 (not index.html)
```

## 14. Updating the app later (without losing orders)

Orders live in **MySQL**, never in the uploaded files — redeploys cannot lose
them.

1. Build locally: `npm ci && npm run build`.
2. Replace `public_html/index.html`, `public_html/assets/`, `public_html/images/`.
3. If API code changed, replace `public_html/api/` **but keep** the config
   file (it lives outside public_html anyway).
4. Never touch the database during an update.

## 15. Backup strategy

- **Database (critical):** cPanel → **Backup Wizard** → download a full backup
  weekly, or use phpMyAdmin → Export → `orders`, `order_items`,
  `admin_sessions` (SQL). Restore via phpMyAdmin → Import.
- **Files:** a full account backup from cPanel covers `public_html/` + the
  config outside it.

## 16. Optional: migrate existing JSON orders to MySQL

If you have orders in the local `data/orders.json` (development-era data) and
want them in production MySQL:

```bash
# locally (requires MySQL access/credentials in config):
php php-api/migrate-json-to-mysql.php data/orders.json
```

Idempotent: existing order numbers are skipped, so re-running is safe.
Optional — a clean deployment can start with zero orders.

## 17. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `401 unauthorized` from admin API after login | Apache stripped the `Authorization` header — `api/.htaccess` `SetEnvIf` must be present; if your host overrides it, ask them to allow `Authorization` to PHP, or use cPanel → *MultiPHP* settings. |
| `500 server_error` on every API call | DB config missing/wrong, or `lib/` missing. Check the site's PHP error log (`error_log` in the account). The API never prints internals to the browser. |
| `503 admin_not_configured` on login | `admin_username`, `admin_password_hash` (or `admin_password`), and `admin_session_secret` are not all set in the config/env. |
| `Unknown database` / `Access denied` | DB name/user/password in config must exactly match the cPanel-prefixed values (`karenk_kalasearch` etc.). |
| React route 404s on refresh | `public_html/.htaccess` missing or `RewriteEngine` off. |
| Persian text garbled | Tables must be `utf8mb4` (schema.sql already is); re-import if an older charset was used. |
| Checkout works, admin sees no orders | Checkout hit the old Node server (dev) instead of the PHP API — in production only `public_html` is deployed, so `/api/*` goes to PHP. |
| Missing product images in admin | New orders snapshot the image URL. Historical orders: upload `images-mapping.json` (step 7, optional). |

## 18. Known limitations (documented honestly)

- **Customer order lookup is by phone number only.** There is no SMS/OTP
  verification, so anyone who knows a customer's phone can look up that
  customer's orders at `GET /api/customer/orders?phone=…`. This matches the
  existing product behavior; it is **not** secure authentication. A real
  OTP/SMS service (e.g. Kavenegar / Twilio) should be added before treating
  the account area as secure — that is a separate project.
- The order totals are computed server-side, but **prices come from the
  client cart** (the catalog is client-side CSV). Authentic per-item pricing
  would need the price catalog served server-side.
- The admin session token lives in `sessionStorage` (per tab) and expires
  after 7 days; logout revokes it server-side.
- PDF files are generated **client-side** in the browser (existing behavior) —
  the PHP backend only stores the order snapshot and returns `document`
  metadata.

## 19. `/admin` login — exact cPanel checklist

`/admin` is a **React page**. Logging in calls **PHP**. If the page loads but
login fails, the SPA is fine and the API/config is not.

### Required folder structure

```
/home/USERNAME/
  kalasearch-config.php          ← REQUIRED. Outside public_html. Mode 600.
  public_html/
    .htaccess                    ← copy of deploy/.htaccess
    index.html                   ← Vite build
    assets/  (if the build emits them)
    images/
    orderx-logo.png
    api/                         ← contents of php-api/ (not the folder name php-api)
      .htaccess
      index.php
      lib/
        bootstrap.php
        config.php
        db.php
        util.php
        auth.php
        orders.php
```

Do **not** upload `php-api/config.example.php` as the live config, and do
**not** put `kalasearch-config.php` inside `public_html`.

### Where the username and password live

| Item | Where it is set | Where it must NEVER be |
|---|---|---|
| Admin username | `admin_username` in `kalasearch-config.php` (or env `ADMIN_USERNAME`) | React, `src/`, `public/`, `VITE_*`, GitHub |
| Admin password | bcrypt hash in `admin_password_hash` | raw password in any committed file |
| Session HMAC pepper | `admin_session_secret` | frontend / GitHub |

The login form is empty on purpose. Type the **exact** `admin_username` from
the config file (case-sensitive). The intended bootstrap username is `admin`.
It is **not** hardcoded in the React app.

### Generate `ADMIN_PASSWORD_HASH` (never commit the raw password)

On your computer (PHP 8.1+), for the intended bootstrap password:

```bash
php -r "echo password_hash('admin', PASSWORD_DEFAULT), PHP_EOL;"
```

Paste **only the hash** (starts with `$2y$`) into `admin_password_hash`.
Leave `admin_password` empty. The live site uses `password_verify()`.
Never put the raw password in `src/`, `public/`, GitHub, or `config.example.php`.

After first login, change that password in **Admin orders → Change password**.
The new bcrypt hash is stored in MySQL table `admin_credentials` and overrides
the config file from then on (no need to edit `kalasearch-config.php` again).

### Generate `ADMIN_SESSION_SECRET`

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
# or: openssl rand -hex 32
```

At least 32 characters. This peppers the session token before it is stored
in MySQL (`admin_sessions.token_hash`).

### MySQL schema

phpMyAdmin → your database → Import → `database/schema.sql`.

Confirm these tables exist:

- `orders`
- `order_items`
- `admin_sessions`  ← login **cannot** succeed without this table
- `admin_credentials` ← empty at first; filled when the admin changes the password in the panel

A successful `POST /api/admin/login` **inserts a row** into `admin_sessions`.
If the database is missing, login returns `500 {"error":"server_error"}`
(never a stack trace or the DB password).

### Config variables that must be non-empty

```
db_host, db_name, db_user, db_password
admin_username              (intended bootstrap: admin)
admin_password_hash         (bcrypt of the bootstrap password — see above)
admin_session_secret
session_ttl_days            (default 7)
```

If username / hash / secret are empty, login returns
`503 {"error":"admin_not_configured"}`. The React page now shows a
**configuration** message, not “wrong password”.

### How to test `/api/health`

```bash
curl -sS https://YOUR-DOMAIN/api/health
# expected: {"ok":true}
```

If this is HTML, 404, or the homepage, `public_html/api/` or `.htaccess` is
wrong — `/admin` will not be able to log in.

### How to test `/api/admin/login`

```bash
curl -sS -D - -o /tmp/ks-login.json -X POST https://YOUR-DOMAIN/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR_BOOTSTRAP_PASSWORD"}'
```

Use the username that is actually in `kalasearch-config.php`.

| HTTP | Body | Meaning |
|---|---|---|
| 200 | `{"token":"..."}` | Config + MySQL + password are correct |
| 401 | `{"error":"invalid_credentials"}` | Username or password does not match the config (case-sensitive username) |
| 503 | `{"error":"admin_not_configured"}` | Hash/username/secret missing |
| 500 | `{"error":"server_error"}` | DB down, wrong DB password, or `admin_sessions` missing |
| 404 | `{"error":"not_found"}` | Request never reached the PHP front controller |

Then:

```bash
TOKEN=$(php -r 'echo json_decode(file_get_contents("/tmp/ks-login.json"))->token;')
curl -sS https://YOUR-DOMAIN/api/admin/session -H "Authorization: Bearer $TOKEN"
curl -sS https://YOUR-DOMAIN/api/admin/orders  -H "Authorization: Bearer $TOKEN"
```

Both must be 200. If login is 200 but these are 401, Apache stripped the
`Authorization` header — `public_html/api/.htaccess` must contain the
`SetEnvIf Authorization` / `RewriteRule` restore lines.

### Common causes of a “wrong password” on cPanel (and what you see now)

| Real cause | Old UI (bug) | UI now |
|---|---|---|
| `kalasearch-config.php` missing / empty hash | “wrong password” | Admin is not configured |
| Typed `karen` but config says `Orderx` (or vice versa) | “wrong password” | Invalid username or password |
| Username case mismatch (`orderx` vs `Orderx`) | “wrong password” | Invalid username or password |
| MySQL / `admin_sessions` missing | “wrong password” | Server error |
| `public_html/api/` not uploaded, so `/api/admin/login` 404s | “wrong password” | Cannot reach /api |
| `public_html/.htaccess` missing, SPA swallowed `/api` | “wrong password” | Cannot reach /api |
| Wrong password | “wrong password” | Invalid username or password |

### Authorization Bearer passthrough

cPanel PHP-FPM often exposes the header as `REDIRECT_HTTP_AUTHORIZATION`.
The API reads both that and `HTTP_AUTHORIZATION`. Login itself does not
need a Bearer token; **session, orders, logout, and status PATCH do**.

## 20. Local development (unchanged)

```bash
npm ci
npm run dev        # Vite dev server + Node API middleware on :5173
npm test           # vitest (isolated temp store)
npm run build      # static build → dist/
npm run start      # Node production server (dev/VPS path — NOT used on cPanel)
```