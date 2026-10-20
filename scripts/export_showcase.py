"""Export the paper's data, figures, tasks and trajectories shown on the website.

    ~/.conda/envs/miniweb/bin/python -I scripts/export_showcase.py [--release ../MiniWeb-src] [--paper PAPER]

Reads the anonymised Hugging Face tables in <release>/data/release/miniweb-v1-hf/data (tasks, demonstrations,
MiniWebGen trajectories and steps, sites, primitives, guides) and three MiniWebAgent runs on held-out tasks from
<release>/data/webmix/eval/pagent_pooled_s2. Writes all 369 human tasks for the task explorer (src/data/task-index.json,
and per task public/tasks/<id>.json with its screenshots), and src/data/showcase.json with the screenshots of the
MiniWebGen and MiniWebAgent examples under public/showcase/. Only the fields the page shows are exported: no annotator, reviewer, path or host information.

From the paper source (default ../MiniWeb/docs/paper/MiniWeb_arxiv) it copies the annotation tool's screenshots
(figures/annotation, as lossless WebP), parses Table 2 (tables/rq1_table.tex) into
src/data/skill-profiles.json and the primitive table (tables/supp_primitives.tex), with each primitive's MiniWebGen
guide from the release, into src/data/primitives.json; and it copies figures/method.pdf to public/research/, with an
SVG fallback when pdftocairo (poppler) is installed.

The examples avoid the sites whose upstream data terms do not allow reuse (docs/DATA_LICENSES.md in MiniWeb).
Needs pyarrow and Pillow (both in the MiniWeb environment).
"""
import argparse, ast, glob, io, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import pyarrow.parquet as pq
from PIL import Image

SITE = Path(__file__).resolve().parent.parent
# Human tasks shown first: the teaser's CascadiaMaps task, the construction figure's SnapLink task, and three that cover
# the other families (a drawn signature, an export, a cross-site task). The task explorer holds all 369.
TASKS = ['map-services_345e3d', 'url-shorteners-qr_74e00a', 'sports-esports_c6d65b', 'tax-filing-dmv-permits_2fb853',
         'project-mgmt-issue-tracking_team-chat-workspace_cdb14d']
# One MiniWebGen trajectory per trained skill family.
GENERATED = ['filter_by_slider-job-sites-138f7512', 'sort_by_form-blogs-fe648242', 'edit_by_cell-forms-surveys-5d9277e1',
             'create_by_form-banking-6e447557', 'get_nav_route-map-services-004ee246',
             'upload_file-course-sites-classrooms-1072c256']
# MiniWebAgent on held-out tasks: the method figure's trace, a second success, and the SnapLink task above, which fails.
AGENT_RUN = 'pagent_pooled_s2'
SINGLE_RUN = 'human_pooled_v4'          # the trained single agent on the same held-out tasks (its first seed)
AGENT = ['url-shorteners-qr_1a792b', 'flights-hotels_fbc77e', 'url-shorteners-qr_74e00a']
FAMILY_IDS = {'Drag & gesture': 'drag', 'Discrete selection': 'select', 'Text entry': 'text', 'Form transaction': 'form',
              'Navigation': 'nav', 'Out-of-page I/O': 'io', 'Reasoning base': 'reason', 'Reasoning': 'reason'}
WIDTH, QUALITY = 1600, 90                 # screenshots keep their recorded width (1440 or 1280)
SHOWN_PER_CELL = 3                         # tasks per cell of the explorer's grid whose screenshots the page carries
SHOWN_WIDTH, SHOWN_QUALITY = 1440, 80      # their recorded width; the other tasks link to the dataset for theirs
TALL = 1.2                                 # full-page re-renders are cut at 1.2 × their width
# Sites whose upstream data terms do not allow reuse, or that hold real people's email (MiniWeb docs/DATA_LICENSES.md):
# their tasks are listed and described, but the page carries no screenshots of them.
RESTRICTED = {'auctions-p2p-marketplaces', 'e-commerce', 'forums', 'version-control', 'software-marketplace',
              'real-estate-buy-rent', 'comparison-aggregators', 'email', 'visual-how-to-guides'}
FIGURES = ['method']                     # paper figures the page renders from their PDF
ANNOTATION = ['dashboard', 'task_editor', 'verify', 'macro_browser']   # the annotation tool, Supp. Figs. (anonymised)


def table(root, name, **kw):
    return pq.read_table(sorted(glob.glob(f'{root}/{name}/*.parquet')), **kw).to_pylist()


def save(image_bytes, path, width=WIDTH, quality=QUALITY, tall=None, method=6):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    if tall and im.height > im.width * tall:
        im = im.crop((0, 0, im.width, round(im.width * tall)))
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=quality, method=method)
    return im.size


