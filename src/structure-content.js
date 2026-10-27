// Paper snapshot: MiniWeb repo, docs/paper/MiniWeb_arxiv (the arXiv source), 20 October 2026.
// Only main.tex, sections/, tables/rq1_table.tex and tables/rq3_transfer.tex inform this copy.
export const paper = {
  title: 'Back to Basics: A Skill-Centric Approach to Generalist Web Agents',
  pdf: 'https://arxiv.org/pdf/2610.35823',
  arxiv: 'https://arxiv.org/abs/2610.35823',
  code: 'https://github.com/miniweb-site/MiniWeb',
  data: 'https://huggingface.co/datasets/sparklabuofu/MiniWeb',
  demo: 'https://huggingface.co/spaces/sparklabuofu/MiniWeb-demo',
  authors: [
    { name: 'Minh Pham-Dinh', affiliation: '¹', url: 'https://minhphd.github.io/' },
    { name: 'Md Farhan Ishmam', affiliation: '¹', url: 'https://farhanishmam.github.io/' },
    { name: 'Hernan Yupanqui', affiliation: '¹', url: null },
    { name: 'Reaz Hassan Joarder', affiliation: '²', url: 'https://cse.iutoic-dhaka.edu/profile/reaz-hassan' },
    { name: 'Kenneth Marino', affiliation: '¹', url: 'https://kennethmarino.com/' },
  ],
  affiliations: '¹ University of Utah · ² Islamic University of Technology',
  snapshot: 'arXiv source · 20 October 2026',
  abstract: 'Compact web agents cannot rely on scale alone to cover every task they may encounter, so what they practice matters. We introduce MiniWeb, 65 synthetic websites built around 37 reusable interaction primitives, such as dragging a slider or submitting a form. Its 369 human-annotated tasks label the primitive behind every step, letting us identify which skills fail rather than only whether the full task succeeds. Across ten open-weight agents, drag & gesture is consistently the weakest family, with no agent solving more than 24% of its instances. We then ask whether targeted practice can close these gaps. MiniWebGen generates 3.1K verified single-primitive trajectories across 52 training sites; fine-tuning Qwen3.5-4B on them improves single-primitive success on 13 unseen sites by 24.9 percentage points, but leaves full-task success nearly unchanged (38.7% to 39.2%). The skills improve, but the agent does not compose them. MiniWebAgent addresses this with a planner that decomposes each task into skill-level steps for the trained executor, raising success on the unseen sites by 19.4 points. Without training on target-benchmark trajectories, it also gains 20.0 points on WebVoyager, 16.1 on Online-Mind2Web, and 9.3 on WebArena-Lite. Our results support a simple recipe for compact browser agents: practice reusable skills directly, then compose them to solve unfamiliar tasks.',
};

// Counts and headline numbers as the paper states them. Gains are quoted from the text, which computes them before
// rounding, so a few differ by 0.1 from the difference of two rounded table values.
export const facts = {
  sites: 65, trainingSites: 52, heldOutSites: 13, domains: 15, primitives: 37, families: 7,
  tasks: 369, heldOutTasks: 62, crossSiteTasks: 43, singlePrimitiveTasks: 103, agents: 10,
  trajectories: 3128, trainingSteps: '27.6K',
  dragPooled: 12.4, nextWeakestPooled: 38.0, dragBest: 24, dragFailuresAtGesture: 72, dragWebAgents: 9.0, dragGeneral: 18.0,
  judgeAccuracy: 92.2, costPerTrajectory: 0.04,
  singlePrimitive: [55.3, 80.3], singlePrimitiveGain: 24.9,
  gainOverBase: [19.4, 9.3, 20.0, 16.1],
  gainOverTaskCentric: [10.2, 2.2, 3.4, 10.7],
};

export const sections = {
  'hero-paper': { label: 'Paper title & authors', kind: 'Opening', purpose: 'Identify the paper immediately, establish authorship, and give researchers a direct route to the work.' },
  'hero-world': { label: 'World-led opening', kind: 'Opening', purpose: 'Make the environment tangible before explaining the research question.' },
  'hero-story': { label: 'Question-led opening', kind: 'Opening', purpose: 'Start with a concrete interaction and invite the reader into the research problem.' },
  'hero-evidence': { label: 'Result-led opening', kind: 'Opening', purpose: 'Lead with the headline result, with its baseline and evaluation scope beside it.' },
  thesis: { label: 'The idea in 30 seconds', kind: 'Orientation', purpose: 'Connect MiniWeb, MiniWebGen, and MiniWebAgent before asking the visitor to read further.' },
  abstract: { label: 'Research summary', kind: 'Context', purpose: 'Give readers a compact, prose explanation of the question, method, and outcome.' },
  world: { label: 'Explore the 65 websites', kind: 'Interactive', purpose: 'Let visitors inspect real interfaces, understand the breadth, and reach the existing 3D explorer.' },
  diagnosis: { label: 'Where agents fail', kind: 'Finding 01', purpose: 'Explain why skill-level evaluation reveals failures that a single task score hides.' },
  practice: { label: 'Practice ≠ composition', kind: 'Finding 02', purpose: 'Show the central surprise: isolated skills improve, while full-task success remains unchanged.' },
  method: { label: 'Practice, then compose', kind: 'Method', purpose: 'Explain how skill-specific data and a planner work together, with the actual paper figure.' },
  results: { label: 'Results & transfer', kind: 'Evidence', purpose: 'Compare all five configurations on the four evaluation sets, alongside the study’s limitations.' },
  resources: { label: 'Paper, code & data', kind: 'Next step', purpose: 'Help researchers move from understanding the work to reading or using it.' },
  citation: { label: 'Authors & citation', kind: 'Reference', purpose: 'Close with attribution and a draft citation, pending final publication metadata.' },
};

