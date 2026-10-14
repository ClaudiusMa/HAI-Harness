import json,sys,re,collections
p=sys.argv[1]
pending=[]; buckets=collections.Counter(); counts=collections.Counter(); times=collections.Counter()
def classify(name,a):
    if name in('wait_agent','list_agents'): return 'wait/poll'
    if name=='send_message': return 'send_message'
    if name=='spawn_agent': return 'spawn'
    if name=='js': return 'browser'
    s=a
    if 'human-sync' in s or 'worktree create' in s or 'check-for-update' in s: return 'harness CLI'
    if re.search(r"Agents/(planning|tasks/)",s) and 'write_text' in s: return 'harness docs write'
    if re.search(r'cat (AGENTS|Agents/)',s) or 'SKILL.md' in s: return 'harness docs read'
    if 'view_image' in s: return 'view image'
    return 'other exec'
last=None
rows=[json.loads(l) for l in open(p)]
for r in rows:
    pl=r.get('payload',{}); t=r['type']; pt=pl.get('type')
    if t=='response_item' and pt in('function_call','custom_tool_call'):
        a=pl.get('arguments') or pl.get('input') or ''
        last=classify(pl.get('name'),a if isinstance(a,str) else json.dumps(a))
        pending.append(last)
    elif t=='event_msg' and pt=='token_count' and pl.get('info'):
        lt=pl['info']['last_token_usage']
        # attribute this model call to the call(s) emitted just before
        b=pending[-1] if pending else 'final answer'
        buckets[b]+=lt['input_tokens']+lt['output_tokens']; counts[b]+=1
        pending=[]
tot=sum(buckets.values())
for k,v in buckets.most_common(): print(f"{k:20s} turns={counts[k]:3d} tokens={v:>9,d} {100*v/tot:5.1f}%")
print('total',f"{tot:,d}")
