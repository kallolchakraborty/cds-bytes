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

## Structure

| Path | Purpose |
|---|---|
| `sources/` | 12 phase directories with 64 `.txt` source files (single source of truth) |
| `content/` | Generated minified `.json` files loaded dynamically by the browser |
| `scripts/build.mjs` | Scans `sources/`, compiles/minifies JSON, and generates route map + search index |
| `js/loader.js` | Dynamic page renderer, code block decorator, and SVG diagram line-spacing resolver |
| `js/modals.js` | Fuse.js search coordinator with modal overlays and keyboard listener |
| `js/theme.js` | Persistent theme toggler dynamically loading highlight.js styles based on system settings |
| `assets/diagrams/` | Interactive, responsive SVG concept diagrams |
| `.github/workflows/deploy.yml` | GitHub Actions automated Pages build and delivery workflow |

## Deployment

Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically. Ensure repo Settings → Pages → Source is set to **GitHub Actions**.
