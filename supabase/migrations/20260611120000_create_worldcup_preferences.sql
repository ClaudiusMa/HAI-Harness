-- Migration: Create worldcup_preferences table
-- Purpose: Store per-user World Cup companion settings (favorite team, alerts, onboarding)
-- Affected: worldcup_preferences table

create table public.worldcup_preferences (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade not null unique,
  favorite_team_code text,
  followed_team_codes text[] not null default '{}',
  experience_level text not null default 'newcomer'
    check (experience_level in ('newcomer', 'casual', 'diehard')),
  timezone text not null default 'America/New_York',
  notify_match_start boolean not null default true,
  notify_goals boolean not null default true,
  notify_final_scores boolean not null default true,
  show_term_tooltips boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.worldcup_preferences is 'User preferences for the World Cup 2026 companion app.';

create index worldcup_preferences_user_id_idx on public.worldcup_preferences using btree (user_id);

alter table public.worldcup_preferences enable row level security;

create policy "Users can view their own worldcup preferences"
on public.worldcup_preferences
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own worldcup preferences"
on public.worldcup_preferences
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own worldcup preferences"
on public.worldcup_preferences
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Users can delete their own worldcup preferences"
on public.worldcup_preferences
for delete
to authenticated
using ( (select auth.uid()) = user_id );

create trigger handle_worldcup_preferences_updated_at
  before update on public.worldcup_preferences
  for each row
  execute function public.handle_updated_at();
