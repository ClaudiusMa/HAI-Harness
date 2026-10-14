import json,pathlib,sys
rows=[]
# Usage: python3 usage.py <root-thread-id>... [--days 2026/10/12 2026/10/13]; sums the roots and all spawned descendants.
args=sys.argv[1:]; days=args[args.index('--days')+1:] if '--days' in args else []
ids=set(args[:args.index('--days')] if days else args)
base=pathlib.Path.home()/'.codex/sessions'
paths=[p for d in days for p in (base/d).glob('*.jsonl')] if days else list(base.rglob('*.jsonl'))
for p in paths:
 with p.open() as f:
  try: meta=json.loads(next(f)).get('payload',{})
  except:continue
 sid=meta.get('id'); source=meta.get('source',{}); parent=None
 if isinstance(source,dict):
  sub=source.get('subagent',{}); spawn=sub.get('thread_spawn',{}) if isinstance(sub,dict) else {};parent=spawn.get('parent_thread_id') if isinstance(spawn,dict) else None
 rows.append((p,meta,sid,parent))
changed=True
while changed:
 changed=False
 for p,m,sid,parent in rows:
  if parent in ids and sid not in ids:ids.add(sid);changed=True
out=[]
for p,m,sid,parent in rows:
 if sid not in ids:continue
 last=None;models=set();turns=[]
 for l in p.open():
  try:r=json.loads(l)
  except:continue
  pl=r.get('payload',{})
  if r.get('type')=='event_msg' and pl.get('type')=='token_count' and pl.get('info'):last=pl['info'].get('total_token_usage')
  if r.get('type')=='turn_context':models.add((pl.get('model'),pl.get('effort') or pl.get('reasoning_effort')))
  if r.get('type')=='event_msg' and pl.get('type') in ['task_started','task_complete']:turns.append({'timestamp':r.get('timestamp'),'type':pl.get('type')})
 out.append({'id':sid,'parent':parent,'path':str(p),'usage':last,'models':list(models),'turns':turns,'source':m.get('source')})
print(json.dumps(out,indent=2))
