// Shared visual choices. The published selection lives in design-theme.js.
export const fonts = [
  { id: 'manrope', name: 'Manrope + DM Sans', heading: "'Manrope', sans-serif", body: "'DM Sans', sans-serif", description: 'Soft geometry, familiar warmth. The initial MiniWeb pairing.' },
  { id: 'space', name: 'Space Grotesk + Inter', heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", description: 'Distinctive, technical headings with a quiet, precise body.' },
  { id: 'jakarta', name: 'Plus Jakarta Sans + Inter', heading: "'Plus Jakarta Sans', sans-serif", body: "'Inter', sans-serif", description: 'Open, friendly letterforms with a polished product feel.' },
  { id: 'plex', name: 'IBM Plex Sans', heading: "'IBM Plex Sans', sans-serif", body: "'IBM Plex Sans', sans-serif", description: 'Humanist detail and the clarity of a research tool.' },
  { id: 'sora', name: 'Sora + Inter', heading: "'Sora', sans-serif", body: "'Inter', sans-serif", description: 'Wide, confident shapes that give the network a playful voice.' },
  { id: 'newsreader', name: 'Newsreader + Inter', heading: "'Newsreader', Georgia, serif", body: "'Inter', sans-serif", description: 'An editorial serif for a more thoughtful, story-led web.' },
  { id: 'instrument', name: 'Instrument Serif + DM Sans', heading: "'Instrument Serif', Georgia, serif", body: "'DM Sans', sans-serif", description: 'Expressive, elegant display type with a restrained companion.' },
  { id: 'mono', name: 'IBM Plex Mono + Sans', heading: "'IBM Plex Mono', monospace", body: "'IBM Plex Sans', sans-serif", description: 'A systematic, code-adjacent character with readable details.' },
];

export const accents = [
  { id: 'paper-blue', name: 'Paper blue', accent: '#2E5F9E', soft: '#EAF2FF', background: '#F8FAFE', ink: '#14233D', muted: '#546073' },
  { id: 'forest', name: 'Forest', accent: '#326648', soft: '#DBECBE', background: '#FAFBF8', ink: '#20382D' },
  { id: 'indigo', name: 'Indigo', accent: '#5146A4', soft: '#E8E3FC', background: '#FAF9FE', ink: '#28213E' },
  { id: 'cobalt', name: 'Cobalt', accent: '#2356BA', soft: '#DAE8FF', background: '#F8FAFF', ink: '#1F2E49' },
  { id: 'terracotta', name: 'Terracotta', accent: '#A5442E', soft: '#F5DED1', background: '#FFFAF6', ink: '#412B23' },
  { id: 'plum', name: 'Plum', accent: '#87416D', soft: '#F0DAE8', background: '#FCF8FB', ink: '#402536' },
  { id: 'teal', name: 'Teal', accent: '#176E70', soft: '#D0EEEA', background: '#F7FCFB', ink: '#213D3A' },
  { id: 'monochrome', name: 'Graphite', accent: '#414147', soft: '#E5E5E9', background: '#FAFAFA', ink: '#242429' },
  { id: 'olive', name: 'Olive', accent: '#66642A', soft: '#EAE9C5', background: '#FCFCF5', ink: '#343720' },
];

const svg = (content) => `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;

export const logos = [
  {
    id: 'network', name: 'Connected', description: 'Individual places, one connected world.',
    svg: svg('<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 33 14v13L20 35 7 27V14L20 6Zm0 0v15m0 0 13-7M20 21l-13-7m13 7v14M7 27l13-6 13 6"/><circle cx="20" cy="6" r="2.7" fill="currentColor"/><circle cx="33" cy="14" r="2.7" fill="currentColor"/><circle cx="33" cy="27" r="2.7" fill="currentColor"/><circle cx="20" cy="35" r="2.7" fill="currentColor"/><circle cx="7" cy="27" r="2.7" fill="currentColor"/><circle cx="7" cy="14" r="2.7" fill="currentColor"/><circle cx="20" cy="21" r="3.2" fill="currentColor"/></g>'),
  },
  {
    id: 'orbit', name: 'Small world', description: 'A globe reduced to a few memorable lines.',
    svg: svg('<g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="20" cy="20" r="13.5"/><ellipse cx="20" cy="20" rx="5.8" ry="13.5" transform="rotate(28 20 20)"/><ellipse cx="20" cy="20" rx="19" ry="6.5" transform="rotate(-28 20 20)"/><path d="M8.5 13h23M8.5 27h23"/></g><circle cx="34.6" cy="10.8" r="2.8" fill="currentColor"/>'),
  },
  {
    id: 'windows', name: 'Open tabs', description: 'The familiar browser, brought together.',
    svg: svg('<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7h22a2 2 0 0 1 2 2v18M4 14a2 2 0 0 1 2-2h23a2 2 0 0 1 2 2v19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14Z"/><path d="M4 19h27M9 15.5h.1m3.5 0h.1M10 29l4-4 4 4 6-6"/></g>'),
  },
  {
    id: 'monogram', name: 'Mini m', description: 'A compact letterform built from two paths.',
    svg: svg('<path d="M6 31V16.5a6.5 6.5 0 0 1 13 0V31M21 31V16.5a6.5 6.5 0 0 1 13 0V31" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="6" cy="6" r="2.2" fill="currentColor"/><circle cx="34" cy="6" r="2.2" fill="currentColor"/>'),
  },
  {
    id: 'pixels', name: 'Nine places', description: 'A tiny grid with room for something new.',
    svg: svg('<g fill="currentColor"><rect x="5" y="5" width="8" height="8" rx="1.3"/><rect x="16" y="5" width="8" height="8" rx="1.3"/><rect x="27" y="5" width="8" height="8" rx="1.3"/><rect x="5" y="16" width="8" height="8" rx="1.3"/><rect x="16" y="16" width="8" height="8" rx="1.3"/><rect x="27" y="16" width="8" height="8" rx="1.3"/><rect x="5" y="27" width="8" height="8" rx="1.3"/><rect x="16" y="27" width="8" height="8" rx="1.3"/></g><rect x="27.9" y="27.9" width="6.2" height="6.2" rx=".8" stroke="currentColor" stroke-width="1.8"/>'),
  },
];

export const layouts = [
  { id: 'center', name: 'Centered', description: 'A quiet introduction above a generous, central network.' },
  { id: 'editorial', name: 'Editorial', description: 'A large, left-aligned title with the network as the lead story.' },
  { id: 'split', name: 'Split screen', description: 'A focused introduction beside an immersive network canvas.' },
];

export const presets = [
  { id: 'original', name: 'The original', description: 'Calm, familiar, and quietly connected.', font: 'manrope', accent: 'forest', logo: 'network', layout: 'center' },
  { id: 'open-lab', name: 'Open lab', description: 'A crisp interface for curious exploration.', font: 'space', accent: 'cobalt', logo: 'orbit', layout: 'split' },
  { id: 'field-notes', name: 'Field notes', description: 'Warm editorial character, with room to discover.', font: 'newsreader', accent: 'terracotta', logo: 'windows', layout: 'editorial' },
  { id: 'soft-signal', name: 'Soft signal', description: 'Friendly shapes with a playful violet accent.', font: 'jakarta', accent: 'indigo', logo: 'monogram', layout: 'center' },
  { id: 'quiet-index', name: 'Quiet index', description: 'A precise, stripped-back map of the web.', font: 'mono', accent: 'monochrome', logo: 'pixels', layout: 'editorial' },
  { id: 'little-world', name: 'Little world', description: 'An expressive serif meets an intimate digital world.', font: 'instrument', accent: 'plum', logo: 'orbit', layout: 'split' },
];

export const fontsUrl = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap';
