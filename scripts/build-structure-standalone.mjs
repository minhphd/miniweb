// Produce one portable, offline-capable HTML file from the same studio sources.
// esbuild is already provided by Vite; no additional dependency is required.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/miniweb-structures.html');
const catalog = JSON.parse(await readFile(resolve(root, 'src/data/sites.json'), 'utf8'));
const images = Object.fromEntries(await Promise.all(catalog.map(async site => [site.id,
  `data:image/webp;base64,${(await readFile(resolve(root, `public/previews/thumbnails/${site.id}.webp`))).toString('base64')}`])));
const method = `data:image/webp;base64,${(await readFile(resolve(root, 'public/research/method.webp'))).toString('base64')}`;
const favicon = `data:image/svg+xml;base64,${(await readFile(resolve(root, 'public/favicon.svg'))).toString('base64')}`;
const read = file => readFile(resolve(root, file), 'utf8');
const css = file => read(file).then(text => text.replace(/@import url\([^)]*\);/g, ''));
const scriptJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');

async function bundle(file, transform, plugins = []) {
  const result = await build({
    stdin: { contents: transform(await read(file)), resolveDir: resolve(root, 'src'), sourcefile: file, loader: 'js' },
    bundle: true, write: false, format: 'iife', minify: true, target: 'es2020', loader: { '.css': 'empty' },
    define: { 'import.meta.env.BASE_URL': JSON.stringify('./') },
    plugins,
  });
  return result.outputFiles[0].text;
}
const allowFileMessages = source => source.replaceAll('}, location.origin);', "}, location.origin === 'null' ? '*' : location.origin);");
const previewJS = await bundle('src/structure-preview.js', source => allowFileMessages(source)
  .replace('new URLSearchParams(location.search)', 'new URLSearchParams(window.__MINIWEB_QUERY__)')
  .replace('event.origin !== location.origin', 'event.origin !== window.__MINIWEB_PARENT_ORIGIN__')
  .replace('const thumbnail = site => `${base}previews/thumbnails/${site.id}.webp`;', 'const thumbnail = site => window.__MINIWEB_IMAGES__[site.id];')
  .replaceAll('${base}research/method.webp', method)
  .replaceAll('./favicon.svg', favicon)
  .replaceAll('./#site=', 'https://minhphd.github.io/miniweb/#site=')
  .replaceAll('href="./"', 'href="https://minhphd.github.io/miniweb/"')
  .replace(": './';", ": 'https://minhphd.github.io/miniweb/';")
  .replace('href="./structure-explorer.html">Explore website structures ↗', 'href="https://minhphd.github.io/miniweb/" target="_blank" rel="noopener">MiniWeb website ↗'));
const previewCSS = await css('src/structure-preview.css');
const explorerCSS = await css('src/structure-explorer.css');
const studioJS = await bundle('src/structure-explorer.js', source => {
  let modified = allowFileMessages(source)
    .replaceAll('./favicon.svg', favicon)
    .replace('href="./"', 'href="https://minhphd.github.io/miniweb/" target="_blank" rel="noopener"')
    .replace('href="./design-explorer.html"', 'href="https://minhphd.github.io/miniweb/design-explorer.html"')
    .replace('if (loadFrame) $(\'preview-frame\').src = previewURL(true);', "if (loadFrame) $('preview-frame').srcdoc = window.__MINIWEB_MAKE_PREVIEW__(active, mix, true, showNotes);")
    .replace('Preview (local server required):\\n${previewURL()}', 'Preview: open miniweb-structures.html and select ${title}.');
  const start = modified.indexOf('function previewURL(');
  const end = modified.indexOf('function syncFrame()', start);
  if (start < 0 || end < 0) throw new Error('Cannot locate preview URL helper; update standalone packager.');
  modified = modified.slice(0, start) + `
const previewUrls = new Map();
function previewURL(annotated = false) {
  const key = JSON.stringify([active, mix, annotated, showNotes]);
  if (!previewUrls.has(key)) previewUrls.set(key, URL.createObjectURL(new Blob([window.__MINIWEB_MAKE_PREVIEW__(active, mix, annotated, showNotes)], { type: 'text/html' })));
  return previewUrls.get(key);
}
` + modified.slice(end);
  return modified;
});

const bootstrap = `
const previewCSS = ${scriptJSON(previewCSS)};
const previewJS = ${scriptJSON(previewJS)};
const images = ${scriptJSON(images)};
const favicon = ${scriptJSON(favicon)};
const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');
window.__MINIWEB_MAKE_PREVIEW__ = (direction, sections, studio, notes) => {
  const query = new URLSearchParams({direction, sections: sections.join(',')});
  if(studio) query.set('studio', '1');
  if(!notes) query.set('notes', '0');
  return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MiniWeb — Academic website concept</title><link rel="icon" href="'+favicon+'"><style>'+previewCSS+'</style></head><body><div id="structure-preview"></div><script>window.__MINIWEB_QUERY__='+safeJSON(query.toString())+';window.__MINIWEB_PARENT_ORIGIN__='+safeJSON(location.origin)+';window.__MINIWEB_IMAGES__='+safeJSON(images)+';'+previewJS+'<\\/script></body></html>';
};
`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Compare four academic website structures for MiniWeb, then mix and reorder their sections."><title>MiniWeb — Structure studio</title><link rel="icon" href="${favicon}"><style>${explorerCSS}</style></head>
<body><div id="structure-studio"></div><script>${(bootstrap + studioJS).replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Created ${output} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB).`);

// Also package the selected paper-first page, including the actual graph module.
const inlineAssets = source => source
  .replaceAll('`${import.meta.env.BASE_URL}previews/thumbnails/${site.id}.webp`', 'window.__MINIWEB_IMAGES__[site.id]')
  .replaceAll('${import.meta.env.BASE_URL}research/method.webp', '${window.__MINIWEB_METHOD__}');
const pageJS = await bundle('src/main.js', source => inlineAssets(source).replace('href="./"', 'href="#page-title"'), [{
  name: 'inline-paper-assets',
  setup(builder) {
    builder.onLoad({ filter: /\/src\/(graph|paper-page)\.js$/ }, async args => ({
      contents: inlineAssets(await readFile(args.path, 'utf8')), loader: 'js', resolveDir: dirname(args.path),
    }));
  },
}]);
const pageCSS = `${await css('src/style.css')}\n${await css('src/paper-page.css')}`;
const pageBootstrap = `window.__MINIWEB_IMAGES__=${scriptJSON(images)};window.__MINIWEB_METHOD__=URL.createObjectURL(new Blob([Uint8Array.from(atob(${scriptJSON(method.split(',')[1])}),c=>c.charCodeAt(0))],{type:'image/webp'}));`;
const pageHTML = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#fafafa"><title>MiniWeb — Back to Basics: Drills Before Games for Web Agents</title><link rel="icon" href="${favicon}"><style>${pageCSS}</style></head><body><div id="app"></div><script>${(pageBootstrap + pageJS).replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
const pageOutput = resolve(root, 'artifacts/miniweb-paper-first.html');
await writeFile(pageOutput, pageHTML);
console.log(`Created ${pageOutput} (${(Buffer.byteLength(pageHTML) / 1024 / 1024).toFixed(2)} MiB).`);
