-- Agent workspace: multi-agent Slack-like communication system
-- Tables: workspaces, agent_definitions, workspace_agents, channels, channel_members,
--         messages, shared_assets, message_assets

-- ---------------------------------------------------------------------------
-- Workspaces (one per user to start; extensible to teams)
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_id_idx on public.workspaces (owner_id);

alter table public.workspaces enable row level security;

create policy "Users can view own workspaces"
  on public.workspaces for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Users can insert own workspaces"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Users can update own workspaces"
  on public.workspaces for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users can delete own workspaces"
  on public.workspaces for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Agent definitions (global roster — seeded, readable by all authenticated)
-- ---------------------------------------------------------------------------
create table public.agent_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role text not null,
  tagline text not null,
  personality text not null,
  system_prompt text not null,
  avatar_color text not null default '#6366f1',
  icon text not null default 'bot',
  jobs jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.agent_definitions enable row level security;

create policy "Authenticated users can view agent definitions"
  on public.agent_definitions for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Workspace agents (instances with evolving memory per workspace)
-- ---------------------------------------------------------------------------
create table public.workspace_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  agent_definition_id uuid not null references public.agent_definitions (id) on delete cascade,
  custom_name text,
  memory_summary text not null default '',
  context jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_definition_id)
);

create index workspace_agents_workspace_id_idx on public.workspace_agents (workspace_id);

alter table public.workspace_agents enable row level security;