def phrase(target):
    """A recorded target such as "input[text] 'Title *'" or "select 'sort' = 'Newest'" as a short noun phrase."""
    target = re.sub(r'\s+', ' ', re.sub(r'\s*->\s*\S+$', '', target or '')).strip()
    m = re.match(r"^(\w+)(?:\[(\w+)\])? '(.*?)'(?: = '.*')?$", target)
    if not m:
        return ''                                         # a CSS selector or the page: the screenshot shows it
    tag, kind, name = m.groups()
    name = name.strip().rstrip(' *').replace('_', ' ') if name not in ('(unnamed)', '') else ''
    name = name if len(name) <= 40 else name[:38] + '…'
    if kind == 'range': return f'the {name} slider' if name else 'the slider'
    if tag in ('input', 'textarea'): return f'the “{name}” field' if name else 'a field'
    if tag == 'select': return f'the “{name}” menu' if name else 'a menu'
    if tag in ('button', 'link'): return f'“{name}”' if name else f'a {tag}'
    return f'“{name}”' if name else ''


def human_action(e):
    """A short description of a recorded human action."""
    rec, kind, where = json.loads(e['record'] or '{}'), e['action'], phrase(e['target'])
    slider = 'slider' in where
    if kind == 'click': return f'Click {where}'.strip()
    if kind == 'type': return f'Slider at {rec.get("text")}' if slider else f'Type “{rec.get("text", "")}”' + (f' in {where}' if where else '')
    if kind == 'change': return f'Set the slider to {rec.get("value")}' if slider else f'Set {where or "a field"} to “{rec.get("value", "")}”'
    if kind == 'select': return f'Choose “{rec.get("option_text") or rec.get("value")}”' + (f' in {where}' if where else '')
    if kind == 'keypress': return f'Press {rec.get("key", "a key")}'
    if kind == 'submit': return 'Submit the form'
    if kind == 'scroll': return 'Scroll the page'
    if kind == 'tab_switch': return 'Switch to another tab'
    if kind in ('drag', 'draw'): return f'Drag {where}'.strip()
    return kind.replace('_', ' ').capitalize()


def generated_action(a, element):
    kind, name, role = a['type'], (element.get('accessible_name') or element.get('text') or '').strip(), element.get('role') or ''
    name = name if len(name) <= 40 else name[:38] + '…'
    if kind == 'click':
        if role in ('textbox', 'combobox', 'searchbox', 'spinbutton') and name: return f'Click the “{name}” field'
        return f'Click “{name}”' if name else 'Click'
    if kind == 'type': return f'Type “{a.get("text", "")}”'
    if kind == 'key': return f'Press {a.get("key", "")}'
    if kind == 'scroll': return 'Scroll ' + ('down' if a.get('dy', 0) > 0 else 'up')
    if kind == 'drag': return 'Drag the slider' if role == 'slider' else 'Drag'
    if kind == 'draw': return 'Draw'
    return kind.replace('_', ' ').capitalize()


def executor_step(text):
    """An executor's own summary of a step, without element indexes and ids."""
    text = re.sub(r'^Clicked a "', 'Clicked "', re.sub(r'\s+', ' ', text).strip())
    return re.sub(r' at index \d+| id=[\w-]+', '', text)


def check_text(backend):
    """The backend check of a generated trajectory: a request with its non-empty parameters, or the data change."""
    m = re.match(r'^(GET|POST) (\S+?)(?:\?(\S*))? \[\d+\]$', backend)
    if not m:
        return backend
    method, path, query = m.groups()
    path = re.sub(r'^/sites/[^/]+', '', path) or '/'
    params = '&'.join(p for p in (query or '').split('&') if p and not p.endswith('='))
    return f'{method} {path}' + (f'?{params}' if params else '')




def strip_hosts(text):
    """Drop local hosts and the /sites/<site> prefix from a URL or message: the site is named beside it."""
    return re.sub(r'/sites/[\w-]+', '', re.sub(r'https?://(localhost|127\.0\.0\.1)(:\d+)?', '', text or '')).strip()


def short(value, n=40):
    value = str(value)
    return value if len(value) <= n else value[:n - 1] + '…'


