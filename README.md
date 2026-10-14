# MiniWeb website

An interactive 3D explorer for the 65 websites in [MiniWeb](https://github.com/miniweb-site/MiniWeb). This first version contains the opening website network and selected-site panel; further page sections can be added later.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test
npm run build
npm run preview
```

The static build is in `dist/` and is compatible with GitHub Pages. Vite uses relative asset paths, so deployment works at both a custom domain and a repository subpath. No backend or API key is needed.

## Deploy

The [GitHub Pages workflow](.github/workflows/deploy.yml) installs dependencies, runs the tests, builds both HTML entry points, and deploys `dist/` on every push to `main`. It can also be run manually from the repository's Actions tab. In **Settings → Pages → Build and deployment**, the publishing source must be **GitHub Actions**.

- Website: https://miniweb-site.github.io/
- Separate design explorer: https://miniweb-site.github.io/design-explorer.html

The workflow uses Node.js 22. Generated build output stays out of Git; edit the source files and push to `main` to publish an update. Deployment status and logs appear in the **Deploy to GitHub Pages** workflow.

## Experience

- Drag or use arrow keys to rotate the 3D network; scroll, pinch, or use the buttons to zoom.
- Click a website to load its full desktop UI in the right panel, with a description and feature summary. Expand the panel for a larger view, or open the site in its own tab.
- Search names, brands, domains, categories, and descriptions. `/` focuses search; Escape closes details.
- The directory provides an alternative to the network. All nodes are keyboard-accessible; automatic rotation respects reduced-motion preferences.
- Direct links such as `#site=email` open a selected website.
- Edges are illustrative category and proximity connections, not measured benchmark task relationships.

## Published design

The main page uses IBM Plex Mono headings with IBM Plex Sans body text, the Graphite monochrome palette, the Small world orbit logo, and the editorial layout. The selection is centralized in `src/design-theme.js`; the explorer uses the same theme renderer while keeping its choices isolated.

## Design explorer

Open `/design-explorer.html` on the same dev server to explore a separate design sandbox. It includes six curated directions, eight font pairings, eight palettes, five original logo marks, and three page layouts. Changes apply to an embedded live preview; they do not modify the original page.

Use the Type, Color, Logo, and Layout tabs to mix choices. Desktop, tablet, and phone buttons change the preview width. Preferences persist in this browser and are also encoded in the URL. **Copy direction** copies the current recipe and local preview URL; **Save CSS** downloads the typography, color, and layout overrides. The SVG logo remains a separate choice in the recipe.

The production build includes both HTML entry points. Fonts are loaded from Google Fonts, with local fallback stacks when unavailable.

## Site previews and data

`src/data/sites.json` contains the catalog and source links. Names and descriptions come from the live MiniWeb registry and individual site documentation. Graph and directory cards display sanitized, script-free snapshots of the actual site UIs. Only the selected detail panel loads an active remote app.

Refresh snapshots from the live service:

```sh
node scripts/refresh-previews.mjs
```

The refresh script limits concurrent requests, embeds same-origin styles, and removes scripts, embedded browsing contexts, active event handlers, and autofocusing controls. Snapshots additionally use sandboxed iframes, inert bodies, and a restrictive content security policy. Fetch status is recorded in `public/previews/status.json`.

Live apps are hosted at https://miniweb-production.up.railway.app/. Availability, third-party cookie policies, and the remote server's embedding policy can affect live interactions. The panel always offers an external link. Preview images and some external fonts still depend on their original hosts; cached HTML/styles remain local.

## Structure

- `src/main.js`: page, search/filter state, directory, and live detail panel.
- `src/style.css`: responsive visual design.
- `src/design-theme.js`: published design selection and shared theme renderer.
- `design-explorer.html`: separate interactive design sandbox.
- `src/graph.js`: DOM/canvas renderer, pointer/touch/keyboard input, and animation.
- `src/graph-math.js`: deterministic 3D layout, perspective projection, and illustrative edges.
- `src/data/sites.json`: 65-site catalog.
- `public/previews/`: actual interface snapshots and asset provenance.
- `tests/`: graph and content integrity checks.

Interface previews originate from the MiniWeb project; this repository does not recreate the 65 applications or their backends.
