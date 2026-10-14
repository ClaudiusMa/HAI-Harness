# Usage: python3 -I claude_usage.py <project-transcript-dir>
# Sums Claude Code usage for every session transcript under one project folder,
# including subagent transcripts. Streamed assistant entries share a message id;
# each id is counted once. Turns start at a user prompt or a cross-session message.
import json, sys, pathlib, collections
from datetime import datetime

root = pathlib.Path(sys.argv[1]).expanduser()
files = sorted(root.rglob('*.jsonl'))
seen = set()
totals = collections.Counter()
models = collections.Counter()
per_file = {}
turns = []
for f in files:
    sub = collections.Counter()
    is_main = f.parent == root
    last_ts = None
    for line in f.open():
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        ts = r.get('timestamp')
        msg = r.get('message') or {}
        if is_main and r.get('type') == 'user' and not r.get('isSidechain'):
            content = msg.get('content')
            prompt = isinstance(content, str) or (isinstance(content, list) and any(c.get('type') == 'text' for c in content) and not any(c.get('type') == 'tool_result' for c in content))
            text = content if isinstance(content, str) else ''
            if prompt and (not r.get('isMeta') or 'cross-session-message' in text):
                if turns and turns[-1]['end'] is None:
                    turns[-1]['end'] = last_ts
                turns.append({'start': ts, 'end': None, 'prompt': (content if isinstance(content, str) else content[0].get('text', ''))[:80]})
        if r.get('type') != 'assistant':
            continue
        last_ts = ts
        mid = msg.get('id')
        if not mid or mid in seen:
            continue
        seen.add(mid)
        u = msg.get('usage') or {}
        models[msg.get('model')] += 1
        for it in u.get('iterations') or []:
            if it.get('type') != 'message':
                models['iteration:' + str(it.get('type'))] += 1
        for k in ('input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens'):
            sub[k] += u.get(k) or 0
        sub['calls'] += 1
    if is_main and turns and turns[-1]['end'] is None:
        turns[-1]['end'] = last_ts
    per_file[str(f.relative_to(root))] = dict(sub)
    totals.update(sub)

def secs(a, b):
    p = lambda s: datetime.fromisoformat(s.replace('Z', '+00:00'))
    return (p(b) - p(a)).total_seconds()

real_turns = [t for t in turns if t['end']]
out = {
    'files': per_file,
    'totals': dict(totals),
    'total_tokens': sum(totals[k] for k in ('input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'output_tokens')),
    'uncached_input': totals['input_tokens'] + totals['cache_creation_input_tokens'],
    'models': dict(models),
    'turns': [{'seconds': round(secs(t['start'], t['end']), 1), 'prompt': t['prompt']} for t in real_turns],
    'active_seconds': round(sum(secs(t['start'], t['end']) for t in real_turns), 1),
}
print(json.dumps(out, indent=2))
