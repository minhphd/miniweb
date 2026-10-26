import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { accents, logos } from '../src/design-options.js';
import { productionDesign } from '../src/design-theme.js';

// The PNG is committed so production cards never depend on a browser, remote
// fonts, or a runtime image endpoint. Regenerate after changing this artwork.
const publicFile = path => fileURLToPath(new URL(`../public/${path}`, import.meta.url));
const catalog = JSON.parse(await readFile(new URL('../src/data/sites.json', import.meta.url), 'utf8'));
const xml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const palette = accents.find(option => option.id === productionDesign.accent);
const selectedLogo = logos.find(option => option.id === productionDesign.logo);
if (!palette || !selectedLogo) throw new Error('The production design must use a known palette and logo.');
const mix = (foreground, background, amount) => {
  const channels = hex => hex.slice(1).match(/../g).map(channel => parseInt(channel, 16));
  const back = channels(background);
  return `#${channels(foreground).map((channel, index) => Math.round(channel * amount + back[index] * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
};
const colors = {
  ...palette,
  muted: palette.muted || mix(palette.ink, palette.background, .7),
  border: mix(palette.accent, palette.background, .2),
  dots: mix(palette.accent, palette.background, .15),
  connection: mix(palette.accent, palette.background, .35),
};
const logo = selectedLogo.svg.replaceAll('currentColor', colors.accent)
  .replace('<svg ', '<svg x="58" y="52" width="46" height="46" ');
const cards = [
  { id: 'email', x: 654, y: 72, width: 218 },
  { id: 'calendar-todo', x: 930, y: 104, width: 214 },
  { id: 'banking', x: 604, y: 280, width: 216 },
  { id: 'instant-messaging', x: 904, y: 310, width: 236 },
  { id: 'e-commerce', x: 712, y: 413, width: 184 },
];
const height = card => 23 + card.width * 350 / 550 + 33;
const center = card => ({ x: card.x + card.width / 2, y: card.y + height(card) / 2 });
const connections = [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [2, 4], [3, 4]]
  .map(([a, b]) => `<line x1="${center(cards[a]).x}" y1="${center(cards[a]).y}" x2="${center(cards[b]).x}" y2="${center(cards[b]).y}"/>`).join('');
const previews = await Promise.all(cards.map(async (card, i) => {
  const site = catalog.find(site => site.id === card.id);
  const image = await sharp(publicFile(`previews/thumbnails/${card.id}.webp`)).png().toBuffer();
  const imageHeight = card.width * 350 / 550;
  return `<g transform="translate(${card.x} ${card.y})">
    <rect y="5" width="${card.width}" height="${height(card)}" rx="7" fill="${colors.ink}" opacity=".04"/>
    <rect width="${card.width}" height="${height(card)}" rx="7" fill="#fff" stroke="${colors.border}"/>
    <defs><clipPath id="preview-${i}"><rect x="1" y="23" width="${card.width - 2}" height="${imageHeight}"/></clipPath></defs>
    <g fill="${colors.connection}"><circle cx="12" cy="12" r="2.3"/><circle cx="21" cy="12" r="2.3"/><circle cx="30" cy="12" r="2.3"/></g>
    <image x="0" y="23" width="${card.width}" height="${imageHeight}" href="data:image/png;base64,${image.toString('base64')}" clip-path="url(#preview-${i})"/>
    <line x1="0" y1="${23 + imageHeight}" x2="${card.width}" y2="${23 + imageHeight}" stroke="${colors.soft}"/>
    <text x="12" y="${44 + imageHeight}" font-size="12" font-weight="700" fill="${colors.ink}">${xml(site.shortName || site.name)}</text>
  </g>`;
}));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${colors.dots}"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="${colors.background}"/>
  <rect x="580" width="620" height="630" fill="url(#dots)"/>
  <g font-family="Arial, Helvetica, sans-serif">
    ${logo}
    <text x="116" y="87" font-size="34" font-weight="700" letter-spacing="-1.4" fill="${colors.ink}">miniweb.</text>
    <text x="60" y="205" font-size="14" font-weight="700" letter-spacing="2.3" fill="${colors.accent}">WEB AGENT RESEARCH</text>
    <text x="56" y="279" font-size="60" font-weight="700" letter-spacing="-2.6" fill="${colors.ink}">Back to Basics:</text>
    <text x="59" y="337" font-size="39" font-weight="500" letter-spacing="-1.3" fill="${colors.accent}">Drills Before Games</text>
    <text x="59" y="386" font-size="39" font-weight="500" letter-spacing="-1.3" fill="${colors.accent}">for Web Agents</text>
    <line x1="60" y1="442" x2="531" y2="442" stroke="${colors.border}"/>
    <text x="60" y="484" font-size="24" font-weight="700" fill="${colors.ink}">65 websites.</text>
    <text x="60" y="518" font-size="24" fill="${colors.muted}">One connected world.</text>
    <text x="60" y="588" font-size="16" fill="${colors.muted}">minhphd.github.io/miniweb</text>
    <g stroke="${colors.connection}" stroke-width="1.5">${connections}</g>
    ${previews.join('')}
  </g>
</svg>`;

const output = publicFile('social-preview.png');
await sharp(Buffer.from(svg)).flatten({ background: colors.background }).png({ palette: true, quality: 95 }).toFile(output);
const metadata = await sharp(output).metadata();
console.log(`Social preview: ${metadata.width} × ${metadata.height} PNG`);
