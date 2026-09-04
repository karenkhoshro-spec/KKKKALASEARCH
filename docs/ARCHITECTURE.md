# KalaSearch data architecture

## Production vs local backends

- **Production on cPanel / shared hosting:** PHP 8.1 + MySQL (`php-api/`,
  `database/schema.sql`). Browser calls relative `/api/...`. Admin login is
  `POST /api/admin/login`. Bootstrap credentials live in `kalasearch-config.php`
  **outside** `public_html`. After a password change in `/admin`, the bcrypt
  hash is stored in MySQL `admin_credentials` and overrides the config file
  (see `docs/CPANEL_PHP_DEPLOYMENT.md`).
- **Local development:** Vite + the Node API middleware (`server/orderHandler.mjs`).
  Node is not required on cPanel.

Admin username/password are **never** in the React app, `VITE_*` variables,
or GitHub.

---

## Current mode: local CSV

The UI imports the stable facade in `src/data/products.ts`. That facade exposes a `ProductProvider`; the active implementation is `LocalCsvProductProvider`, backed by the existing CSV adapter in `src/data/csvSource.ts`. CSV parsing, Persian normalization, price mapping, category mapping, and variant mapping stay in the data layer.

The current price source remains `kala_search_inventory.csv` and `outbound_or_value`. No UI component reads that schema directly.

## Future provider modes

`src/data/providers/ProductProvider.ts` defines the application contract for products, categories, variants, prices, and inventory. A backend-backed implementation can replace `LocalCsvProductProvider` without changing ProductCard, ProductDetails, Search, Cart, or category pages.

`src/data/ashkanPlasticClient.ts` is a transport boundary for a future approved Ashkan API. It performs no requests until explicitly instantiated with a configured URL and contains no credential. Authentication belongs in a trusted backend, never in the frontend.

`src/data/ProductSyncService.ts` is the future synchronization boundary for CSV, Ashkan API, or database sources. It exposes sync status and timestamp concepts without running a sync today.

## Configuration and deployment

`.env.example` documents public runtime settings:

- `VITE_DATA_PROVIDER_MODE`
- `VITE_API_BASE_URL`
- `VITE_PUBLIC_SITE_URL`

Backend-only values such as `ASHKAN_API_KEY` and `ASHKAN_API_TOKEN` are documented as non-`VITE_` variables and must only exist in a server environment. No Arena/e2b URL or token is part of the app.

A future backend can expose `/api/products`, `/api/products/:id`, `/api/products/:id/variants`, `/api/products/:id/price`, `/api/categories`, `/api/search`, and `/api/inventory/:id`, with production CORS restricted to configured domains.