def describe_sample(task):
    """MiniWebGen's sampled configuration (w, c, z, s0) in words: the control, its argument, and the start page."""
    c, o = task.get('control') or {}, task.get('option') or {}
    kind, label = c.get('kind'), (c.get('label') or '').rstrip(':')
    if kind == 'slider':
        control = f'the “{label}” slider ({c["min"]:,.0f}–{c["max"]:,.0f}, step {c["step"]:,.0f})'
        argument = f'{float(o["value"]):,.0f}'
    elif kind == 'select':
        control, argument = f'the “{label}” menu ({c.get("n_options")} options)', f'“{o.get("text")}”'
    elif kind == 'gridcell':
        control, argument = 'a cell of the response grid', f'row {o.get("row")}, “{short(o.get("col", ""), 30)}” → “{o.get("new")}”'
    elif kind == 'upload':
        control, argument = f'the “{label}” file picker', o.get('file') or o.get('text')
    else:
        control = f'the form on {strip_hosts(c.get("page"))}'
        argument = ', '.join(f'{k.lstrip("#")} = “{short(v, 28)}”' for k, v in (o.get('values') or {}).items())
    return {'control': control, 'argument': argument, 'start': f'{task["start"]["kind"]} page, {strip_hosts(task["start"]["url"]) or "/"}'}


def describe_check(check):
    """The check κ: a request with its parameters, or the data change the dry runs agreed on."""
    if check.get('kind') == 'request':
        params = '&'.join(f'{k}={v}' for k, v in (check.get('params') or {}).items())
        return f'{check["method"]} {strip_hosts(check["path"]) or "/"}' + (f'?{params}' if params else '')
    parts = []
    for e in check.get('expect') or []:
        fields = []
        for k, v in (e.get('fields') or {}).items():                      # nested fields one level down, e.g. answers.f36_3
            if isinstance(v, dict):
                fields += [(f'{k}.{sub}', w) for sub, w in v.items() if not isinstance(w, (dict, list))]
            elif not isinstance(v, list) and k != 'user_id':
                fields.append((k, v))
        if e['op'] == 'update':
            fields = fields[-2:]                                          # an update's last fields are the ones it sets
        target = e['collection'] + (f' #{e["item_id"]}' if e.get('item_id') else '')
        parts.append(f'{e["op"]} {target}: ' + ', '.join(f'{k} = {short(v, 24)}' for k, v in fields[:4]))
    return '; '.join(parts)


def generation_record(repo, gid):
    """Where a MiniWebGen trajectory came from: its sampled configuration and check, and each attempt's script and
    outcome at the gate (data/datagen/runs/<run>/tasks.jsonl and episodes/<id>/a<k>/attempt.json)."""
    episodes = next((repo / 'data' / 'datagen' / 'runs').glob(f'*/episodes/{gid}'))
    run = episodes.parent.parent
    task = next(r for r in map(json.loads, open(run / 'tasks.jsonl')) if r['task_id'] == gid)
    attempts = []
    for a in json.load(open(episodes / 'summary.json'))['attempts']:
        record = json.load(open(episodes / f'a{a["attempt"]}' / 'attempt.json'))
        error = strip_hosts(re.sub(r'^assertion failed: ', '', a.get('error') or ''))
        attempts.append({'ok': bool(a['ok']), 'error': error, 'script': strip_hosts((record.get('scripts') or {}).get('target', '')).strip()})
    return {**describe_sample(task), 'subtask': task.get('subtask') or '', 'check': describe_check(task['check']),
            'checkKind': 'request' if task['check'].get('kind') == 'request' else 'data', 'attempts': attempts}


def planner_turns(run_dir):
    """Each planner turn: its memory, its decision (a delegation or the answer), and what the executor reported back."""
    turns = []
    for item in json.load(open(run_dir / 'planner_history.json'))['history']:
        output = item.get('model_output') or {}
        for action in output.get('action') or []:
            name, args = next(iter(action.items()))
            report = ((item.get('result') or [{}])[0].get('extracted_content') or '')
            report = re.sub(r'^\w[\w &/-]* specialist \([^)]*\), ', '', report)
            report = re.sub(r'\s*\[(specialist steps left|check):[^\]]*\]', '', report)        # the harness's own bookkeeping
            turns.append({'memory': short(output.get('memory') or '', 420), 'action': name,
                          'family': FAMILY_IDS.get((args or {}).get('family'), 'reason') if name == 'delegate' else None,
                          'instruction': (args or {}).get('instruction') or (args or {}).get('text') or '', 'report': strip_hosts(report)})
    return turns


