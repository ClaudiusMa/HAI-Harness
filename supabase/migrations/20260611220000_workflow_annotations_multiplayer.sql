-- Multiplayer workflow annotations: expertise-scoped agent feedback across channels
-- Enables real-time cohort collaboration with broadcast on workspace channel topics

create table if not exists public.workflow_annotations (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  session_id uuid not null,
  trigger_message_id uuid references public.messages(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  workspace_agent_id uuid not null references public.workspace_agents(id) on delete cascade,
  expertise_domain text not null,
  target_ref text not null default 'workflow:general',
  target_label text not null default 'Workflow',
  content text not null,
  severity text not null default 'info' check (severity in ('info', 'suggestion', 'issue', 'approval')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workflow_annotations_channel_id_idx
  on public.workflow_annotations (channel_id, created_at desc);

create index if not exists workflow_annotations_session_id_idx
  on public.workflow_annotations (session_id);

alter table public.workflow_annotations enable row level security;

create policy "workspace owners select workflow annotations"
  on public.workflow_annotations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = workflow_annotations.workspace_id
        and w.owner_id = (select auth.uid())
    )
  );

create policy "workspace owners insert workflow annotations"
  on public.workflow_annotations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workflow_annotations.workspace_id
        and w.owner_id = (select auth.uid())
    )
  );

-- Broadcast annotation changes to the same private channel topic as messages
alter table public.workflow_annotations replica identity full;

drop trigger if exists workflow_annotations_workspace_broadcast on public.workflow_annotations;
create trigger workflow_annotations_workspace_broadcast
  after insert or update or delete on public.workflow_annotations
  for each row
  execute function public.workspace_channel_broadcast();

-- Extend messages check for annotation type (if constrained)
-- message_type is text without enum in schema; annotation is handled at app layer

comment on table public.workflow_annotations is
  'Expertise-scoped agent annotations during multiplayer cohort sessions';
