#!/usr/bin/env node
/** Encode 1100×700 browser captures into the small images used by the explorer. */
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/optimize-thumbnails.mjs <directory-with-site-id.png-captures>');
const root = fileURLToPath(new URL('../', import.meta.url));
const sites = JSON.parse(await readFile(resolve(root, 'src/data/sites.json'), 'utf8'));
const output = resolve(root, 'public/previews/thumbnails');
await mkdir(output, { recursive: true });

let totalBytes = 0;
for (const site of sites) {
  const input = resolve(source, `${site.id}.png`);
  const metadata = await sharp(input).metadata();
  if (metadata.width !== 1100 || metadata.height !== 700) {
    throw new Error(`${site.id}: expected an 1100×700 browser viewport capture.`);
  }
  const destination = resolve(output, `${site.id}.webp`);
  await sharp(input).resize(550, 350).webp({ quality: 76, effort: 6 }).toFile(destination);
  totalBytes += (await stat(destination)).size;
}
console.log(`Encoded ${sites.length} thumbnails: ${(totalBytes / 1024).toFixed(0)} KiB total.`);