def single_agent(run_dir, tid, out_dir):
    """The trained single agent on the same task: each step's action, its memory, and its screenshot, with the verdicts."""
    records = run_dir / ('results_regraded.jsonl' if (run_dir / 'results_regraded.jsonl').exists() else 'results.jsonl')
    result = next((r for r in map(json.loads, open(records)) if r['task_id'] == tid), None)
    if not result or not (run_dir / tid / 'history.json').exists():
        return None
    steps = []
    for k, item in enumerate(json.load(open(run_dir / tid / 'history.json'))['history']):
        output, outcome = item.get('model_output') or {}, (item.get('result') or [{}])[-1]
        action = outcome.get('long_term_memory') or outcome.get('extracted_content') or ''
        actions = output.get('action') or [{}]
        if 'done' in actions[-1]:
            action = 'Done: ' + short((actions[-1]['done'] or {}).get('text', ''), 200)
        step = {'action': executor_step(re.sub(r'^[^\w“"\'(]+\s*', '', strip_hosts(action))), 'memory': short(output.get('memory') or '', 260)}
        shot = run_dir / tid / 'screenshots' / Path((item.get('state') or {}).get('screenshot_path') or '').name
        if shot.is_file():
            name = f'single/{tid}/{k:02d}.webp'
            step['w'], step['h'] = save(shot.read_bytes(), out_dir / name)
            step['image'] = f'showcase/{name}'
        steps.append(step)
    return {'ok': bool(result['ok']), 'verdicts': ast.literal_eval(result['detail']), 'answer': result.get('answer') or '', 'steps': steps}


def skill_improvement(repo):
    """Per skill family, with the paper's own aggregation (docs/figures/common/results.py): success on the 103 generated
    single-primitive tasks (Fig. 7), primitive instances passed inside the 62 held-out human tasks (Secs. 4.2-4.3), and
    task success by the number of primitives a task chains (Fig. 6, right), for the four Qwen3.5-4B arms over 3 runs."""
    import yaml
    sys.path[:0] = [str(repo / 'docs' / 'figures' / 'common'), str(repo)]
    from results import family_counts, primitive_filter, _records, human_tasks
    from datagen.viewer import FAMILY_OF
    runs = yaml.safe_load(open(repo / 'docs' / 'figures' / 'tables' / 'tables_config.yaml'))['runs']
    final = set(yaml.safe_load(open(repo / 'data' / 'final_set.yaml'))['tasks'])
    arms = {'base': 'Single agent, untrained', 'pooled': 'Single agent, trained', 'planner': 'Planner, untrained executor',
            'planner_pooled': 'MiniWebAgent'}
    covered = primitive_filter('well_covered')
    fam = lambda m: FAMILY_IDS.get(FAMILY_OF.get(m.split('#')[0], ''), None)

    def view(counts):
        families = {}
        for arm, c in counts.items():
            for f, (passed, total) in c.items():
                families.setdefault(f, {})[arm] = [passed, total]
        return {'families': families, 'all': {arm: [sum(v[0] for v in c.values()), sum(v[1] for v in c.values())] for arm, c in counts.items()}}

    single = {arm: {FAMILY_IDS[f]: v for f, v in family_counts(runs[arm]['single'], FAMILY_OF, only=covered).items() if f in FAMILY_IDS} for arm in arms}
    single_tasks = len({tid for tid, r in _records(runs['base']['single'][0]).items() if r.get('macro') in covered})
    inside = {}
    for arm in arms:
        c = {}
        for run in runs[arm]['heldout']:
            for tid, r in _records(run).items():
                detail = ast.literal_eval(r.get('detail') or '{}') if tid in final else {}
                for m, ok in (detail.items() if isinstance(detail, dict) else []):
                    if fam(m):
                        c.setdefault(fam(m), [0, 0]); c[fam(m)][0] += bool(ok); c[fam(m)][1] += 1
        inside[arm] = c
    length = {t['task_id']: len(t['macros']) for t in human_tasks()}
    by_length, held = {}, set()
    for arm in arms:
        bins = {1: [], 2: [], 3: []}
        for run in runs[arm]['heldout']:
            for tid, r in _records(run).items():
                if tid in final:
                    held.add(tid); bins[min(length[tid], 3)].append(bool(r.get('ok')))
        by_length[arm] = [round(100 * sum(v) / len(v), 1) for v in bins.values()]
    tasks_per_bin = [sum(1 for t in held if min(length[t], 3) == b) for b in (1, 2, 3)]
    return {'arms': arms, 'runs': 3,
            'single': {'tasks': single_tasks, **view(single)},
            'inside': {'tasks': len(held), **view(inside)},
            'length': {'bins': ['1', '2', '3+'], 'tasks': tasks_per_bin, 'arms': by_length}}


def task_primitives(task, family):
    """A task's chain: each primitive instance with its family, span (1-based over the actions), subtask and operation."""
    spec = json.loads(task['task'])
    ops = spec.get('macro_operations') or {}
    return [{'name': m.split('#')[0], 'family': family.get(m.split('#')[0], 'reason'), 'span': spec['macro_spans'].get(m),
             'subtask': (spec.get('macro_subtasks') or {}).get(m, ''), 'op': ops.get(m)} for m in spec['macros']]


