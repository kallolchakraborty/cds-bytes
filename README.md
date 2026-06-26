# cds bytes

ABAP Core Data Services (CDS) documentation with 64 runnable examples across 12 phases, a 6-week study plan, and full-text search.

## Quick Start

```bash
npm install     # (no deps needed — just Node.js)
npm run build   # rebuild content JSON from sources/
npm start       # serve locally on port 3000
```

## Structure

| Path | Purpose |
|---|---|
| `sources/` | 12 phase directories with 64 `.txt` source files |
| `content/` | Generated `.json` files (committed for direct deployment) |
| `scripts/build.mjs` | Scans `sources/`, extracts CDS code, generates route map + search index |
| `js/loader.js` | Dynamic content loader with phase badges and highlight.js |
| `js/modals.js` | Fuse.js fuzzy search with keyboard navigation |
| `js/theme.js` | Dark/light theme toggle with localStorage persistence |
| `assets/diagrams/` | 8 inline SVG concept diagrams |
| `.github/workflows/deploy.yml` | GitHub Actions → GitHub Pages |

## Deployment

Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically. Ensure repo Settings → Pages → Source is set to **GitHub Actions**.
