// The annotation tool as an interactive figure: the paper's four screenshots (Supp., annotation interface), one per step
// of the work, each with numbered callouts that spotlight the part they describe. The callouts paraphrase the paper's
// description of the tool; their regions are fractions of the 2160 × 1350 screenshots.
import { escapeHtml as escape } from './structure-content.js';
import { whenVisible } from './motion.js';

const image = name => `${import.meta.env.BASE_URL}research/annotation/${name}.webp`;
const steps = [
  {
    id: 'dashboard', name: 'Plan', title: 'Dashboard',
    summary: 'The dashboard orders the work in three steps: review each site and report bugs, annotate tasks, and build their verifiers.',
    callouts: [
      { box: [0.14, 0.143, 0.859, 0.44], title: 'Three steps', text: 'Review the sites and report bugs, annotate tasks, then build their verifiers. A site graph editor defines the information flows between sites.' },
      { box: [0.14, 0.533, 0.35, 0.697], title: 'Sites × primitives', text: 'How many tasks combine one to three sites with one to six primitives.' },
      { box: [0.484, 0.533, 0.859, 0.937], title: 'Coverage, least covered first', text: 'Tasks per primitive. The tool samples the primitives of new tasks toward those with few tasks.' },
    ],
  },
  {
    id: 'task_editor', name: 'Annotate', title: 'Task editor',
    summary: 'The tool samples one to three sites and the primitives to cover. The annotator explores the sites, designs the task, writes its instruction, and records it.',
    callouts: [
      { box: [0.004, 0.097, 0.733, 0.75], title: 'The embedded site', text: 'The annotator performs the task here; the tool records every browser action and server request.' },
      { box: [0.737, 0.088, 0.996, 0.75], title: 'Design, record, submit', text: 'The instruction in the annotator’s own words, the starting login and two-factor state, then recording. After it, they mark each primitive’s span on the action timeline and enter the expected answer.' },
      { box: [0.004, 0.79, 0.777, 1], title: 'The primitive graph', text: 'One node per primitive instance with its subtask and reasoning operation; edges for the order and data flow between them. Every primitive of a multi-primitive task must be connected.' },
      { box: [0.26, 0.761, 0.606, 0.786], title: 'LLM helpers', text: 'Optional: draft a task, rephrase an instruction, or infer a primitive chain from it. Their output is only a suggestion.' },
    ],
  },
  {
    id: 'verify', name: 'Verify', title: 'Verifier builder',
    summary: 'Each primitive instance of the task gets its own check, grounded in the gold requests of the recording.',
    callouts: [
      { box: [0.006, 0.05, 0.214, 0.41], title: 'The task queue', text: 'Saved tasks, with their review status.' },
      { box: [0.243, 0.106, 0.98, 0.2], title: 'Gold requests', text: 'The HTTP requests of the recording. The annotator pins the values the instruction names (★); everything else stays open.' },
      { box: [0.243, 0.211, 0.98, 0.389], title: 'An answer check', text: 'report_information · read: the reported answer must match the expected short URL.' },
      { box: [0.243, 0.4, 0.98, 0.72], title: 'An interaction check', text: 'share_by_form: the request, the click on “Sharing”, and the page visited. Checks that the instruction does not dictate are marked advisory.' },
      { box: [0.243, 0.966, 0.98, 1], title: 'The sandbox', text: 'The verifier must pass the gold recording and should reject two negative controls: an empty trajectory, and an answer given without any action.' },
    ],
  },
  {
    id: 'macro_browser', name: 'Review', title: 'Macro browser',
    summary: 'Reviewers step through every recorded span of one primitive across all tasks to keep the tags consistent across annotators.',
    callouts: [
      { box: [0.011, 0.111, 0.566, 0.62], title: 'The recorded page', text: 'The demonstration at one action of the span.' },
      { box: [0.011, 0.682, 0.566, 0.818], title: 'The action timeline', text: 'One row per primitive instance; the colored cells are the actions each one spans.' },
      { box: [0.578, 0.113, 0.989, 0.443], title: 'The occurrence', text: 'authenticate_by_form in one task, with its instruction.' },
      { box: [0.578, 0.46, 0.989, 0.663], title: 'The task’s primitives', text: 'Every primitive of the task with its span and reasoning operation.' },
      { box: [0.578, 0.686, 0.989, 1], title: 'Every other occurrence', text: 'The other tasks that contain the primitive, to compare how annotators tagged it.' },
    ],
  },
];