def demonstration_steps(events, tid, out, images):
    """One step per recorded action, with the screenshot recorded right after it (before the next action) when `images`.
    A screenshot that does not decode (one in the release is truncated) leaves its step without an image."""
    steps, pending = [], None
    for e in sorted(events, key=lambda e: e['event_index']):
        if e['type'] == 'action':
            pending = {'action': human_action(e)}
            steps.append(pending)
        elif images and e['type'] == 'observation' and pending is not None and 'image' not in pending and (e['screenshot'] or {}).get('bytes'):
            name = f'{tid}/{len(steps):03d}.webp'
            try:
                pending['w'], pending['h'] = save(e['screenshot']['bytes'], out / name, SHOWN_WIDTH, SHOWN_QUALITY, TALL)
                pending['image'] = f'tasks/{name}'
            except OSError as error:
                print(f'  {tid} step {len(steps)}: screenshot skipped ({error})')
    return steps


def demonstration_events(files, columns):
    """Every task's recorded events, streamed: (task_id, events) as soon as all of a task's events have been read."""
    remaining = {}
    for f in files:
        for tid in pq.read_table(f, columns=['task_id']).column('task_id').to_pylist():
            remaining[tid] = remaining.get(tid, 0) + 1
    pending = {}
    for f in files:
        for batch in pq.ParquetFile(f).iter_batches(batch_size=256, columns=columns):
            for e in batch.to_pylist():
                pending.setdefault(e['task_id'], []).append(e)
                remaining[e['task_id']] -= 1
                if not remaining[e['task_id']]:
                    yield e['task_id'], pending.pop(e['task_id'])


def choose_shown(tasks, scan):
    """About SHOWN_PER_CELL tasks per cell of the explorer's grid (single or multi-site × primitives per task, 6+ pooled)
    whose screenshots the page carries: the page's own examples first, then demonstrations that pass their verifier,
    live captures (JPEG) over full-page re-renders, short demonstrations, a different site for each, and no restricted site."""
    forced = set(TASKS) | set(AGENT)
    cells, used = {}, {}
    for tid, task in tasks.items():
        key = (len(task['sites']) > 1, min(len(json.loads(task['task'])['macros']), 6))
        cells.setdefault(key, []).append(tid)
    shown = set()
    for key in sorted(cells):
        def score(tid):
            task, s = tasks[tid], scan.get(tid, {})
            status = (json.loads(task['provenance']).get('demonstration') or {}).get('status')
            return (tid not in forced, bool(set(task['sites']) & RESTRICTED), status != 'valid', not s.get('jpeg'),
                    s.get('shots', 0) < 0.8 * max(1, s.get('actions', 1)), s.get('actions', 0) > 30,
                    used.get(task['sites'][0], 0), task['split'] != 'test', tid)
        picks = []
        for tid in sorted(cells[key], key=score):
            task = tasks[tid]
            if tid not in forced and (len(picks) >= SHOWN_PER_CELL or set(task['sites']) & RESTRICTED or not scan.get(tid, {}).get('shots')
                                      or task['sites'][0] in {tasks[p]['sites'][0] for p in picks}):
                continue
            picks.append(tid)
            used[task['sites'][0]] = used.get(task['sites'][0], 0) + 1
        shown |= set(picks)
    return shown


def task_catalog(hf, family, sites):
    """All 369 tasks: an index for the explorer (src/data/task-index.json) and, per task, its chain and its demonstration's
    steps (public/tasks/<id>.json). For about SHOWN_PER_CELL tasks per grid cell it also writes the screenshots
    (public/tasks/<id>/<step>.webp); the other tasks point to the dataset for theirs. Two streaming passes over the
    demonstrations: one to see what each task recorded, one to write."""
    out = SITE / 'public' / 'tasks'
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    tasks = {t['task_id']: t for t in table(hf, 'tasks', columns=['task_id', 'split', 'sites', 'instruction', 'task', 'provenance'])}
    files = sorted(glob.glob(f'{hf}/demonstrations/*.parquet'))
    scan = {}
    for tid, events in demonstration_events(files, ['task_id', 'type', 'screenshot']):
        shots = [e['screenshot']['bytes'] for e in events if e['type'] == 'observation' and (e['screenshot'] or {}).get('bytes')]
        scan[tid] = {'actions': sum(e['type'] == 'action' for e in events), 'shots': len(shots), 'jpeg': bool(shots) and shots[0][:2] == b'\xff\xd8'}
    shown = choose_shown(tasks, scan)
    index = []
    columns = ['task_id', 'event_index', 'type', 'action', 'target', 'value', 'text', 'record', 'screenshot']
    events_of = dict.fromkeys(tasks, [])
    for tid, events in demonstration_events(files, columns):
        if tid not in tasks:
            continue
        task = tasks[tid]
        spec, chain = json.loads(task['task']), task_primitives(task, family)
        steps = demonstration_steps(events, tid, out, tid in shown)
        events_of[tid] = None
        (out / f'{tid}.json').write_text(json.dumps({'primitives': chain, 'answer': spec.get('expected_answer') or '', 'steps': steps}, ensure_ascii=False) + '\n')
        index.append(index_entry(task, chain, sites, steps, scan.get(tid, {}), tid in shown))
    for tid in [t for t, e in events_of.items() if e is not None]:      # a task without any recorded event
        task = tasks[tid]
        chain = task_primitives(task, family)
        (out / f'{tid}.json').write_text(json.dumps({'primitives': chain, 'answer': json.loads(task['task']).get('expected_answer') or '', 'steps': []}) + '\n')
        index.append(index_entry(task, chain, sites, [], {}, False))
    index.sort(key=lambda t: (len(t['primitives']), len(t['sites']), t['sites'][0], t['id']))
    (SITE / 'src' / 'data' / 'task-index.json').write_text(json.dumps(index, ensure_ascii=False, separators=(',', ':')) + '\n')
    size = sum(f.stat().st_size for f in out.rglob('*.webp'))
    print(f'task-index.json: {len(index)} tasks, {len(shown)} with screenshots on the page '
          f'({sum(1 for _ in out.rglob("*.webp"))} images, {size / 1e6:.1f} MB)')


