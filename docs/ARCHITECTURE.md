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

## UI state and navigation conventions

- Overlay routes (`/category/:id`, `/product/:id`, `/search`, `/cart`, `/checkout`, `/account`, `/about`) render above the homepage shell. Every in-app open is a real history entry so the Android/browser BACK button returns to the previous in-site state (product → its category or search results; category/search → home). When the app is opened directly on an overlay route, `AppShell` seeds one home entry underneath it so the first BACK still returns inside the site instead of leaving it. The in-page `BackButton` mirrors this: it walks real history back when an earlier entry exists and falls back to its explicit destination otherwise.
- Device Back never loops: seeding runs exactly once per page load and only when no earlier in-site entry exists.

## Checkout and order PDF

- Checkout validates the customer's first/last name, an Iranian mobile number, and a required delivery address before an order can be confirmed; email and order notes are optional. No customer data is ever faked or prefilled beyond what the account itself stores.
- The order PDF (`src/utils/pdf.ts`) is an offscreen-rendered, A4-paginated document rasterized with html2canvas + jsPDF (correct Persian shaping) carrying only verified data: order number, date/time, customer block, and per line the product name, selected variant, color, SKU, quantity, package quantity, verified price or "استعلام", real textual technical specs, and the product's own Ashkan URL when present.
- Legacy bare-number CSV `technical_spec` values (e.g. "12") are treated as non-customer content and filtered from UI/PDF via `src/utils/specFilter.ts`; genuine specs are preserved.

## Product images

- Each product only ever shows its own mapped image (`productImages.json`, validated in `csvSource.ts`); missing images stay missing with a clean fallback label — never another product's image.
- Detail pages: `preload` link + `eager` + `fetchpriority=high` image, fixed media box (no layout shift). Lists: `loading="lazy"` + `decoding="async"`. A session-level decode cache (`src/utils/imageLoadCache.ts`) lets already-seen images paint without a fade wait, and the browser cache prevents duplicate requests. `index.html` preconnects to the image origin.