function render(state) {
  const step = steps[state.step];
  const box = step.callouts[state.callout].box;
  const rect = b => `left:${b[0] * 100}%;top:${b[1] * 100}%;width:${(b[2] - b[0]) * 100}%;height:${(b[3] - b[1]) * 100}%`;
  return `<div class="showcase-head"><p class="showcase-title">Annotation tool</p>
      <ol class="annot-steps" aria-label="Annotation steps">${steps.map((s, i) => `<li><button data-annot-step="${i}" aria-pressed="${i === state.step}"><span class="annot-step-number">${i + 1}</span><span><b>${s.name}</b><small>${s.title}</small></span></button></li>`).join('')}</ol></div>
    <p class="annot-summary">${escape(step.summary)}</p>
    <div class="annot-body">
      <a class="annot-screen" href="${image(step.id)}" target="_blank" rel="noopener" aria-label="Open the ${step.title.toLowerCase()} screenshot at full size">
        <img src="${image(step.id)}" width="2160" height="1350" alt="${escape(`${step.title} of the MiniWeb annotation tool.`)}" decoding="async" />
        <span class="annot-spot" style="${rect(box)}" aria-hidden="true"></span>
        ${step.callouts.map((c, i) => `<span class="annot-marker ${i === state.callout ? 'is-current' : ''}" style="left:max(12px, ${c.box[0] * 100}%);top:max(12px, ${c.box[1] * 100}%)" aria-hidden="true">${i + 1}</span>`).join('')}
      </a>
      <ol class="annot-callouts" aria-label="Parts of the ${step.title.toLowerCase()}">${step.callouts.map((c, i) => `<li><button data-callout="${i}" aria-pressed="${i === state.callout}"><span class="annot-marker">${i + 1}</span><span><b>${escape(c.title)}</b><small>${escape(c.text)}</small></span></button></li>`).join('')}</ol>
    </div>`;
}

export function initializeAnnotationTool() {
  const container = document.querySelector('[data-figure="annotation"]');
  if (!container) return;
  const frame = document.createElement('div');
  frame.className = 'showcase-frame annot-frame';
  container.prepend(frame);
  const state = { step: 0, callout: 0 };
  const draw = focus => {
    frame.innerHTML = render(state);
    if (focus) frame.querySelector(focus)?.focus({ preventScroll: true });
  };
  // A callout spotlights its part on hover or focus as well as on click; the spotlight glides between parts.
  const spotlight = i => {
    const box = steps[state.step].callouts[i].box;
    Object.assign(frame.querySelector('.annot-spot').style, { left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: `${(box[3] - box[1]) * 100}%` });
    frame.querySelectorAll('.annot-screen .annot-marker').forEach((m, k) => m.classList.toggle('is-current', k === i));
  };
  frame.addEventListener('click', event => {
    const step = event.target.closest('[data-annot-step]');
    const callout = event.target.closest('[data-callout]');
    if (step) { state.step = Number(step.dataset.annotStep); state.callout = 0; draw(`[data-annot-step="${state.step}"]`); }
    if (callout) {
      state.callout = Number(callout.dataset.callout);
      frame.querySelectorAll('[data-callout]').forEach(b => b.setAttribute('aria-pressed', String(b === callout)));
      spotlight(state.callout);
    }
  });
  const preview = event => {
    const callout = event.target.closest('[data-callout]');
    if (callout) spotlight(Number(callout.dataset.callout));
  };
  frame.addEventListener('pointerover', preview);
  frame.addEventListener('focusin', preview);
  frame.addEventListener('pointerleave', () => spotlight(state.callout));
  draw();
  whenVisible(frame, () => steps.slice(1).forEach(s => { new Image().src = image(s.id); }));   // then the other steps, in the background
}