create policy "Users can view agents in own workspaces"
  on public.workspace_agents for select
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can insert agents in own workspaces"
  on public.workspace_agents for insert
  to authenticated
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can update agents in own workspaces"
  on public.workspace_agents for update
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can delete agents in own workspaces"
  on public.workspace_agents for delete
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Channels (direct, group, or thread)
-- ---------------------------------------------------------------------------
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  slug text not null,
  channel_type text not null check (channel_type in ('direct', 'group', 'thread')),
  description text,
  parent_channel_id uuid references public.channels (id) on delete cascade,
  forked_from_message_id uuid,
  default_agent_id uuid references public.workspace_agents (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index channels_workspace_id_idx on public.channels (workspace_id);
create index channels_parent_channel_id_idx on public.channels (parent_channel_id);

alter table public.channels enable row level security;

create policy "Users can view channels in own workspaces"
  on public.channels for select
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can insert channels in own workspaces"
  on public.channels for insert
  to authenticated
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can update channels in own workspaces"
  on public.channels for update
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can delete channels in own workspaces"
  on public.channels for delete
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

-- Add FK for forked_from_message_id after messages table exists (deferred)

-- ---------------------------------------------------------------------------
-- Channel members (users and agents)
-- ---------------------------------------------------------------------------
create table public.channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  member_type text not null check (member_type in ('user', 'agent')),
  user_id uuid references auth.users (id) on delete cascade,
  workspace_agent_id uuid references public.workspace_agents (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint channel_members_member_check check (
    (member_type = 'user' and user_id is not null and workspace_agent_id is null)
    or (member_type = 'agent' and workspace_agent_id is not null and user_id is null)
  )
);

create index channel_members_channel_id_idx on public.channel_members (channel_id);

alter table public.channel_members enable row level security;

create policy "Users can view channel members in own workspaces"
  on public.channel_members for select
  to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can insert channel members in own workspaces"
  on public.channel_members for insert
  to authenticated
  with check (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete channel members in own workspaces"
  on public.channel_members for delete
  to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  thread_id uuid references public.channels (id) on delete cascade,
  author_type text not null check (author_type in ('user', 'agent', 'system')),
  user_id uuid references auth.users (id) on delete set null,
  workspace_agent_id uuid references public.workspace_agents (id) on delete set null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  parent_message_id uuid references public.messages (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_author_check check (
    (author_type = 'user' and user_id is not null)
    or (author_type = 'agent' and workspace_agent_id is not null)
    or (author_type = 'system')
  )
);

create index messages_channel_id_idx on public.messages (channel_id);
create index messages_thread_id_idx on public.messages (thread_id);
create index messages_created_at_idx on public.messages (created_at);

alter table public.messages enable row level security;

create policy "Users can view messages in own workspaces"
  on public.messages for select
  to authenticated
  using (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can insert messages in own workspaces"
  on public.messages for insert
  to authenticated
  with check (
    channel_id in (
      select c.id from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can update messages in own workspaces"
  on public.messages for update
  to authenticated
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

-- Add deferred FK for forked_from_message_id
alter table public.channels
  add constraint channels_forked_from_message_id_fkey
  foreign key (forked_from_message_id) references public.messages (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Shared assets (multi-model shareable resources)
-- ---------------------------------------------------------------------------
create table public.shared_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  name text not null,
  asset_type text not null check (asset_type in ('image', 'file', 'link', 'code', 'text')),
  url text,
  content text,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index shared_assets_workspace_id_idx on public.shared_assets (workspace_id);

alter table public.shared_assets enable row level security;

create policy "Users can view assets in own workspaces"
  on public.shared_assets for select
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can insert assets in own workspaces"
  on public.shared_assets for insert
  to authenticated
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

create policy "Users can delete assets in own workspaces"
  on public.shared_assets for delete
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Message ↔ asset junction
-- ---------------------------------------------------------------------------
create table public.message_assets (
  message_id uuid not null references public.messages (id) on delete cascade,
  asset_id uuid not null references public.shared_assets (id) on delete cascade,
  primary key (message_id, asset_id)
);

alter table public.message_assets enable row level security;

create policy "Users can view message assets in own workspaces"
  on public.message_assets for select
  to authenticated
  using (
    message_id in (
      select m.id from public.messages m
      join public.channels c on c.id = m.channel_id
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

create policy "Users can insert message assets in own workspaces"
  on public.message_assets for insert
  to authenticated
  with check (
    message_id in (
      select m.id from public.messages m
      join public.channels c on c.id = m.channel_id
      join public.workspaces w on w.id = c.workspace_id
      where w.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Seed default agent definitions
-- ---------------------------------------------------------------------------
insert into public.agent_definitions (slug, name, role, tagline, personality, system_prompt, avatar_color, icon, jobs, sort_order)
values
  (
    'atlas',
    'Atlas',
    'Research Analyst',
    'Finds signal in the noise',
    'Curious, methodical, and thorough. Asks clarifying questions before diving in. Cites sources and surfaces trade-offs.',
    'You are Atlas, a research analyst agent. Your job is to investigate topics deeply, summarize findings clearly, and flag uncertainties. You work autonomously but keep the supervisor informed of your approach. Build on prior context in this workspace.',
    '#0ea5e9',
    'search',
    '["Research topics", "Summarize documents", "Compare options", "Fact-check claims"]'::jsonb,
    1
  ),
  (
    'nova',
    'Nova',
    'Software Engineer',
    'Ships clean, working code',
    'Pragmatic, precise, and action-oriented. Prefers small diffs and tests. Explains technical decisions in plain language.',
    'You are Nova, a software engineering agent. You write, review, and debug code. You follow existing project conventions and propose minimal, focused changes. Reference shared code assets when relevant.',
    '#8b5cf6',
    'code',
    '["Write code", "Review PRs", "Debug issues", "Propose architecture"]'::jsonb,
    2
  ),
  (
    'sage',
    'Sage',
    'Product Strategist',
    'Connects goals to execution',
    'Calm, strategic, and outcome-focused. Frames problems before solutions. Keeps an eye on scope and priorities.',
    'You are Sage, a product strategy agent. You help prioritize work, define success metrics, and align agent efforts with user goals. You coordinate with other agents when tasks span domains.',
    '#10b981',
    'compass',
    '["Prioritize backlog", "Write specs", "Define metrics", "Run retrospectives"]'::jsonb,
    3
  ),
  (
    'echo',
    'Echo',
    'Communications Writer',
    'Makes complex ideas clear',
    'Warm, articulate, and audience-aware. Adapts tone to context. Values clarity over cleverness.',
    'You are Echo, a communications agent. You draft emails, docs, announcements, and user-facing copy. You maintain consistent voice and incorporate feedback gracefully.',
    '#f59e0b',
    'pen',
    '["Draft copy", "Edit documents", "Write announcements", "Tone matching"]'::jsonb,
    4
  ),
  (
    'scout',
    'Scout',
    'Operations Coordinator',
    'Keeps everything on track',
    'Organized, proactive, and detail-oriented. Tracks status, deadlines, and blockers without being noisy.',
    'You are Scout, an operations agent. You track tasks, follow up on open items, and surface blockers. You help the supervisor maintain visibility across agent work.',
    '#ef4444',
    'clipboard',
    '["Track tasks", "Send reminders", "Summarize status", "Coordinate handoffs"]'::jsonb,
    5
  );

-- Enable realtime for messages (live updates in UI)
alter publication supabase_realtime add table public.messages;