def index_entry(task, chain, sites, steps, scan, shown):
    return {'id': task['task_id'], 'sites': [sites[s] for s in task['sites']], 'siteIds': task['sites'], 'split': task['split'],
            'instruction': task['instruction'], 'primitives': [{'name': p['name'], 'family': p['family'], 'op': p['op']} for p in chain],
            'status': (json.loads(task['provenance']).get('demonstration') or {}).get('status'), 'steps': len(steps),
            'recorded': scan.get('shots', 0), 'shown': shown}


def tex_text(s):
    """Plain text from a cell of the paper's tables."""
    s = re.sub(r'\\(?:emph|texttt|textbf|textit)\{([^{}]*)\}', r'\1', s)
    for a, b in (('$\\rightarrow$', '→'), ('``', '“'), ("''", '”'), ('\\&', '&'), ('\\_', '_'), ('---', '—'), ('~', ' ')):
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', re.sub(r'\s*\(NEW\)', '', s)).strip()


def skill_profiles(paper):
    """Table 2: task success and the share of primitive instances passed per skill family, for each untrained agent."""
    axes = [('nav', 'Nav.'), ('text', 'Text'), ('select', 'Select'), ('form', 'Form'), ('io', 'I/O'), ('drag', 'Drag'), ('reason', 'Reason')]
    ops = ['read', 'verify', 'extremum', 'count']
    agents, group = [], ''
    for line in open(paper / 'tables' / 'rq1_table.tex'):
        if line.lstrip().startswith('%'):
            continue
        g = re.search(r'\\multicolumn\{14\}\{@\{\}l\}\{\\textit\{(.*?)\}\}', line)
        if g:
            group = g.group(1)
            continue
        cells = [c.strip() for c in line.rstrip().rstrip('\\').split('&')]
        if len(cells) != 14 or not group:
            continue
        clean = [re.sub(r'\\cellcolor\{[^}]*\}|\\textbf\{([^}]*)\}', lambda m: m.group(1) or '', c) for c in cells]
        value = lambda c: float(re.sub(r'\\se\{.*', '', c))
        se = lambda c: float(re.search(r'\\se\{([\d.]+)\}', c).group(1))
        agents.append({'name': clean[0], 'size': clean[1], 'group': group, 'task': value(clean[2]), 'taskSe': se(clean[2]),
                       'skills': {a: value(c) for (a, _), c in zip(axes, clean[3:10])},
                       'skillSe': {a: se(c) for (a, _), c in zip(axes, clean[3:10])},
                       'ops': {o: value(c) for o, c in zip(ops, clean[10:14])}})
    return {'source': 'Table 2 (tables/rq1_table.tex)', 'axes': [{'id': a, 'label': l} for a, l in axes], 'agents': agents}


def parse_guide(markdown):
    """A MiniWebGen guide (Markdown) as a summary, titled sections of items or text, and its provenance note."""
    guide, section = {'summary': '', 'sections': [], 'note': ''}, None
    for line in markdown.strip().splitlines():
        line = line.rstrip()
        if not line or line.startswith('# '):
            continue
        if line.startswith('## '):
            section = {'title': line[3:].strip(), 'items': [], 'ordered': False, 'text': ''}
            guide['sections'].append(section)
        elif re.match(r'^_.*_$', line):
            guide['note'] = line.strip('_')
        elif section is None:
            guide['summary'] = (guide['summary'] + ' ' + line).strip()
        elif re.match(r'^(-|\d+\.) ', line):
            section['ordered'] = section['ordered'] or bool(re.match(r'^\d+\.', line))
            section['items'].append(re.sub(r'^(-|\d+\.) ', '', line))
        elif section['items']:
            section['items'][-1] += ' ' + line.strip()
        else:
            section['text'] = (section['text'] + ' ' + line).strip()
    return guide


