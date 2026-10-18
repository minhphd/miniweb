# MiniWeb website

The academic project website for **Back to Basics: Drills Before Games for Web Agents**, featuring an interactive 3D explorer for the 65 websites in [MiniWeb](https://github.com/miniweb-site/MiniWeb).

The main page opens with the paper title, authors, affiliations, and Paper draft / Code / Dataset links. The existing connected website graph comes immediately after those links. The research overview, summary, method, results, and citation follow the graph.

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

The [GitHub Pages workflow](.github/workflows/deploy.yml) installs dependencies, runs the tests, builds all HTML entry points, and deploys `dist/` on every push to `main`. It can also be run manually from the repository's Actions tab. In **Settings → Pages → Build and deployment**, the publishing source must be **GitHub Actions**.

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

## Design

The main page retains the Graphite monochrome palette, Small world orbit logo, and connected graph. Its paper introduction is centered, with IBM Plex Sans headings and body text; the graph and research labels use IBM Plex Mono. The graph theme is centralized in `src/design-theme.js`. `src/paper-page.js` and `src/paper-page.css` provide the academic content and layout, using the manuscript metadata and results in `src/structure-content.js`.

## Link previews

The main page includes static Open Graph and X/Twitter metadata in `index.html`, with absolute URLs for the production domain. Shared links use `public/social-preview.png`, a 1200 × 630 image built from the project logo and local website thumbnails. To update its artwork, edit `scripts/generate-social-preview.mjs`, run `npm run build:social-image`, and commit the regenerated PNG. The normal build copies the image without regenerating it.

## Design explorer

Open `/design-explorer.html` on the same dev server to explore a separate design sandbox. It includes six curated directions, eight font pairings, eight palettes, five original logo marks, and three page layouts. Changes apply to an embedded live preview; they do not modify the original page.

Use the Type, Color, Logo, and Layout tabs to mix choices. Desktop, tablet, and phone buttons change the preview width. Preferences persist in this browser and are also encoded in the URL. **Copy direction** copies the current recipe and local preview URL; **Save CSS** downloads the typography, color, and layout overrides. The SVG logo remains a separate choice in the recipe.

The production build includes the main page and every explorer entry point. Fonts are loaded from Google Fonts, with local fallback stacks when unavailable.

## Academic structure studio

Open `/structure-explorer.html` to compare four content structures for the academic project page: **Paper first**, **World first**, **Story first**, and **Evidence first**. Each direction has a full page preview, a reading-path outline, and a short explanation of its audience and tradeoff.

Use **Keep section** to collect pieces in **My mix**, or adopt an entire direction as a starting point. The mix supports changing the opening, adding and removing sections, reordering with keyboard-accessible buttons, and saving notes. The recommended mix combines an academic opening, early website exploration, and the failure → practice → composition research story. **Export decisions** copies or downloads the current outline and notes. Choices persist locally; custom section order is also included in the URL. Desktop and phone controls change the embedded preview width; **Open page** shows the selected concept without studio annotations.

The prototypes are grounded in the Overleaf draft at commit `c1f89f1` (18 October 2026), including active manuscript sections, author metadata, and `tables/rq3_transfer.tex`. The copied method figure is recorded in `public/research/provenance.json`. Code and dataset links are the manuscript’s release destinations; a public paper link and final citation metadata remain to be supplied. These alternate concepts remain separate from the main website and are included in the GitHub Pages deployment.

The preview includes a searchable 65-site gallery, an illustrative slider interaction in the story opening, and benchmark-selectable result bars with the full comparison table and evaluation caveats. `structure-preview.html` is a separate build entry point so each direction can also be viewed independently. All four HTML entry points are included in `npm run build`.

For a portable file, run `npm run build:structures`. This generates `artifacts/miniweb-structures.html` with the styles, scripts, catalog, website thumbnails, and paper figure embedded. Open it directly in a browser without starting a server. It uses system font fallbacks and works offline; outbound paper, code, dataset, and live website links still need a network connection. The generated HTML is ignored by Git.

The same command also creates `artifacts/miniweb-paper-first.html`, a portable copy of the selected academic page with the original connected graph immediately beneath the paper links. Its graph, search, directory, thumbnails, and research sections work without a server; live website panels need an internet connection.

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
