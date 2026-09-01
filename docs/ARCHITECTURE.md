# KalaSearch data architecture

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

## Order API configuration (local preview)

`server/orderHandler.mjs` reads admin credentials from the process environment:

```
ADMIN_USERNAME       admin login name (matched case-insensitively)
ADMIN_PASSWORD       admin password (matched exactly)
ADMIN_SESSION_SECRET HMAC key for the admin session token
```

There is no fallback value in code, so no credential can end up in the
repository. `server/viteApiPlugin.mjs` additionally loads a git-ignored
`.env.local` file into `process.env` at startup so `npm run dev` / `npm run
preview` can authenticate without putting the values on the command line.
`.env.example` documents the keys and is the only env file that is tracked.

Orders are written to `data/orders.json` (git-ignored). `ORDERS_FILE`
overrides that path — `npm test` points it at a scratch file under
`node_modules/.tmp`, so a test run can never pollute the preview data.

## QA commands

```
npm test        unit + render + DOM tests (vitest)
npx tsc --noEmit
npm run build
npm run qa:boot boot QA harness: mounts the real production bundle in jsdom
              and drives hamburger / theme / search / cart / product / admin
```
