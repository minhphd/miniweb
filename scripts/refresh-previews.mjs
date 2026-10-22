#!/usr/bin/env node
/**
 * Refresh the read-only website cards using MiniWeb's real server-rendered UI.
 * Run: node scripts/refresh-previews.mjs [--catalog path/to/sites.json]
 * No browser, credentials, cookies, or JavaScript execution is involved.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/previews');
const origin = 'https://sparklabuofu-miniweb-demo.hf.space';
const catalogArgument = process.argv.indexOf('--catalog');
const catalogCandidates = catalogArgument >= 0
  ? [resolve(process.argv[catalogArgument + 1])]
  : [resolve(root, 'src/data/sites.json'), '/tmp/miniweb-live-catalog.json'];
let catalog;
for (const file of catalogCandidates) {
  try { catalog = JSON.parse(await readFile(file, 'utf8')); break; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (!catalog) throw new Error('Site catalog was not found. Pass --catalog <path>.');
const sites = Array.isArray(catalog) ? catalog : catalog.sites;
if (!Array.isArray(sites)) throw new Error('The catalog must contain an array of sites.');
await mkdir(resolve(output, 'assets'), { recursive: true });

// All network requests, including stylesheet assets, share a four-request gate.
let active = 0;
const waiting = [];
async function limitedFetch(url) {
  if (active >= 4) await new Promise(resolve => waiting.push(resolve));
  active += 1;
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30_000),
          headers: { 'User-Agent': 'MiniWeb-Explorer-Preview/1.0' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        return { url: response.url, status: response.status, bytes, type: response.headers.get('content-type') || '' };
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  } finally {
    active -= 1;
    waiting.shift()?.();
  }
}
const fetched = new Map();
function cachedFetch(url) {
  if (!fetched.has(url)) fetched.set(url, limitedFetch(url));
  return fetched.get(url);
}
function escapeAttribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}
async function replaceAsync(text, regex, replacer) {
  const matches = [...text.matchAll(regex)];
  const replacements = await Promise.all(matches.map(replacer));
  let index = 0;
  return text.replace(regex, () => replacements[index++]);
}

// Styles are embedded so previews work beneath any GitHub Pages base path.
// Same-origin CSS images/fonts are embedded too, avoiding live dependencies.
const styles = new Map();
const assetWarnings = [];
async function cssAsset(url) {
  if (url.origin !== origin) return url.href;
  try {
    const response = await cachedFetch(url.href);
    const type = response.type.split(';')[0] || 'application/octet-stream';
    const digest = createHash('sha256').update(url.href).digest('hex').slice(0, 16);
    const ext = url.pathname.match(/\.[a-z0-9]{1,8}$/i)?.[0] || '.bin';
    await writeFile(resolve(output, 'assets', `${digest}${ext}`), response.bytes);
    return `data:${type};base64,${response.bytes.toString('base64')}`;
  } catch (error) {
    assetWarnings.push({ url: url.href, error: error.message });
    return url.href;
  }
}
async function rewriteCss(css, sourceUrl, ancestors = []) {
  css = await replaceAsync(css, /@import\s+(?:url\(\s*)?["']?([^"'\s);]+)["']?\s*\)?\s*([^;]*);/gi, async match => {
    let url;
    try { url = new URL(match[1], sourceUrl); } catch { return ''; }
    if (url.origin !== origin) return `@import url("${url.href}") ${match[2]};`;
    if (ancestors.includes(url.href)) return '';
    const nested = await getCss(url.href, [...ancestors, sourceUrl]);
    return match[2].trim() ? `@media ${match[2]} { ${nested} }` : nested;
  });
  return replaceAsync(css, /url\(\s*(["']?)(.*?)\1\s*\)/gi, async match => {
    if (/^(data:|#)/i.test(match[2])) return match[0];
    try { return `url("${await cssAsset(new URL(match[2], sourceUrl))}")`; }
    catch { return match[0]; }
  });
}
async function getCss(url, ancestors = []) {
  if (!styles.has(url)) styles.set(url, (async () => {
    const response = await cachedFetch(url);
    const css = await rewriteCss(response.bytes.toString('utf8'), response.url, ancestors);
    const digest = createHash('sha256').update(url).digest('hex').slice(0, 16);
    await writeFile(resolve(output, 'assets', `${digest}.css`), css);
    return css;
  })());
  return styles.get(url);
}
async function snapshot(site) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(site.id)) throw new Error(`Unsafe site id: ${site.id}`);
  const url = new URL(site.path || site.url || `/sites/${site.id}/`, origin).href;
  const response = await cachedFetch(url);
  let html = response.bytes.toString('utf8');
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(?:iframe|object|embed)\b[^>]*\/?>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, tag => /http-equiv\s*=\s*["']?(?:refresh|content-security-policy)\b/i.test(tag) ? '' : tag)
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:autofocus|autoplay|contenteditable)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '')
    .replace(/\s+(?:href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\1/gi, '');
  html = await replaceAsync(html, /<link\b[^>]*>/gi, async ([tag]) => {
    const rel = attr(tag, 'rel')?.toLowerCase();
    if (rel !== 'stylesheet') return ''; // Preloads, scripts and icons are unnecessary.
    const href = attr(tag, 'href');
    if (!href) return '';
    const source = new URL(href.replaceAll('&amp;', '&'), response.url);
    if (source.origin !== origin) return tag;
    let css = await getCss(source.href);
    // MiniWeb's shared logo sheet declares 22 fonts, but each page uses only
    // one or two. Avoid copying every unused font into every thumbnail.
    if (source.pathname.endsWith('/brand-fonts.css')) {
      const fontUsage = html.toLowerCase();
      css = css.replace(/@font-face\s*\{[^}]*\}/gi, face => {
        const family = face.match(/font-family\s*:\s*['"]([^'"]+)['"]/i)?.[1];
        return family && fontUsage.includes(family.toLowerCase()) ? face : '';
      });
    }
    return `<style data-preview-source="${escapeAttribute(source.href)}">${css.replace(/<\/style/gi, '<\\/style')}</style>`;
  });
  html = await replaceAsync(html, /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi, async match => {
    if (match[1].includes('data-preview-source=')) return match[0];
    return `<style${match[1]}>${await rewriteCss(match[2], response.url)}</style>`;
  });
  const policy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline' https: data:; img-src https: data:; font-src https: data:; connect-src 'none'; frame-src 'none'; object-src 'none'; media-src 'none'; form-action 'none'; base-uri https://sparklabuofu-miniweb-demo.hf.space";
  const head = `<meta http-equiv="Content-Security-Policy" content="${policy}"><base href="${escapeAttribute(response.url)}"><meta name="robots" content="noindex,nofollow"><style data-preview-control>html,body{pointer-events:none!important;user-select:none!important;overflow:hidden!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}::-webkit-scrollbar{display:none!important}</style>`;
  html = html.replace(/<head\b[^>]*>/i, match => `${match}${head}`);
  html = html.replace(/<body\b([^>]*)>/i, '<body$1 inert aria-hidden="true">');
  await writeFile(resolve(output, `${site.id}.html`), html);
  return { id: site.id, url, previewUrl: `./previews/${site.id}.html`, status: response.status, bytes: Buffer.byteLength(html) };
}

const results = [];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < sites.length) {
    const site = sites[next++];
    try {
      const result = await snapshot(site);
      results.push(result);
      console.log(`${results.length}/${sites.length} ${site.id}: ${result.status} (${result.bytes} bytes)`);
    } catch (error) {
      results.push({ id: site.id, status: 'failed', error: error.message });
      console.error(`${site.id}: ${error.message}`);
    }
  }
}));
results.sort((a, b) => a.id.localeCompare(b.id));
const failed = results.filter(result => result.status !== 200).length;
const report = {
  generatedAt: new Date().toISOString(),
  source: origin,
  total: sites.length,
  succeeded: results.length - failed,
  failed,
  totalBytes: results.reduce((total, item) => total + (item.bytes || 0), 0),
  assetWarnings,
  sites: results,
};
await writeFile(resolve(output, 'status.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Finished: ${report.succeeded}/${report.total} previews, ${report.totalBytes} bytes, ${assetWarnings.length} asset warnings.`);
if (failed) process.exitCode = 1;
