# MiniWeb website

The academic project website for **Back to Basics: Drills Before Games for Web Agents**, featuring an interactive 3D explorer for the 65 websites in [MiniWeb](https://github.com/miniweb-site/MiniWeb).

The main page is a write-up of the paper: the title, authors, and affiliations, a table of contents beside [Paper] (a thumbnail of the paper's first page), [Code] (GitHub), [Dataset] (Hugging Face), and [Live websites] links, the connected website graph, a three-point summary, and five numbered sections (Background, MiniWeb, Where Agents Fail, MiniWebGen, MiniWebAgent) with interactive figures, the paper's method figure and main results, references, and BibTeX. On screens at least 1640 px wide, a rail at the left tracks the section being read. The page is built to be skimmed: each section leads with its claim (the paper's subsection finding), a strip of key numbers that count up as they arrive, and its figures; the section's text follows below the numbers, shown by default and foldable (with its reading time). One switch under the summary folds or shows all of it and is remembered in the browser; printing shows everything.

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

The write-up sets its text in STIX Two (Times-like, as in the manuscript) in an 840 px reading column; figures, tables, and interactive examples break out to 1180 px, the width of the website graph, and are drawn in the visual language of the paper's figures (`docs/figures/common/style.py` in the MiniWeb repository): Helvetica text and DejaVu Sans Mono code, the figures' ink, panel, and grid greys, grey for untrained and blue for trained agents, and the skill-family colors (drag `#D6336C`, selection `#1C7ED6`, text `#2F9E44`, form `#E8590C`, navigation `#1098AD`, I/O `#7048E8`, reasoning `#B07D00`). Skill families named in the text are set as the paper sets them, in bold on the family's 22% tint (`.fam-hl`). Captions follow the paper, with a bold first sentence and a bold takeaway; tables use booktabs rules and the paper's significance shading. The production selection (`manuscript` type, `figure` palette) is centralized in `src/design-theme.js`, with values in `src/design-options.js`. `src/paper-page.js` and `src/paper-page.css` provide the write-up, using the manuscript metadata and numbers in `src/structure-content.js`.

To compare looks on the real page, add a query parameter: `?font=figure` sets the text in Helvetica as well, like the figures. `?font=`, `?accent=`, `?logo=`, and `?layout=` accept any option id from `src/design-options.js`.

## Figures, tasks, and trajectories

- **Method figure** (`src/pdf-figure.js`): drawn from the paper's own `public/research/method.pdf` with PDF.js at the screen's pixel density, so it is as sharp as the PDF at any width or zoom; PDF.js loads only when the figure comes near the screen. `method.svg` shows until then, or if the PDF cannot be drawn. Clicking the figure opens the PDF.
- **Skill profiles** (`src/skill-profiles.js`): spider plots of the ten agents of Table 2, drawn in the page from `src/data/skill-profiles.json`, as small multiples or all on one plot, with the values in a table.
- **Primitive catalog** (`src/primitive-catalog.js`): the 37 primitives by family with their span rules and counts (`src/data/primitives.json`, from the paper's primitive table) and each primitive's MiniWebGen guide, drawn like the guide card of the method figure.
- **Annotation tool** (`src/annotation-tool.js`): the paper's four screenshots of the tool (dashboard, task editor, verifier builder, macro browser; Supp. annotation interface), one per step of the work, with numbered callouts that spotlight the part they describe. Lossless WebP at the original 2160 × 1350 in `public/research/annotation/`.
- **Task explorer** (`src/task-explorer.js`): all 369 human tasks. A grid sorts them by primitives per task (1 to 6+) and by single-site or multi-site, like the annotation dashboard; a cell, row, or column filters the list, as do search, training or held-out sites, skill family, whether the demonstration passes its verifier, and whether the page has its screenshots. The viewer shows the chosen task's chain, its primitive spans over the demonstration's actions, and its demonstration status. About three tasks per grid cell (31 in all, about 24 MB) carry their screenshots, at the recorded 1440 px; the others list their actions and link to the dataset's demonstrations table. `src/data/task-index.json` loads when the explorer comes near the screen, and `public/tasks/<id>.json` when a task is chosen.
- **MiniWebGen** (`src/miniwebgen.js`): one generated trajectory per trained skill family, followed through the five stages of the method figure with the records of its generation: the guide, the sampled configuration (site, control, argument, start page), the instruction and its check, the coding LLM's script beside the recorded trajectory, and the gate with every attempt (the slider example shows two rejected attempts before the kept one).
- **MiniWebAgent** (`src/miniwebagent.js`): three held-out tasks, replayed turn by turn (the planner's memory and decision, the executor's steps and report, autoplay) or compared with the same model and adapter acting alone, with screenshots and the verifier's verdict per primitive for both.
- **Skill improvement** (`src/skill-improvement.js`): per skill family, success on the 103 generated single-primitive tasks (Fig. 7), primitive instances passed inside the 62 held-out tasks, and task success by task length (Fig. 6), for practice, composition, or both. The page shows it twice, opening on practice in Section 4 and on composition in Section 5.

**Motion** (`src/motion.js` and the end of `src/showcase.css`): the title plays once on load and again when clicked (a highlighter swipes across “Drills” in drag & gesture's pink, pulled by a cursor that overshoots and corrects, then across “Games” in the trained blue, and a hand-drawn loop circles “Basics”; the marks are CSS pseudo-elements, so the title still copies as plain text); figures rise into place as they arrive; dumbbells move from the first arm's value to the second's and their gains count up; spider plots grow from the centre and move between agents; the length chart's lines draw from left to right; MiniWebAgent's turns play out in order (planner, executor, report, verdicts) with autoplay; MiniWebGen's stages slide in, its trajectories play step by step with the click marked and the drag drawn, and its gate stamps each attempt. Under `prefers-reduced-motion: reduce` nothing moves and every figure shows its final state; the figures read the same without motion.

All of this data comes from one script:

```sh
~/.conda/envs/miniweb/bin/python -I scripts/export_showcase.py   # reads ../MiniWeb-src, ../MiniWeb, and its paper source
```

It parses Table 2 (`tables/rq1_table.tex`) and the primitive table (`tables/supp_primitives.tex`) from the paper source, copies `figures/method.pdf` (and converts it to the SVG fallback when `pdftocairo` is installed), and reads the guides, tasks, demonstrations, and MiniWebGen trajectories from the anonymised Hugging Face release in `MiniWeb-src/data/release/miniweb-v1-hf`, plus one MiniWebAgent run (`data/webmix/eval/pagent_pooled_s2`) and the trained single agent's run on the same tasks (`human_pooled_v4`). From the MiniWeb repository (`--repo`) it reads each generated trajectory's sampled task and attempts (`data/datagen/runs/<run>/tasks.jsonl`, `episodes/<id>/a<k>/attempt.json`) and computes `src/data/skill-improvement.json` with the paper's own figure code (`docs/figures/common/results.py` over the runs of `docs/figures/tables/tables_config.yaml`). Rerun it after the paper, its figures, or its runs change. The examples are listed at the top of the script; it exports only the fields the page shows. The task explorer's screenshot subset is chosen there too (`choose_shown`: the page's own examples, then demonstrations that pass their verifier, live captures, short demonstrations, one site each), and neither it nor the other examples show sites whose upstream data terms do not allow reuse (`RESTRICTED`); those tasks are listed with their actions only. `tests/showcase.test.js` checks that no host, path, or annotator name is exported and that every screenshot decodes; `tests/paper-data.test.js` checks the parsed tables and the skill-improvement numbers against the paper's claims.

## Link previews

The main page includes static Open Graph and X/Twitter metadata in `index.html`, with absolute URLs for the production domain. Shared links use `public/social-preview.png`, a 1200 × 630 image built from the production palette, project logo, and local website thumbnails. To update its artwork, edit `scripts/generate-social-preview.mjs`, run `npm run build:social-image`, and commit the regenerated PNG. The generator reads the shared production theme so the card follows palette and logo changes. The normal build copies the image without regenerating it.

## Design explorer

Open `/design-explorer.html` on the same dev server to explore a separate design sandbox. It includes eight curated directions, ten font pairings, ten palettes, five original logo marks, and three page layouts. Changes apply to an embedded live preview; they do not modify the original page.

Use the Type, Color, Logo, and Layout tabs to mix choices. Desktop, tablet, and phone buttons change the preview width. Preferences persist in this browser and are also encoded in the URL. **Copy direction** copies the current recipe and local preview URL; **Save CSS** downloads the typography, color, and layout overrides. The SVG logo remains a separate choice in the recipe.

The production build includes the main page and every explorer entry point. Fonts are loaded from Google Fonts, with local fallback stacks when unavailable.

## Academic structure studio

Open `/structure-explorer.html` to compare four content structures for the academic project page: **Paper first**, **World first**, **Story first**, and **Evidence first**. Each direction has a full page preview, a reading-path outline, and a short explanation of its audience and tradeoff.

Use **Keep section** to collect pieces in **My mix**, or adopt an entire direction as a starting point. The mix supports changing the opening, adding and removing sections, reordering with keyboard-accessible buttons, and saving notes. The recommended mix combines an academic opening, early website exploration, and the failure → practice → composition research story. **Export decisions** copies or downloads the current outline and notes. Choices persist locally; custom section order is also included in the URL. Desktop and phone controls change the embedded preview width; **Open page** shows the selected concept without studio annotations.

The prototypes are grounded in the arXiv source of the paper (`docs/paper/MiniWeb_arxiv` in the MiniWeb repository, 20 October 2026), including its sections, author metadata, `tables/rq1_table.tex`, and `tables/rq3_transfer.tex`. The copied figures are recorded in `public/research/provenance.json`. Code and dataset links are the manuscript’s release destinations; a public paper link and final citation metadata remain to be supplied. These alternate concepts remain separate from the main website and are included in the GitHub Pages deployment.

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
