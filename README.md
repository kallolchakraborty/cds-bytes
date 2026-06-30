# cds bytes

ABAP Core Data Services (CDS) documentation with 64 runnable examples across 12 phases, a 6-week study plan, full-text fuzzy search (indexing source code), and premium developer UX features.

## Quick Start

```bash
npm install     # Setup environment (no dependencies needed — just Node.js)
npm run build   # Compile & minify content JSON and central search index from sources/
npm start       # Serve locally on port 3000 (Python simple HTTP server fallback supported on port 3003)
```

## Core Features

### 💻 Premium Developer IDE Experience
* **Action Header Bar**: Every code block features a header bar displaying the syntax type (e.g. `ABAP`) with dynamic action utility buttons.
* **Copy to Clipboard**: Seamless copy button with checkmark animations and tooltip status feedback.
* **Download Source**: Directly download any CDS example as a `.asddls` file for instant drag-and-drop Eclipse ADT (ABAP Development Tools) importing.
* **Non-selectable Line Numbers**: Clean vertical gutters showing line numbers. Gutter cells are set to `user-select: none`, ensuring that users copying snippets from the page do not accidentally copy line numbers.

### 🔍 Full-Text Source Code Search
* Centralized search bar powered by **Fuse.js** featuring instant search-as-you-type fuzzy matching.
* Upgraded search index to index the raw ABAP CDS source code alongside descriptions, sections, and category tags, allowing developers to search for actual SQL keywords (e.g., `CAST`, `LEFT OUTER JOIN`, `@AbapCatalog`) and locate relevant templates instantly.
* Full keyboard navigation (Arrow keys + Enter) supported in the modal.

### ⚡ Performance Optimized
* The site uses a static JSON-driven architecture. Raw source files are parsed and minified during build to eliminate all whitespace bloat.
* Zero page-reload times. Pages dynamically fetch only the requested page chunks from the [content/](content) directory, drastically reducing data transfer overhead.
* **Non-blocking fonts**: Google Fonts and Material Symbols load asynchronously via `media="print" onload="this.media='all'"` with `<noscript>` fallbacks.
* **Preload & prefetch**: Critical CSS is preloaded; `docs.html` is prefetched from the landing page. External CDNs use `dns-prefetch` and `preconnect`.

### 🔍 SEO & Structured Data
* **Open Graph & Twitter Cards** — Full OG/Twitter meta tags with 1200×630 preview images, locale (`en_US`), and site name for rich social sharing.
* **JSON-LD Schema.org** — Enhanced `@graph` structured data: `WebSite` with `SearchAction` (site search), `Person` publisher, and per-content `TechArticle` injected dynamically on navigation.
* **Robots & Sitemap** — `noarchive` directive prevents stale cache copies. Auto-generated sitemap.xml indexes all 64 content pages + home + docs SPA (67 URLs total).
* **Dynamic SEO** — Title, canonical URL, OG/Twitter meta, and JSON-LD update on every hash-based navigation via `loader.js`.

### 🛡️ Anti-Scraping & Content Protection
* **XSS Sanitization** — `sanitizeHtml()` in both `modals.js` and `loader.js` strips event handlers (`on*`), `javascript:` hrefs, and removes `<script>`/`<iframe>`/`<object>`/`<embed>` elements.
* **SVG Watermarking** — All inline diagram SVGs carry a build-time watermark (`cds-bytes (c) 2026`) to deter casual reuse.
* **Fetch Retry** — Content fetches use exponential backoff (3 attempts, 200ms–1s delay) for resilience against transient failures.
* **Legal Footer** — Every page displays an MIT license notice with scraping prohibition.
* **Noarchive** — `<meta name="robots" content="index, follow, noarchive">` prevents Google from serving cached copies.

## Structure

| Path | Purpose |
|---|---|
| `sources/` | 12 phase directories with 64 `.txt` source files (single source of truth) |
| `content/` | Generated minified `.json` files loaded dynamically by the browser |
| `scripts/build.mjs` | Scans `sources/`, compiles/minifies JSON, generates route map + search index + sitemap + SVG watermarks |
| `js/generated.js` | Build artifact: route map, content metadata, and full-text search index |
| `js/loader.js` | Dynamic page renderer, code block decorator, SVG resolver, fetch retry, and dynamic SEO |
| `js/modals.js` | Fuse.js search coordinator with modal overlays, keyboard listener, and XSS sanitization |
| `js/theme.js` | Persistent theme toggler dynamically loading highlight.js styles based on system settings |
| `assets/diagrams/` | Interactive, responsive SVG concept diagrams (build-time watermarked) |
| `assets/favicon.svg` | SVG favicon (database icon in brand color) |
| `assets/favicon-32x32.png` | 32×32 PNG favicon |
| `assets/favicon-192x192.png` | 192×192 PNG favicon (PWA) |
| `assets/apple-touch-icon.png` | Apple touch icon (180×180) |
| `sitemap.xml` | Auto-generated sitemap (67 URLs) |
| `robots.txt` | Crawler permissions pointing to sitemap |
| `.github/workflows/deploy.yml` | GitHub Actions automated Pages build and delivery workflow |

## Deployment

Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically. Ensure repo Settings → Pages → Source is set to **GitHub Actions**.
