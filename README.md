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

`src/data/sites.json` contains the catalog and source links. Names and descriptions come from the live MiniWeb registry and individual site documentation. Graph and directory cards display local WebP screenshots of the actual site UIs. Their thumbnails need no external services at runtime and avoid loading a separate HTML document for every card.

The selected detail panel shows its thumbnail immediately while the live app loads. It retains the three most recently opened live iframes for reuse, so returning to a recent site preserves its loaded page. The network and directory share the same thumbnail files; the design explorer remains a separate HTML entry point.

Refresh snapshots from the live service:

```sh
node scripts/refresh-previews.mjs
```

The refresh script limits concurrent requests, embeds same-origin styles, and removes scripts, embedded browsing contexts, active event handlers, and autofocusing controls. Source snapshots have inert bodies and a restrictive content security policy. Fetch status is recorded in `public/previews/status.json`. These HTML files are preserved as the source for thumbnail capture.

To regenerate the thumbnails after refreshing the HTML:

1. Start the local Vite server with `npm run dev`.
2. Use a browser to capture each `/previews/<site.id>.html` at a viewport of **1100 × 700 pixels**. Wait for its images and fonts to load, capture the viewport, and save the PNG in a capture directory as `<site.id>.png`. Capture all IDs in `src/data/sites.json`.
3. Convert the captures to **550 × 350 WebP** thumbnails:

   ```sh
   node scripts/optimize-thumbnails.mjs /absolute/path/to/captures
   ```

The optimized files are written to `public/previews/thumbnails/`. Check the generated images and commit them along with any refreshed source snapshots. Screenshot capture may need access to the original image and font hosts; visitors use the resulting local thumbnails.

Live apps are hosted at https://miniweb-production.up.railway.app/. Their loading speed still depends on the remote service and its assets. Availability, third-party cookie policies, and the remote server's embedding policy can affect live interactions. The panel always offers an external link.

## Structure

- `src/main.js`: page, search/filter state, directory, and live detail panel.
- `src/style.css`: responsive visual design.
- `src/design-theme.js`: published design selection and shared theme renderer.
- `design-explorer.html`: separate interactive design sandbox.
- `src/graph.js`: DOM/canvas renderer, pointer/touch/keyboard input, and animation.
- `src/graph-math.js`: deterministic 3D layout, perspective projection, and illustrative edges.
- `src/data/sites.json`: 65-site catalog.
- `public/previews/`: source HTML snapshots and asset provenance.
- `public/previews/thumbnails/`: optimized local WebP interface screenshots.
- `scripts/refresh-previews.mjs`: refresh source HTML from MiniWeb.
- `scripts/optimize-thumbnails.mjs`: resize and encode browser captures.
- `tests/`: graph and content integrity checks.

Interface previews originate from the MiniWeb project; this repository does not recreate the 65 applications or their backends.
