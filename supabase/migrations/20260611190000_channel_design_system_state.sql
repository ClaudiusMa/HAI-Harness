-- Persist Alex design system state per channel (tokens, components, artboard sync)

alter table public.channels
  add column if not exists design_system_state jsonb not null default '{}'::jsonb;

-- Extend message types for design system updates
alter table public.messages drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in ('normal', 'update', 'blocker', 'task_complete', 'design_system_update'));
