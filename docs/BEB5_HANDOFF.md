# KalaSearch — BEB5 handoff (VS Code + boss preview)

This branch is the **real project**, not a demo and not a ZIP restore.
It continues the source-of-truth commit `c2a362609d6b052f2f3db7e912eff2a1bd1662af`
(branch `arena/01a05777-kkkkalasearch`) and carries the BEB3/BEB4/BEB5 work on top of it.
`main` was **not** touched by this work.

| item | value |
| --- | --- |
| Repository | `karenkhoshro-spec/KKKKALASEARCH` |
| Working branch (BEB5) | `arena/01a05d84-kkkkalasearch` |
| Base commit | `4660893` → BEB5 commit on top of it (see `git log -1`) |
| Runtime | Node 22 (tested on v22.22.3), ESM (`"type": "module"`) |
| Order store | `data/orders.json` (git-ignored — created on first order) |
| Secrets | `.env.local` (git-ignored, never committed) |

---

## 1. Get the project

```bash
# first time
git clone https://github.com/karenkhoshro-spec/KKKKALASEARCH.git
cd KKKKALASEARCH
git checkout arena/01a05d84-kkkkalasearch

# if you already cloned it
git fetch origin
git checkout arena/01a05d84-kkkkalasearch
git pull origin arena/01a05d84-kkkkalasearch
```

In VS Code: **File → Open Folder** on the clone, then `` Ctrl+` `` for the terminal below.

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:5173  (Vite dev server, /api included)
```

Production-style preview of the built single-file bundle:

```bash
npm run build      # -> dist/index.html (everything inlined)
npm run preview    # http://localhost:4173  (same /api plugin, shared order store)
```

### Admin credentials (env only — never in the repo)

```bash
# .env.local
ADMIN_USERNAME=karen
ADMIN_PASSWORD=<the real password>
# optional: ORDERS_FILE=/abs/path/orders.json  (defaults to data/orders.json)
```

`server/orderHandler.mjs` reads them at boot; the admin login is case-insensitive on the
username. Without these set, `/admin` refuses login by design.

### Catalogue data (tracked in Git)

`KalaSearch_Products_Import.csv` (347 products / 936 variant rows), `KalaSearch_Categories.csv`
(15 categories), `KalaSearch_Ashkan_Links.csv` (product → `ashkanplastic.com` URL mapping),
`src/data/productImages.json` (303 image mappings). All of it is parsed once per process by
`src/data/csvSource.ts`; nothing about the Ashkan site is written back — the integration is
**read-only preview/demo**, no production connection.

## 3. QA (all of these must PASS)

The browser suites drive a real headless Chromium, so they need the QA-only dependencies
(deliberately **not** project dependencies):

```bash
npm i --no-save puppeteer-core @sparticuz/chromium
```

```bash
npm test                  # 85 unit/dom tests (12 files)
npx tsc --noEmit          # types
npm run build             # bundle
git diff --check          # whitespace/conflict markers
npm run qa:boot           # 25 checks: themes, header, back, hamburger, out-of-stock, mobile back
npm run qa:journey        # 55 checks: THE boss scenario, see below
npm run qa:api            # 96 checks: live order API matrix on BOTH :5173 and :4173
node scripts/qa-browser.mjs   # 76 checks: geometry/paint, desktop + mobile
```

`qa:journey` and `qa:api` expect a preview on `:4173` and the dev server on `:5173`
(`--url` overrides the target). Artifacts land in `../qa-screens/` next to the clone:
`qa-screens/journey/01-category.png … 08-admin-delivered.png`, `journey-report.json`,
`image-requests.json`, `qa-screens/perf/perf.json`.

### The non-negotiable journey (customer → admin)

Category card (must contain **no product image**) → Product Details (real mapped image +
Ashkan CTA) → colour + quantity → cart → checkout form → `POST /api/orders` → **201 + order
number** → admin login `karen` → `/admin/orders` **must list that order** with: order number,
customer name, phone, province, city, postal code, address, order date, order status, payment
status, total, and per line: product id, code, name, **image**, SKU, variation, colour,
quantity, unit price, line total → status `delivered` → survives reload → another phone number
sees nothing.

### Performance reference (same machine, before = `4660893`, after = BEB5)

| route | image requests | DOM nodes | LCP | long-task time |
| --- | --- | --- | --- | --- |
| `/` | 3 → 3 | 377 → 377 | 404 → 360 ms | 112 → 103 ms |
| `/category/…` | 23 → **2** | 126 → 173 | 752 → **568 ms** | flat |
| `/product/6015010` | 4 → 3 | 125 → 123 | 600 → 580 ms | 93 → 89 ms |
| `/products` | 80 → **56** | **2882 → 278** | 1084 → **904 ms** | 242 → **94 ms** |
| `/search?q=…` | 104 → **2** | 483 → 377 | 748 → 624 ms | 111 → 93 ms |

Bundle cost: `1,842.90 kB → 1,855.93 kB` raw, `444.36 → 447.87 kB` gzip.
Re-measure with `npm run qa:perf -- --before http://localhost:4174` after building the base
commit in a worktree (`git worktree add ../kala-base 4660893`).

## 4. Known limits of this handoff (no hidden surprises)

- **Remote image pixels are untestable in a sandbox**: `ashkanplastic.com` and the image relays
  are not reachable from the Arena sandbox, so the browser suites answer image requests with a
  locally generated stand-in PNG. Mapping, `src`, requested URL, resolver chain and the
  out-of-stock fallback **are** verified; visual acceptance of the real photos must be done on a
  machine with internet access. `REMOTE IMAGE PIXEL QA = UNTESTED`.
- **Stored-order PDF is heavy** (~4.8 MB, `html2canvas` raster of the document). It produces a
  real `%PDF` file; replacing the raster with a vector print sheet is open follow-up work.
- `data/orders.json` accumulates QA orders in this sandbox. Delete the file to start the admin
  and customer lists empty (that is the intended behaviour of the store).
- No production write-back to Ashkan Plastic exists anywhere in this branch.