export const directions = [
  { id: 'paper', letter: 'A', title: 'Paper first', subtitle: 'The familiar academic page', audience: 'Researchers arriving from a paper link',
    promise: 'What is this work, and why should I read it?',
    strength: 'Fast orientation, visible authorship, and a familiar path to the evidence.',
    tradeoff: 'The environment arrives later; the opening is less distinctive.',
    borrow: 'The clear title, author block, and immediate resource links.',
    sections: ['hero-paper', 'thesis', 'abstract', 'method', 'results', 'world', 'resources', 'citation'] },
  { id: 'world', letter: 'B', title: 'World first', subtitle: 'Enter the research environment', audience: 'Visitors who want to explore or build',
    promise: 'What can I do inside MiniWeb?',
    strength: 'Turns the 65 websites into a memorable, concrete first impression.',
    tradeoff: 'Visitors may explore without understanding the paper’s central finding.',
    borrow: 'The interface mosaic and an early, searchable website gallery.',
    sections: ['hero-world', 'world', 'thesis', 'diagnosis', 'method', 'results', 'resources', 'citation'] },
  { id: 'story', letter: 'C', title: 'Story first', subtitle: 'Follow the research argument', audience: 'Readers discovering the idea for the first time',
    promise: 'Why don’t better skills automatically make a better agent?',
    strength: 'Makes the surprising result and the need for composition easy to understand.',
    tradeoff: 'Readers looking for a score or download need prominent shortcuts.',
    borrow: 'The failure → practice → composition sequence.',
    sections: ['hero-story', 'diagnosis', 'practice', 'method', 'results', 'world', 'resources', 'citation'] },
  { id: 'evidence', letter: 'D', title: 'Evidence first', subtitle: 'Let the results lead', audience: 'Technical readers comparing methods',
    promise: 'What improves, compared with what, and where?',
    strength: 'Keeps baselines, ablations, transfer, and scope close to the headline claim.',
    tradeoff: 'Less inviting until the reader knows why these evaluations matter.',
    borrow: 'The compact headline result and the complete comparison table.',
    sections: ['hero-evidence', 'results', 'practice', 'method', 'diagnosis', 'world', 'resources', 'citation'] },
];

export const recommended = ['hero-paper', 'thesis', 'world', 'diagnosis', 'practice', 'method', 'results', 'resources', 'citation'];
// Paper Table 3. `trainedOn` and `significance` follow its layout: +1 (−1) is significantly above (below) the
// group's untrained row, p < 0.05.
export const resultRows = [
  { name: 'Single agent', detail: 'No training', group: 'Single agent, trained on', trainedOn: 'nothing', values: [38.7, 27.1, 45.5, 17.9] },
  { name: 'Single agent + skill training', detail: 'MiniWebGen data', group: 'Single agent, trained on', trainedOn: 'our data', values: [39.2, 20.3, 32.8, 8.6], significance: [0, -1, -1, -1] },
  { name: 'Planner + untrained executor', detail: 'Planning only', group: 'Planner, executor trained on', trainedOn: 'nothing', values: [45.2, 30.7, 59.9, 21.8] },
  { name: 'Planner + task-trained executor', detail: 'Matched-size task-centric data', group: 'Planner, executor trained on', trainedOn: 'task-centric trajectories', values: [47.8, 34.2, 62.1, 23.2] },
  { name: 'MiniWebAgent', detail: 'Planner + skill-trained executor', group: 'Planner, executor trained on', trainedOn: 'skill-centric trajectories', values: [58.1, 36.4, 65.5, 33.9], significance: [1, 1, 1, 1], ours: true },
];
export const evaluations = ['MiniWeb held-out', 'WebArena-Lite', 'WebVoyager', 'Online-Mind2Web'];
export const evaluationAbbreviations = ['MiniWeb', 'WA-Lite', 'WV', 'OM2W'];
export const sampleSizes = [62, 154, 536, 280];
export const storageKey = 'miniweb-structure-studio-v1';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function renderAuthors() {
  return paper.authors.map(({ name, affiliation, url }) => `<span class="author-name">${url ? `<a class="author-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>` : escapeHtml(name)}${escapeHtml(affiliation)}</span>`).join(' · ');
}
export function cleanMix(value) {
  if (!Array.isArray(value)) return [...recommended];
  const clean = [...new Set(value.filter(id => Object.hasOwn(sections, id)))];
  const hero = clean.find(id => id.startsWith('hero-')) || 'hero-paper';
  return [hero, ...clean.filter(id => !id.startsWith('hero-'))];
}
