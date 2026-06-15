-- Realtime broadcast for workspace channels (messages + agent status)
-- Uses private topics: workspace:channel:{channel_id}

-- Full row data for update/delete broadcasts
alter table public.messages replica identity full;
alter table public.channel_agents replica identity full;

-- ---------------------------------------------------------------------------
-- Broadcast trigger: fan out DB changes to workspace channel topics
-- ---------------------------------------------------------------------------
create or replace function public.workspace_channel_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_channel_id uuid;
begin
  target_channel_id := coalesce(new.channel_id, old.channel_id);

  perform realtime.broadcast_changes(
    'workspace:channel:' || target_channel_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists messages_workspace_broadcast on public.messages;
create trigger messages_workspace_broadcast
  after insert or update or delete on public.messages
  for each row
  execute function public.workspace_channel_broadcast();

drop trigger if exists channel_agents_workspace_broadcast on public.channel_agents;
create trigger channel_agents_workspace_broadcast
  after insert or update or delete on public.channel_agents
  for each row
  execute function public.workspace_channel_broadcast();

-- ---------------------------------------------------------------------------
-- RLS: authenticated workspace owners can receive private broadcasts
-- ---------------------------------------------------------------------------
create policy "workspace owners can receive channel broadcasts"
  on realtime.messages
  for select
  to authenticated
  using (
    split_part(topic, ':', 1) = 'workspace'
    and split_part(topic, ':', 2) = 'channel'
    and exists (
      select 1
      from public.channels c
      join public.workspaces w on w.id = c.workspace_id
      where c.id = split_part(topic, ':', 3)::uuid
        and w.owner_id = (select auth.uid())
    )
  );
