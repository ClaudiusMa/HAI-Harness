-- Extend message types for external design tool sync

alter table public.messages drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in (
    'normal', 'update', 'blocker', 'task_complete', 'design_system_update',
    'asset_exported', 'external_sync'
  ));