def primitive_catalog(paper, hf):
    """The 37 primitives by family, as the paper's primitive table lists them, each with its MiniWebGen guide."""
    guides = {g['primitive']: parse_guide(g['guide']) for g in table(hf, 'guides')}
    families, primitives, family = [], [], None
    for line in open(paper / 'tables' / 'supp_primitives.tex'):
        f = re.search(r'\\multicolumn\{5\}\{@\{\}l\}\{\\textit\{(.*?)\}\}', line)
        if f:
            family = FAMILY_IDS[tex_text(f.group(1))]
            families.append({'id': family, 'name': tex_text(f.group(1))})
            continue
        row = re.match(r'^\\texttt\{(.+?)\} & (.*) & (\d+) & (\d+) & (\d+|--) \\\\', line.strip())
        if not row:
            continue
        name, text, tasks, sites, generated = row.groups()
        description, _, span = tex_text(text).partition('Span:')
        start, _, end = span.partition('→')
        name = tex_text(name)
        primitives.append({'name': name, 'family': family, 'description': description.strip(), 'span': [start.strip(), end.strip()],
                           'tasks': int(tasks), 'sites': int(sites), 'generated': None if generated == '--' else int(generated),
                           'guide': guides.get(name)})
    return {'source': 'Table 7 (tables/supp_primitives.tex) and the release\'s guides', 'families': families, 'primitives': primitives}


