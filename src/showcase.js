// The MiniWebGen and MiniWebAgent figures (data and screenshots from scripts/export_showcase.py); the human tasks have
// their own explorer (task-explorer.js).
import './showcase.css';
import data from './data/showcase.json';
import { initializeMiniWebGen } from './miniwebgen.js';
import { initializeMiniWebAgent } from './miniwebagent.js';

const captions = {
  generated: `<strong>MiniWebGen, one trajectory per skill family.</strong> Step through the five stages with real data: the guide distilled from human demonstrations, the sampled configuration, the instruction and its check, the script the coding LLM wrote and what it did, and the gate that keeps an attempt only if its check fails before and passes after.`,
  agent: `<strong>MiniWebAgent on held-out tasks.</strong> Replay a trace turn by turn: the planner sees the page but cannot act, so it hands each step to the trained executor, tagged with a skill family, and reads its report. Compare puts the same model and adapter acting alone beside it. The last task fails for both: neither sorts by clicks, so both report the wrong link.`,
};

export function initializeShowcases() {
  document.querySelectorAll('[data-showcase]').forEach(container => {
    const kind = container.dataset.showcase;
    container.innerHTML = `<div class="showcase-frame" tabindex="-1"></div><p class="paper-caption showcase-caption">${captions[kind]}</p>`;
    const root = container.querySelector('.showcase-frame');
    if (kind === 'generated') initializeMiniWebGen(root, data.generated);
    if (kind === 'agent') initializeMiniWebAgent(root, data.agent);
  });
}
