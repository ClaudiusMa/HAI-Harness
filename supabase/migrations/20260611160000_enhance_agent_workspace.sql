-- Enhance agent workspace: project domains, channel agents, versioning, typed messages

-- ---------------------------------------------------------------------------
-- Channels: project/domain fields
-- ---------------------------------------------------------------------------
alter table public.channels
  add column if not exists domain text,
  add column if not exists context_summary text not null default '',
  add column if not exists status text not null default 'active'
    check (status in ('active', 'archived', 'paused'));

-- ---------------------------------------------------------------------------
-- Per-channel agent configuration (role aliases, instructions, status)
-- ---------------------------------------------------------------------------
create table public.channel_agents (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  workspace_agent_id uuid not null references public.workspace_agents (id) on delete cascade,
  role_alias text not null,
  instructions text not null default '',
  instructions_version numeric(4, 1) not null default 1.0,
  status text not null default 'idle'
    check (status in ('idle', 'thinking', 'working', 'blocked', 'offline')),
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, workspace_agent_id)
);

create index channel_agents_channel_id_idx on public.channel_agents (channel_id);

alter table public.channel_agents enable row level security;

create policy "Users can view channel agents in own workspaces"
  on public.channel_agents for select to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can insert channel agents in own workspaces"
  on public.channel_agents for insert to authenticated
  with check (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can update channel agents in own workspaces"
  on public.channel_agents for update to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  )
  with check (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete channel agents in own workspaces"
  on public.channel_agents for delete to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Workspace agents: global status and instructions
-- ---------------------------------------------------------------------------
alter table public.workspace_agents
  add column if not exists status text not null default 'idle'
    check (status in ('idle', 'thinking', 'working', 'blocked', 'offline')),
  add column if not exists instructions_version numeric(4, 1) not null default 1.0,
  add column if not exists current_instructions text not null default '',
  add column if not exists agent_state jsonb not null default '{}'::jsonb,
  add column if not exists status_updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Instruction version history (channel-scoped and global)
-- ---------------------------------------------------------------------------
create table public.agent_instruction_history (
  id uuid primary key default gen_random_uuid(),
  channel_agent_id uuid references public.channel_agents (id) on delete cascade,
  workspace_agent_id uuid references public.workspace_agents (id) on delete cascade,
  version numeric(4, 1) not null,
  instructions text not null,
  change_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint agent_instruction_history_target_check check (
    channel_agent_id is not null or workspace_agent_id is not null
  )
);

alter table public.agent_instruction_history enable row level security;

create policy "Users can view instruction history in own workspaces"
  on public.agent_instruction_history for select to authenticated
  using (true);

create policy "Users can insert instruction history in own workspaces"
  on public.agent_instruction_history for insert to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Channel context version history
-- ---------------------------------------------------------------------------
create table public.channel_context_history (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  context_summary text not null,
  version int not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.channel_context_history enable row level security;

create policy "Users can view channel context history in own workspaces"
  on public.channel_context_history for select to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can insert channel context history in own workspaces"
  on public.channel_context_history for insert to authenticated
  with check (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Messages: typed status updates
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists message_type text not null default 'normal'
    check (message_type in ('normal', 'update', 'blocker', 'task_complete'));

-- ---------------------------------------------------------------------------
-- Shared assets: channel scope + extended types
-- ---------------------------------------------------------------------------
alter table public.shared_assets
  add column if not exists channel_id uuid references public.channels (id) on delete set null;

alter table public.shared_assets drop constraint if exists shared_assets_asset_type_check;

alter table public.shared_assets
  add constraint shared_assets_asset_type_check
  check (asset_type in ('image', 'file', 'link', 'code', 'text', 'document', 'audio', 'video'));
