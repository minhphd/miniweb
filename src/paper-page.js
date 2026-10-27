import { paper, facts, renderAuthors, resultRows, evaluations, evaluationAbbreviations, sampleSizes, escapeHtml as escape } from './structure-content.js';
import { animate, countUp, playDumbbells, whenVisible } from './motion.js';

const asset = name => `${import.meta.env.BASE_URL}research/${name}`;
const external = (url, label, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const chip = (name, family) => `<code class="primitive fam-${family}">${name}</code>`;
// A skill family named in the text, as the paper sets it: bold, on the family's tint.
const fam = (id, text) => `<span class="fam-hl fam-${id}">${text}</span>`;
const takeaway = text => ` <span class="takeaway">Takeaway:</span> ${text}`;
const heading = (id, number, title) => `<h2 id="${id}-title"><a class="section-number" href="#${id}" aria-hidden="true" tabindex="-1">${number}</a>${title}</h2>`;
const pct = value => `${value.toFixed(1)}%`;
const list = values => values.length > 2 ? `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}` : values.join(' and ');
const icons = {
  paper: '<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  steps: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="m10 8 5 2.5-5 2.5Z"/><path d="M3 20h18"/><circle cx="9" cy="20" r="1.2"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

export const contents = [
  ['background', 'Background', 'Background'],
  ['miniweb', 'MiniWeb: Tasks Built From Primitives', 'MiniWeb'],
  ['diagnosis', 'Where Agents Fail', 'Where agents fail'],
  ['practice', 'Practicing Skills: MiniWebGen', 'MiniWebGen'],
  ['compose', 'Composing Skills: MiniWebAgent', 'MiniWebAgent'],
];

// Cited works, numbered in order of first use (from the paper's ref.bib).
const references = [
  ['WebArena: A Realistic Web Environment for Building Autonomous Agents', 'Shuyan Zhou et al. · 2023', 'https://arxiv.org/abs/2307.13854'],
  ['WebShop: Towards Scalable Real-World Web Interaction with Grounded Language Agents', 'Shunyu Yao et al. · 2022', 'https://arxiv.org/abs/2207.01206'],
  ['WebVoyager: Building an End-to-End Web Agent with Large Multimodal Models', 'Hongliang He et al. · 2024', 'https://arxiv.org/abs/2401.13919'],
  ['Mind2Web: Towards a Generalist Agent for the Web', 'Xiang Deng et al. · 2023', 'https://arxiv.org/abs/2306.06070'],
  ['An Illusion of Progress? Assessing the Current State of Web Agents', 'Tianci Xue et al. · 2025', 'https://arxiv.org/abs/2504.01382'],
  ['Fara-7B: An Efficient Agentic Model for Computer Use', 'Ahmed Awadallah et al. · 2025', 'https://arxiv.org/abs/2511.19663'],
  ['MolmoWeb: Open Visual Web Agent and Open Data for the Open Web', 'Tanmay Gupta et al. · 2026', 'https://arxiv.org/abs/2604.08516'],
  ['Browser Use: Enable AI to control your browser', 'Magnus Müller and Gregor Žunič · 2024', 'https://github.com/browser-use/browser-use'],
  ['InSTA: Towards Internet-Scale Training For Agents', 'Brandon Trabucco et al. · 2025', 'https://arxiv.org/abs/2502.06776'],
];
const cite = (...numbers) => numbers.map(n => `<a class="citation" href="#ref-${n}">[${n}]</a>`).join(' ');
const base = resultRows[0];
const ours = resultRows.find(row => row.ours);

// The title, set with a little play: "Basics" circled by hand, and highlighter swipes across "Skill-Centric" (drag &
// gesture's pink, dragged by a cursor that overshoots and corrects, as the agents do) and "Generalist" (the trained blue). The marks
// are CSS pseudo-elements, so the title reads and copies as plain text; they hold still for reduced motion.
function renderTitle() {
  const words = paper.title.match(/^(Back to )(Basics)(:)\s*(A )(Skill-Centric)( Approach to )(Generalist)( Web Agents)$/);
  if (!words) return `<h1 id="page-title">${escape(paper.title)}</h1>`;
  const [, back, basics, colon, lead, skill, middle, generalist, rest] = words;
  return `<h1 id="page-title" class="paper-title"><span class="title-lead">${back}<span class="title-basics">${basics}</span>${colon}</span> <span class="title-rest">${lead}<mark class="title-hl title-drills" style="--at:.35s">${skill}</mark>${middle}<mark class="title-hl title-games" style="--at:1.2s">${generalist}</mark>${rest}</span></h1>`;
}

export function renderPaperIntro() {
  const logo = (file, label) => `<img class="resource-logo" src="${asset(`logos/${file}`)}" width="18" height="18" alt="" />${label}`;
  return `<section class="paper-intro" aria-labelledby="page-title">
    ${renderTitle()}
    <p class="paper-authors">${renderAuthors()}</p>
    <p class="paper-affiliations">${paper.affiliations}</p>
    <div class="paper-front">
      <nav class="paper-toc" aria-labelledby="contents-title"><p id="contents-title">Contents</p><ol>${contents.map(([id, title]) => `<li><a href="#${id}">${title}</a></li>`).join('')}</ol></nav>
      <div class="paper-resources">
        ${external(paper.pdf, `<span class="bracket">[Paper]</span><span class="paper-stack"><img src="${asset('paper-preview.webp')}" width="288" height="373" alt="" /></span>`, 'paper-resource paper-resource-paper')}
        <ul>
          <li>${external(paper.code, logo('github.svg', '<span class="bracket">[Code]</span>'), 'paper-resource')}<small>github.com/miniweb-site/MiniWeb</small></li>
          <li>${external(paper.data, logo('huggingface.svg', '<span class="bracket">[Dataset]</span>'), 'paper-resource')}<small>tasks, demonstrations, and trajectories</small></li>
          <li>${external(paper.demo, `${icon('globe')}<span class="bracket">[Live websites]</span>`, 'paper-resource')}<small>all ${facts.sites} sites, running</small></li>
          <li><a class="paper-resource" href="./trajectories.html">${icon('steps')}<span class="bracket">[Agent trajectories]</span></a><small>every episode behind the results</small></li>
        </ul>
      </div>
    </div>
  </section>`;
}

function renderResultsTable() {
  const cell = (value, sig) => `<td class="${sig > 0 ? 'sig-up' : sig < 0 ? 'sig-down' : ''}">${value.toFixed(1)}${sig ? `<span class="sr-only">${sig > 0 ? ', significantly above' : ', significantly below'} the untrained row</span>` : ''}</td>`;
  let group = '';
  const rows = resultRows.map(row => {
    const header = row.group !== group ? `<tr class="table-group"><th colspan="5" scope="colgroup">${row.group}</th></tr>` : '';
    group = row.group;
    return `${header}<tr class="${row.ours ? 'ours' : ''}"><th scope="row" class="${row.trainedOn === 'nothing' ? 'untrained' : 'trained'}">${row.trainedOn}${row.ours ? '<span class="row-note">MiniWebAgent</span>' : ''}</th>${row.values.map((v, i) => cell(v, row.significance?.[i])).join('')}</tr>`;
  }).join('');
  return `<div class="paper-table-scroll" tabindex="0" role="region" aria-label="Task success by configuration"><table class="paper-table">
    <thead><tr><th scope="col"><span class="sr-only">Configuration</span></th>${evaluations.map((name, i) => `<th scope="col"><abbr title="${name}">${evaluationAbbreviations[i]}</abbr><small>${sampleSizes[i]} tasks</small></th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function renderGainChart() {
  const label = evaluations.map((name, i) => `${name}: ${pct(base.values[i])} to ${pct(ours.values[i])}`).join('; ');
  return `<div class="gain-chart" role="img" aria-label="Task success, untrained single agent to MiniWebAgent. ${label}.">
    <div class="gain-legend" aria-hidden="true"><span><i class="gain-dot base"></i>Single agent, untrained</span><span><i class="gain-dot ours"></i>MiniWebAgent</span><b>gain</b></div>
    ${evaluations.map((name, i) => `<div class="gain-row" aria-hidden="true"><span class="gain-label">${name}<small>${sampleSizes[i]} tasks</small></span><span class="gain-track"><i class="gain-link" style="left:${base.values[i]}%;width:${ours.values[i] - base.values[i]}%"></i><i class="gain-dot base" style="left:${base.values[i]}%"></i><i class="gain-dot ours" style="left:${ours.values[i]}%"></i></span><b class="gain-value">+${facts.gainOverBase[i].toFixed(1)}</b></div>`).join('')}
    <div class="gain-axis" aria-hidden="true"><span></span><span class="gain-ticks"><i style="left:0">0</i><i style="left:25%">25</i><i style="left:50%">50</i><i style="left:75%">75</i><i style="left:100%">100%</i></span><span></span></div>
    <p class="gain-axis-label" aria-hidden="true">task success</p>
  </div>`;
}

export function renderPaperSections() {
  return `<nav class="paper-rail" aria-label="Sections">${contents.map(([id, , short], i) => `<a href="#${id}" data-rail="${id}"><span class="rail-number">${i + 1}</span><span class="rail-label">${short}</span></a>`).join('')}</nav>
  <div class="paper-content">
    <div class="paper-tldr"><p class="tldr-label">In short</p><ol>
      <li>${fam('drag', 'Drag &amp; gesture')} is the weakest skill family of every web agent we tested.</li>
      <li>Practicing skills in isolation makes an agent better at each skill, <em>but not at whole tasks.</em></li>
      <li>A planner that hands the agent one practiced skill at a time turns those skills into task success, on websites and benchmarks it never trained on.</li>
    </ol></div>
    <p class="paper-mode">Each section leads with its claim, key numbers, and interactive figures; fold the text to skim. <button class="text-toggle" data-text-toggle aria-pressed="true">Fold all text</button></p>

    <section class="paper-section" id="background" aria-labelledby="background-title">
      ${heading('background', 1, 'Background')}
      <p class="section-claim">Compact web agents cannot rely on scale alone, so what they practice matters.</p>
      <details class="paper-more" open><summary><span class="more-label">Fold the section</span><span class="more-time"></span></summary><div class="paper-more-body">
      <p>What makes humans such effective generalists? Before learning to ride a bike, we have spent years learning to balance, coordinate our limbs, and recover from mistakes. New tasks become easier because they reuse skills we have practiced in many other settings.</p>
      <p>Web agents are mostly trained differently: by scaling end-to-end task experience across more websites, harder tasks, and more solution strategies ${cite(6, 7)}. Large models can benefit from that scale, but compact open-weight agents have limited capacity and training budgets, so what they practice matters.</p>
      <p>This page walks through the paper’s answer, with the ${facts.sites} websites above and real tasks, trajectories, and agent traces below. Unless noted, the agent is Qwen3.5-4B.</p>
      </div></details>
      <figure class="paper-question"><figcaption class="question-label">The question</figcaption>
        <blockquote><p>Should a small web agent spend its training budget on <mark class="question-hl question-games">more complete tasks</mark>, or on <mark class="question-hl question-drills">the reusable interaction skills</mark> those tasks are built from?</p>
          <p class="question-answer">Our answer: practice the skills directly, then compose them (<a href="#practice">Sections 4</a> and <a href="#compose">5</a>).</p></blockquote>
      </figure>
    </section>

    <section class="paper-section" id="miniweb" aria-labelledby="miniweb-title">
      ${heading('miniweb', 2, 'MiniWeb: Tasks Built From Primitives')}
      <p class="section-claim">Tasks built from reusable skills, so <em>a failed task shows which skill was missing.</em></p>
      <ul class="key-numbers" aria-label="Key numbers"><li class=""><b data-count="${facts.sites}" data-format="int">${facts.sites}</b><span>websites in ${facts.domains} domains</span></li><li class=""><b data-count="${facts.primitives}" data-format="int">${facts.primitives}</b><span>primitives in ${facts.families} skill families</span></li><li class=""><b data-count="${facts.tasks}" data-format="int">${facts.tasks}</b><span>human tasks, ${facts.crossSiteTasks} of them across sites</span></li><li class=""><b data-count="${facts.judgeAccuracy}" data-format="pct1">${pct(facts.judgeAccuracy)}</b><span>of task outcomes graded right by the judge, in a human audit</span></li></ul>
      <details class="paper-more" open><summary><span class="more-label">Fold the section</span><span class="more-time"></span></summary><div class="paper-more-body">
      <p>Benchmarks such as WebArena ${cite(1)}, WebVoyager ${cite(3)}, and Online-Mind2Web ${cite(5)} grade whole tasks, so a failed task does not say which skill was missing. We build <strong class="product">MiniWeb</strong> the other way round, from the skills up.</p>
      <p>We first labeled 15.7K tasks from WebArena, WebShop, WebVoyager, and Mind2Web ${cite(1, 2, 3, 4)} with the interactions they require. Only 0.3% of the 52K labels involve dragging, and none involve drawing, uploading a file, or editing a spreadsheet cell. After merging near-duplicates, adding the missing interactions, and dropping those annotators rarely used, we keep ${facts.primitives} reusable <em>primitives</em>, such as ${chip('filter_by_slider', 'drag')} or ${chip('edit_by_cell', 'text')}, in ${facts.families} skill families: ${fam('drag', 'drag &amp; gesture')}, ${fam('select', 'discrete selection')}, ${fam('text', 'text entry')}, ${fam('form', 'form transaction')}, ${fam('nav', 'navigation')}, ${fam('io', 'out-of-page I/O')}, and ${fam('reason', 'reasoning')}.</p>
      <p>We then built ${facts.sites} websites in ${facts.domains} domains around those primitives (explore them above), and six annotators composed them into ${facts.tasks} tasks, ${facts.crossSiteTasks} of them cross-site, in a web tool served next to the sites. For each task, they design a graph of primitives, write the instruction, record a demonstration, mark the span of every primitive, and build a verifier with one check per primitive.</p>
      <p>Because each primitive has its own verifier, <em>a failed task shows which skill was missing.</em> Browse all ${facts.tasks} tasks below by how many primitives they chain and whether they stay on one site.</p>
      <p>Parameterized verifiers check the backend request log, and a VLM judge checks semantic and reasoning outcomes. Both are close to human judgment: in an audit of 120 agent episodes, the judge is right on 92.2% of task outcomes, near the agreement between two human labelers.</p>
      </div></details>
      <figure class="paper-wide band" data-figure="primitives"><figcaption class="paper-caption"><strong>The ${facts.primitives} primitives.</strong> Each is a site-agnostic interaction with one purpose, listed by skill family with its number of instances in the human tasks. The span marks where an instance starts and ends in a demonstration; the guide is what MiniWebGen distilled from the human demonstrations of that primitive on the training sites (Section 4).</figcaption></figure>
      <figure class="paper-wide band" data-figure="annotation"><figcaption class="paper-caption"><strong>The annotation tool.</strong> Its four steps, from planning to review; select a part to spotlight it, or open a screenshot at full size. The task editor and verifier builder show the same SnapLink task as the examples below. Screenshots from the paper’s supplementary material, taken during annotation: the counts on them predate the final ${facts.tasks} tasks.</figcaption></figure>
      <figure class="paper-wide band" id="task-showcase" data-figure="tasks"><figcaption class="paper-caption"><strong>The ${facts.tasks} human tasks.</strong> Choose a cell of the grid to see the tasks with that many primitives on one site or across several, or a row or column for all of them; filter by sites, skill family, or text. Each task chains primitives: the bars mark the actions of the human demonstration that each primitive spans, and each primitive has its own check. About three tasks per cell show the annotator’s screenshots; the dataset holds every recording. Use the arrow keys to move through the list (up and down) or the steps (left and right).</figcaption></figure>
    </section>

    <section class="paper-section" id="diagnosis" aria-labelledby="diagnosis-title">
      ${heading('diagnosis', 3, 'Where Agents Fail')}
      <p class="section-claim">${fam('drag', 'Drag &amp; gesture')} is the weakest skill family of every agent we tested.</p>
      <ul class="key-numbers" aria-label="Key numbers"><li class="is-drag"><b data-count="${facts.dragPooled}" data-format="pct1">${pct(facts.dragPooled)}</b><span>drag success, pooled over the ${facts.agents} agents, against ${pct(facts.nextWeakestPooled)} for the next-weakest family</span></li><li class="is-drag"><b data-count="${facts.dragBest}" data-format="pct0">${facts.dragBest}%</b><span>the best agent on drag</span></li><li class=""><b data-count="${facts.dragFailuresAtGesture}" data-format="pct0">${facts.dragFailuresAtGesture}%</b><span>of failed drags reach the control, then fail at the gesture</span></li><li class=""><b data-count="${facts.dragWebAgents}" data-format="pct1">${pct(facts.dragWebAgents)}</b><span>drag success of web agents, against ${pct(facts.dragGeneral)} for general models</span></li></ul>
      <details class="paper-more" open><summary><span class="more-label">Fold the section</span><span class="more-time"></span></summary><div class="paper-more-body">
      <p>We evaluated ${facts.agents} open-weight agents on all ${facts.tasks} tasks: four general VLMs in the browser-use harness ${cite(8)} and six web or computer-use agents in their own agent loops, including Fara ${cite(6)} and MolmoWeb ${cite(7)}. <em>${fam('drag', 'Drag &amp; gesture')} is the weakest skill family for every one of them.</em> Pooled across agents, drag succeeds on ${pct(facts.dragPooled)} of instances, against ${pct(facts.nextWeakestPooled)} for the next-weakest family, and no agent passes more than ${facts.dragBest}%.</p>
      <p>Web and computer-use agents are worse at dragging than general models (9.0% vs. 18.0% on average), even though they are better at typing. In ${facts.dragFailuresAtGesture}% of failed drags, the agent reaches the right slider or canvas and then fails at the gesture itself: the drag is planned open-loop from one screenshot, and the resulting value only shows after release.</p>
      <p>These weaknesses compound. Every primitive in a chain must succeed, so an <i>n</i>-primitive task succeeds at roughly <i>p<sup>n</sup></i>, where <i>p</i>&nbsp;=&nbsp;62% is the agents’ mean success on one-primitive tasks. Modest gains on each primitive add up over a task, and that is what targeted practice aims for.</p>
      </div></details>
      <figure class="paper-wide band" data-figure="skill-profiles"><figcaption class="paper-caption"><strong>Skill profiles of the ${facts.agents} untrained agents.</strong> The share of primitive instances each agent passes per skill family on all ${facts.tasks} tasks, judged by the VLM judge; one run per agent (paper Table 2).${takeaway(`every agent is weakest at ${fam('drag', 'drag &amp; gesture')}, the shaded axis.`)}</figcaption></figure>
    </section>

    <section class="paper-section" id="practice" aria-labelledby="practice-title">
      ${heading('practice', 4, 'Practicing Skills: MiniWebGen')}
      <p class="section-claim">Practice lifts every skill, <em>but not whole tasks.</em></p>
      <ul class="key-numbers" aria-label="Key numbers"><li class=""><b data-count="${facts.trajectories}" data-format="int">${facts.trajectories.toLocaleString('en-US')}</b><span>verified trajectories, about $${facts.costPerTrajectory} each</span></li><li class="is-gain"><b data-count="${facts.singlePrimitive[1]}" data-format="pct1">${pct(facts.singlePrimitive[1])}</b><span>single-primitive success after practice, up from ${pct(facts.singlePrimitive[0])}</span></li><li class="is-flat"><b data-count="${resultRows[1].values[0]}" data-format="pct1">${pct(resultRows[1].values[0])}</b><span>full-task success after practice, from ${pct(base.values[0])}</span></li></ul>
      <details class="paper-more" open><summary><span class="more-label">Fold the section</span><span class="more-time"></span></summary><div class="paper-more-body">
      <p>Human demonstrations are expensive, so <strong class="product">MiniWebGen</strong> turns a few of them into many verified single-primitive trajectories on the ${facts.trainingSites} training sites. For each primitive, an LLM summarizes the human demonstrations into a site-agnostic guide (every guide is in the <a href="#miniweb">catalog above</a>). MiniWebGen then samples a site, a control, and an argument, phrases an instruction, and has a coding LLM carry it out with mouse and keyboard events only. The check that decides success is never written by the LLM, and an attempt is kept only if the check fails before the attempt and passes after it.</p>
      <p>With Gemini 3.5 Flash, this yields ${facts.trajectories.toLocaleString('en-US')} trajectories at about $0.04 each. Follow one trajectory per skill family through the five stages below, from its guide to the gate that kept it.</p>
      <p>Training on them works at the skill level: on ${facts.singlePrimitiveTasks} generated single-primitive tasks from the ${facts.heldOutSites} held-out sites, success rises from ${pct(facts.singlePrimitive[0])} to ${pct(facts.singlePrimitive[1])}, with gains in every skill family. <em>But full-task success barely moves</em>, from ${pct(base.values[0])} to ${pct(resultRows[1].values[0])} on the ${facts.heldOutTasks} held-out human tasks, and it drops on all three external benchmarks. The agent practiced one-primitive episodes whose instructions name the skill, so on a real task it often stops after the first primitive.</p>
      </div></details>
      <figure class="paper-figure paper-wide band pdf-figure">
        <a href="${asset('method.pdf')}" target="_blank" rel="noopener" data-pdf="${asset('method.pdf')}" aria-label="Open the method figure as a PDF"><img src="${asset('method.svg')}" width="1800" height="819" alt="MiniWebGen, left: human demonstrations are summarized into a site-agnostic guide, then each trajectory is sampled, suggested, executed and gated by a backend check. MiniWebAgent, right: an untrained planner delegates step-level instructions to a pooled LoRA executor on a held-out SnapLink task." loading="lazy" decoding="async" /></a>
        <figcaption class="paper-caption"><strong>MiniWebGen</strong> (left) generates and gates single-primitive trajectories (real ShopHub example). <strong>MiniWebAgent</strong> (right): an untrained Qwen3.5-4B planner hands each step to one trained LoRA executor (real held-out trace).${takeaway('the executor practices one primitive at a time, and the planner gives it instructions of that kind.')}</figcaption>
      </figure>
      <div class="showcase paper-wide band" id="generated-showcase" data-showcase="generated"></div>
      <figure class="paper-wide band" data-figure="skill-improvement" data-view="single" data-compare="practice"><figcaption class="paper-caption"><strong>Skill improvement.</strong> Switch between single primitives, primitives inside full tasks, and task success by task length, and between practice (the single agent before and after training), composition (the planner with an untrained or a trained executor), and both. Computed with the paper’s own figure code from the runs behind Figs. 6–7 and Table 3; the gains are rounded from unrounded rates.</figcaption></figure>
    </section>

    <section class="paper-section" id="compose" aria-labelledby="compose-title">
      ${heading('compose', 5, 'Composing Skills: MiniWebAgent')}
      <p class="section-claim">A planner turns the practiced skills into task success.</p>
      <ul class="key-numbers" aria-label="Key numbers"><li class="is-gain"><b data-count="${facts.gainOverBase[0]}" data-format="gain">+${facts.gainOverBase[0].toFixed(1)}</b><span>points on held-out MiniWeb sites</span></li><li class="is-gain"><b data-count="${facts.gainOverBase[1]}" data-format="gain">+${facts.gainOverBase[1].toFixed(1)}</b><span>on WebArena-Lite</span></li><li class="is-gain"><b data-count="${facts.gainOverBase[2]}" data-format="gain">+${facts.gainOverBase[2].toFixed(1)}</b><span>on WebVoyager</span></li><li class="is-gain"><b data-count="${facts.gainOverBase[3]}" data-format="gain">+${facts.gainOverBase[3].toFixed(1)}</b><span>on Online-Mind2Web, all without target-benchmark training</span></li></ul>
      <details class="paper-more" open><summary><span class="more-label">Fold the section</span><span class="more-time"></span></summary><div class="paper-more-body">
      <p><strong class="product">MiniWebAgent</strong> closes this gap with a planner. One Qwen3.5-4B serves as both planner and executor. The untrained planner sees the page but cannot act: each turn, it hands a short skill-level instruction to the executor, the same model with one LoRA adapter trained on the generated data, or returns the answer. The executor now receives exactly the kind of instruction it practiced. Replay a held-out task turn by turn below, or compare it with the same model acting alone.</p>
      <p><em>With a planner, the practiced skills turn into task success.</em> MiniWebAgent gains ${facts.gainOverBase[0].toFixed(1)} points over the untrained single agent on the held-out MiniWeb sites, and ${list(facts.gainOverBase.slice(1).map(v => v.toFixed(1)))} points on WebArena-Lite, WebVoyager, and Online-Mind2Web, without training on any target-benchmark trajectory. Planning alone helps most on WebVoyager, and the trained executor improves on the untrained planner on all four evaluations.</p>
      <p>Inside the held-out tasks, the trained executor lifts every skill family under the planner, and the advantage grows with the length of the task: on tasks of three or more primitives, MiniWebAgent more than doubles the success of the untrained single agent.</p>
      <p>Is it the skills, or simply more web data? We also trained the same executor on a size-matched set of task-centric trajectories, collected on our training sites with InSTA’s pipeline ${cite(9)}. <em>Our skill data transfers further:</em> it beats the task-centric executor by ${list(facts.gainOverTaskCentric.map(v => v.toFixed(1)))} points on the four evaluations.</p>
      </div></details>
      <div class="showcase paper-wide band" id="agent-showcase" data-showcase="agent"></div>
      <div class="paper-results paper-wide band">
        <figure class="paper-table-figure">
          ${renderResultsTable()}
          <figcaption class="paper-caption"><strong>Composing trained skills raises task success.</strong> Task success (%) of Qwen3.5-4B on MiniWeb’s ${facts.heldOutSites} held-out sites, WebArena-Lite (WA-Lite), WebVoyager (WV), and Online-Mind2Web (OM2W), as a single agent or as a planner whose executor is untrained or trained at matched size on task-centric trajectories or on MiniWebGen’s skill-centric trajectories. Green (red): significantly above (below) the untrained row of the group, <i>p</i>&nbsp;&lt;&nbsp;0.05.${takeaway('our data raises task success only under the planner, where it beats all baselines on every benchmark.')}</figcaption>
        </figure>
        <figure class="paper-chart-figure">
          ${renderGainChart()}
          <figcaption class="paper-caption"><strong>MiniWebAgent improves on every evaluation.</strong> Task success of Qwen3.5-4B as an untrained single agent (grey) and as MiniWebAgent (blue), with the gain in points at the right, computed before rounding.</figcaption>
        </figure>
      </div>
      <figure class="paper-wide band" data-figure="skill-improvement" data-view="inside" data-compare="composition"><figcaption class="paper-caption"><strong>Skill improvement.</strong> Switch between single primitives, primitives inside full tasks, and task success by task length, and between practice (the single agent before and after training), composition (the planner with an untrained or a trained executor), and both. Computed with the paper’s own figure code from the runs behind Figs. 6–7 and Table 3; the gains are rounded from unrounded rates.</figcaption></figure>
      <p class="paper-recipe">A simple recipe for compact browser agents: <strong>practice reusable skills directly, then compose them to solve unfamiliar tasks.</strong></p>
    </section>

    <section class="paper-section paper-references" id="references" aria-labelledby="references-title">
      <h2 id="references-title">References</h2>
      <ol>${references.map(([title, authors, url], i) => `<li id="ref-${i + 1}"><span class="ref-number">[${i + 1}]</span><div>${external(url, escape(title))}<small>${escape(authors)}</small></div></li>`).join('')}</ol>
    </section>

    <section class="paper-section paper-citation-section" id="citation" aria-labelledby="citation-title">
      <h2 id="citation-title">BibTeX</h2>
      <div class="paper-citation"><button id="copy-paper-citation" aria-label="Copy BibTeX" title="Copy BibTeX"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="1.5"/><path d="M16 8V4H4v13h4"/></svg></button><span id="paper-copy-status" role="status"></span><pre id="paper-citation-text"></pre></div>
      <p class="paper-caption">Draft citation; publication details are pending.</p>
    </section>
  </div>`;
}

/** The sections' text, shown by default: a reading time on each, one switch to fold or show all of it (remembered in
    this browser), and a gentle reveal when a reader opens one. The key numbers count up as they come into view. */
function initializeFolds() {
  const folds = [...document.querySelectorAll('.paper-more')];
  const toggle = document.querySelector('[data-text-toggle]');
  const key = 'miniweb-text-open';
  const loaded = performance.now();
  folds.forEach(fold => {
    const words = fold.querySelector('.paper-more-body').textContent.trim().split(/\s+/).length;
    fold.querySelector('.more-time').textContent = `${Math.max(1, Math.round(words / 230))} min · ${words} words`;
    fold.addEventListener('toggle', () => {
      if (fold.open && performance.now() - loaded > 1000) animate(fold.querySelector('.paper-more-body'), [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 320 });
      fold.querySelector('.more-label').textContent = fold.open ? 'Fold the section' : 'Read the section';
      const all = folds.every(f => f.open);
      toggle.textContent = all ? 'Fold all text' : 'Show all text';
      toggle.setAttribute('aria-pressed', String(all));
    });
  });
  const setAll = open => folds.forEach(fold => { fold.open = open; });
  toggle.addEventListener('click', () => {
    const open = !folds.every(f => f.open);
    setAll(open);
    try { localStorage.setItem(key, open ? '1' : '0'); } catch { /* the choice just is not remembered */ }
  });
  try { if (localStorage.getItem(key) === '0') setAll(false); } catch { /* storage unavailable: shown */ }
  addEventListener('beforeprint', () => setAll(true));           // a printout carries the whole text
  const formats = { int: v => Math.round(v).toLocaleString('en-US'), pct0: v => `${Math.round(v)}%`, pct1: v => `${v.toFixed(1)}%`, gain: v => `+${v.toFixed(1)}` };
  document.querySelectorAll('.key-numbers').forEach(list => whenVisible(list, () => list.querySelectorAll('[data-count]').forEach((b, i) =>
    countUp(b, Number(b.dataset.count), formats[b.dataset.format], { delay: i * 90, duration: 900 }))));
}

/** The rail marks the section being read: the one whose heading last passed the top third of the screen. */
function trackSections() {
  const links = new Map([...document.querySelectorAll('[data-rail]')].map(a => [a.dataset.rail, a]));
  const sections = contents.map(([id]) => document.getElementById(id)).filter(Boolean);
  const update = () => {
    const line = innerHeight / 3;
    let current = null;
    sections.forEach(section => { if (section.getBoundingClientRect().top < line) current = section.id; });
    const index = contents.findIndex(([id]) => id === current);
    links.forEach((link, id) => {
      const i = contents.findIndex(([key]) => key === id);
      link.classList.toggle('is-current', id === current);
      link.classList.toggle('is-read', index >= 0 && i < index);
      if (id === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    document.querySelector('.paper-rail')?.classList.toggle('is-visible', scrollY > document.querySelector('.paper-tldr').offsetTop - innerHeight / 2);
  };
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update);
  update();
}

export function initializePaperSections() {
  const citation = `@misc{phamdinh2026backtobasics,\n  title = {Back to Basics: A Skill-Centric Approach to Generalist Web Agents},\n  author = {Pham-Dinh, Minh and Ishmam, Md Farhan and\n    Yupanqui, Hernan and Joarder, Reaz Hassan and Marino, Kenneth},\n  year = {2026},\n  eprint = {2610.35823},\n  archivePrefix = {arXiv},\n  url = {https://arxiv.org/abs/2610.35823}\n}`;
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
  trackSections();
  initializeFolds();
  // Clicking the title plays its marks again.
  const title = document.querySelector('.paper-title');
  title?.addEventListener('click', () => title.getAnimations({ subtree: true }).forEach(a => { a.cancel(); a.play(); }));
  const question = document.querySelector('.paper-question');
  whenVisible(question, () => question.classList.add('is-visible'));    // its highlights swipe in as it arrives
  const gains = document.querySelector('.paper-chart-figure .gain-chart');
  whenVisible(gains, () => playDumbbells(gains));
}
