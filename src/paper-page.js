import { paper, renderAuthors, resultRows, evaluations, sampleSizes, escapeHtml as escape } from './structure-content.js';

const link = (url, label, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
const heading = (label, title, description = '') => `<div class="paper-section-heading"><p class="paper-eyebrow">${label}</p><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</div>`;

export function renderPaperIntro() {
  return `<section class="paper-intro" aria-labelledby="page-title">
    <h1 id="page-title">Back to Basics:<br /><span>Drills Before Games for Web Agents</span></h1>
    <p class="paper-authors">${renderAuthors()}</p>
    <p class="paper-affiliations">${paper.affiliations}</p>
    <nav class="paper-links" aria-label="Paper resources">
      ${link(paper.overleaf, 'Paper draft', 'paper-link primary')}
      ${link(paper.code, 'Code', 'paper-link')}
      ${link(paper.data, 'Dataset', 'paper-link')}
    </nav>
  </section>`;
}

export function renderPaperSections() {
  return `<div class="paper-content">
    <section class="paper-section" id="overview" aria-labelledby="overview-title">
      <div class="paper-section-heading"><h2 id="overview-title">Drills before games.</h2><p>Measure the skills. Practice them directly. Give the agent a way to compose them.</p></div>
      <dl class="paper-stats"><div><dt>65</dt><dd>synthetic websites</dd></div><div><dt>37</dt><dd>interaction primitives</dd></div><div><dt>376</dt><dd>human-authored tasks</dd></div><div><dt>3.1K</dt><dd>verified trajectories</dd></div></dl>
      <div class="paper-pillars">
        <article><span>01 / THE ENVIRONMENT</span><h3>MiniWeb</h3><p>65 websites built around reusable interactions. Each task carries skill-level labels and verdicts, showing where an agent struggles.</p></article>
        <article><span>02 / THE PRACTICE</span><h3>MiniWebGen</h3><p>3,128 verified single-primitive trajectories generated on 52 training websites, for targeted practice on the building blocks of web tasks.</p></article>
        <article><span>03 / THE COMPOSITION</span><h3>MiniWebAgent</h3><p>An untrained planner delegates short skill-level instructions to a trained executor, turning practiced skills into completed tasks.</p></article>
      </div>
    </section>
    <section class="paper-section paper-summary" id="summary" aria-labelledby="summary-title">
      <div class="paper-section-heading"><p class="paper-eyebrow">RESEARCH SUMMARY</p><h2 id="summary-title">What should a small<br />web agent practice?</h2></div>
      <div class="paper-prose"><p>Compact web agents have limited training budgets. MiniWeb asks whether those budgets should go toward more complete tasks or toward the reusable skills that tasks are built from.</p><p>The benchmark contains 65 synthetic websites and 376 human-authored tasks built from 37 interaction primitives. Skill-level evaluation exposes weaknesses hidden by aggregate scores: drag & gesture is the weakest family for every one of the ten evaluated agents.</p><p>Training on MiniWebGen’s targeted trajectories improves isolated skills, but does not by itself improve full-task success. MiniWebAgent adds an explicit planner that composes the trained skills, improving performance on held-out sites and three external benchmarks without target-benchmark training.</p></div>
    </section>
    <section class="paper-section" id="method" aria-label="Method">
      ${heading('THE METHOD', 'Practice the skills.<br />Plan the whole task.', 'MiniWebGen creates verified practice. MiniWebAgent makes that practice useful at task time.')}
      <div class="paper-method-flow"><article><span>TRAINING / MINIWEBGEN</span><h3>Generate and verify.</h3><p>Summarize → Sample → Suggest → Execute → Gate</p><small>3,128 verified trajectories · 52 training sites</small></article><span class="paper-flow-arrow" aria-hidden="true">→</span><article><span>INFERENCE / MINIWEBAGENT</span><h3>Delegate and execute.</h3><p>Task → Planner → Skill instruction → Executor</p><small>One base model · one trained adapter</small></article></div>
      <figure class="paper-method-figure"><a href="${import.meta.env.BASE_URL}research/method.webp" target="_blank" rel="noopener"><img src="${import.meta.env.BASE_URL}research/method.webp" width="1800" height="671" alt="MiniWebGen generates and verifies skill trajectories. An untrained planner delegates primitive-level instructions to a trained LoRA executor." loading="lazy" /></a><figcaption>The data-generation pipeline and planner–executor architecture. Open the figure to inspect the details. ↗</figcaption></figure>
    </section>
    <section class="paper-section" id="results" aria-label="Results">
      ${heading('RESULTS & TRANSFER', 'The gains travel beyond<br />the training sites.', 'Task success (%) with Qwen3.5-4B. No held-out-site or target-benchmark trajectories are used for training.')}
      <p class="paper-finding">Skill training alone leaves full-task success at <strong>37.0%</strong>. With a planner, MiniWebAgent reaches <strong>54.5%</strong> on the held-out MiniWeb tasks.</p>
      <div class="paper-results-chart"><div class="paper-chart-heading"><label for="paper-benchmark">Evaluation</label><select id="paper-benchmark">${evaluations.map((name, i) => `<option value="${i}">${name}</option>`).join('')}</select><span id="paper-evaluation-scope"></span></div><div id="paper-result-bars"></div><p class="paper-axis-label">TASK SUCCESS · 0–100%</p></div>
      <details class="paper-details"><summary>Full comparison table</summary><div class="paper-table-scroll" tabindex="0" role="region" aria-label="Task success comparison"><table><caption>Task success (%) · current manuscript, Table 2</caption><thead><tr><th scope="col">Configuration</th>${evaluations.map((name, i) => `<th scope="col">${name}<small>${sampleSizes[i]} tasks</small></th>`).join('')}</tr></thead><tbody>${resultRows.map(row => `<tr class="${row.ours ? 'ours' : ''}"><th scope="row">${row.name}<small>${row.detail}</small></th>${row.values.map(v => `<td>${v.toFixed(1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
      <details class="paper-details"><summary>Evaluation scope and limitations</summary><div class="paper-prose"><p>The MiniWeb evaluation uses 63 human-authored tasks from 13 held-out sites. Live-web evaluations exclude tasks that are impossible or blocked by the evaluation network. Planning alone is a meaningful baseline; gains over the untrained single agent combine planning and skill training.</p><p>The study focuses on compact open-weight models. It does not evaluate closed-source frontier agents or training-data scaling, and it does not fully resolve drag & gesture failures. See the manuscript for repeated-run protocols and statistical tests. Results reflect the current draft.</p></div></details>
    </section>
    <section class="paper-section paper-citation-section" id="citation" aria-label="Citation">
      <div class="paper-section-heading"><p class="paper-eyebrow">REFERENCE</p><h2>Cite this work.</h2><p>Draft citation; final publication metadata is pending.</p></div><div><div class="paper-citation-toolbar"><span>BIBTEX</span><button id="copy-paper-citation">Copy citation ↗</button><span id="paper-copy-status" role="status"></span></div><pre id="paper-citation-text"></pre></div>
    </section>
  </div>`;
}

export function initializePaperSections() {
  const selector = document.getElementById('paper-benchmark');
  const renderResults = () => {
    const index = Number(selector.value);
    document.getElementById('paper-evaluation-scope').textContent = `${sampleSizes[index]} tasks${index === 0 ? ' · 13 held-out sites' : ''}`;
    document.getElementById('paper-result-bars').innerHTML = resultRows.map(row => `<div class="paper-result-row ${row.ours ? 'ours' : ''}"><div><strong>${row.name}</strong><small>${row.detail}</small></div><div class="paper-result-track"><span style="width:${row.values[index]}%"></span></div><b>${row.values[index].toFixed(1)}%</b></div>`).join('');
  };
  selector.addEventListener('change', renderResults);
  renderResults();
  const citation = `@misc{miniweb_draft,\n  title = {Back to Basics: Drills Before Games for Web Agents},\n  author = {Pham-Dinh, Minh and Ishmam, Md Farhan and\n    Yupanqui, Hernan and Joarder, Reaz Hassan and Marino, Kenneth},\n  note = {Manuscript draft; publication details pending}\n}`;
  const citationElement = document.getElementById('paper-citation-text');
  citationElement.textContent = citation;
  document.getElementById('copy-paper-citation').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(citation); document.getElementById('paper-copy-status').textContent = 'Copied'; }
    catch {
      const range = document.createRange(); range.selectNodeContents(citationElement);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.getElementById('paper-copy-status').textContent = 'Selected — use Copy';
    }
  });
}