def paper_figures(paper):
    """The figures the page draws from their PDF, the GitHub and Hugging Face logos of the paper's footnote, and a
    thumbnail of the paper's first page. The SVGs and the thumbnail need poppler (pdftocairo, pdftoppm)."""
    out = SITE / 'public' / 'research'
    (out / 'logos').mkdir(parents=True, exist_ok=True)
    for name in FIGURES:
        shutil.copyfile(paper / 'figures' / f'{name}.pdf', out / f'{name}.pdf')
    # The annotation tool's screenshots: lossless WebP at their full 2160 px, so their small text stays sharp.
    (out / 'annotation').mkdir(exist_ok=True)
    for name in ANNOTATION:
        Image.open(paper / 'figures' / 'annotation' / f'{name}.png').convert('RGB').save(out / 'annotation' / f'{name}.webp', 'WEBP', lossless=True, method=6)
    if not shutil.which('pdftocairo'):
        return
    for name in FIGURES:
        subprocess.run(['pdftocairo', '-svg', str(out / f'{name}.pdf'), str(out / f'{name}.svg')], check=True, capture_output=True)
    for logo in ('github', 'huggingface'):
        subprocess.run(['pdftocairo', '-svg', str(paper / 'figures' / 'logos' / f'{logo}.pdf'), str(out / 'logos' / f'{logo}.svg')], check=True, capture_output=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', '-singlefile', str(paper / 'main.pdf'), f'{tmp}/page'],
                       check=True, capture_output=True)
        page = Image.open(f'{tmp}/page.png').convert('RGB')
    page.resize((288, round(page.height * 288 / page.width)), Image.LANCZOS).save(out / 'paper-preview.webp', 'WEBP', quality=86)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--release', default=str(SITE.parent / 'MiniWeb-src'))
    ap.add_argument('--paper', default=str(SITE.parent / 'MiniWeb' / 'docs' / 'paper' / 'MiniWeb_arxiv'))
    ap.add_argument('--repo', default=str(SITE.parent / 'MiniWeb'), help='the MiniWeb repository: MiniWebGen runs, the eval runs, and the paper\'s figure code')
    args = ap.parse_args()
    hf = f'{args.release}/data/release/miniweb-v1-hf/data'
    repo = Path(args.repo)
    out_dir = SITE / 'public' / 'showcase'
    if out_dir.exists():
        shutil.rmtree(out_dir)
    family = {p['name']: FAMILY_IDS[p['family']] for p in table(hf, 'primitives') if p['family'] in FAMILY_IDS}
    sites = {s['id']: s['name'] for s in table(hf, 'sites')}
    tasks_by_id = {t['task_id']: t for t in table(hf, 'tasks', filters=[('task_id', 'in', sorted(set(AGENT)))])}

    primitives = lambda task: task_primitives(task, family)

    showcase = {'generated': [], 'agent': []}
    task_catalog(hf, family, sites)

    # MiniWebGen trajectories: the screenshot each action was taken on, then the final page.
    trajectories = {t['trajectory_id']: t for t in table(hf, 'miniwebgen_trajectories', filters=[('trajectory_id', 'in', GENERATED)])}
    gen_steps = table(hf, 'miniwebgen_steps', filters=[('trajectory_id', 'in', GENERATED)])
    for gid in GENERATED:
        t, meta, steps = trajectories[gid], json.loads(trajectories[gid]['meta']), []
        for s in sorted((s for s in gen_steps if s['trajectory_id'] == gid and s['phase'] == 'target'), key=lambda s: s['step']):
            a, element = json.loads(s['action']), (json.loads(s['elements'] or '{}').get('element') or {})
            name = f'generated/{gid}/{s["step"]:02d}.webp'
            w, h = save(s['screenshot']['bytes'], out_dir / name)
            step = {'action': generated_action(a, element), 'image': f'showcase/{name}', 'w': w, 'h': h}
            if 'x' in a and 'y' in a: step['point'] = [round(a['x'] / 1280, 4), round(a['y'] / 800, 4)]
            path = a.get('path') or [p for stroke in a.get('strokes') or [] for p in stroke]
            if a['type'] in ('drag', 'draw') and path: step['path'] = [[round(x / 1280, 4), round(y / 800, 4)] for x, y in path[::max(1, len(path) // 24)]]
            steps.append(step)
        name = f'generated/{gid}/final.webp'
        w, h = save(t['final_screenshot']['bytes'], out_dir / name)
        steps.append({'action': 'Result', 'image': f'showcase/{name}', 'w': w, 'h': h, 'final': True})
        check = check_text(meta.get('backend', ''))
        showcase['generated'].append({'id': gid, 'primitive': t['primitive'], 'family': family.get(t['primitive'], 'reason'),
                                      'site': sites[t['site']], 'siteId': t['site'], 'instruction': t['instruction'],
                                      'check': check, 'steps': steps, 'pipeline': generation_record(repo, gid)})

    # MiniWebAgent: the planner's delegations, what the executor did in each, and the verifier's verdict per primitive.
    run = Path(args.release) / 'data' / 'webmix' / 'eval' / AGENT_RUN
    results = {r['task_id']: r for r in map(json.loads, open(run / 'results_regraded.jsonl'))}
    for tid in AGENT:
        r, task = results[tid], tasks_by_id[tid]
        delegations = []
        for k, (fam, instruction, _) in enumerate(r['subtasks']):
            history = json.load(open(run / tid / f'history_{k}.json'))['history']
            done = [(item['result'] or [{}])[-1].get('long_term_memory') or (item['result'] or [{}])[-1].get('extracted_content') or '' for item in history]
            delegations.append({'family': FAMILY_IDS.get(fam, 'reason'), 'instruction': instruction,
                                'steps': [executor_step(d) for d in done if d and not d.startswith(('Task completed', 'Macro step finished'))][:12]})
        showcase['agent'].append({'id': tid, 'sites': [sites[s] for s in task['sites']], 'instruction': task['instruction'],
                                  'primitives': primitives(task), 'ok': r['ok'], 'verdicts': ast.literal_eval(r['detail']),
                                  'answer': r.get('answer') or '', 'expected': json.loads(task['task']).get('expected_answer') or '',
                                  'delegations': delegations, 'turns': planner_turns(run / tid),
                                  'single': single_agent(Path(args.release) / 'data' / 'webmix' / 'eval' / SINGLE_RUN, tid, out_dir)})

    paper = Path(args.paper)
    data = SITE / 'src' / 'data'
    profiles, catalog = skill_profiles(paper), primitive_catalog(paper, hf)
    (data / 'skill-profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=1) + '\n')
    (data / 'primitives.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + '\n')
    improvement = skill_improvement(repo)
    (data / 'skill-improvement.json').write_text(json.dumps(improvement, ensure_ascii=False, indent=1) + '\n')
    paper_figures(paper)
    print(f'skill-profiles.json: {len(profiles["agents"])} agents; primitives.json: {len(catalog["primitives"])} primitives, '
          f'{sum(1 for p in catalog["primitives"] if p["guide"])} with guides; figures: {", ".join(FIGURES)}')

    target = data / 'showcase.json'
    target.write_text(json.dumps(showcase, ensure_ascii=False, indent=1) + '\n')
    size = sum(f.stat().st_size for f in out_dir.rglob('*.webp'))
    print(f'{target.relative_to(SITE)}: {len(showcase["generated"])} generated, '
          f'{len(showcase["agent"])} agent traces; {sum(1 for _ in out_dir.rglob("*.webp"))} screenshots, {size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
