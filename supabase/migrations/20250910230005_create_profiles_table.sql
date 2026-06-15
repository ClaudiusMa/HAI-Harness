-- Migration: Create profiles table with RLS and auto-creation trigger
-- Purpose: Create extended user profile data table with automatic profile creation on user signup
-- Affected: profiles table, auth.users trigger
-- Special considerations: Uses trigger to auto-create profile records, implements RLS for user data isolation

-- Create the profiles table
create table public.profiles (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade not null unique,
  first_name text,
  avatar_url text,
  email text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.profiles is 'Extended user profile data linked to auth.users. Contains optional personal information and preferences.';

-- Create indexes for performance
create index profiles_user_id_idx on public.profiles using btree (user_id);
create index profiles_email_idx on public.profiles using btree (email);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create RLS policies for profiles table

-- Select policy: Users can only view their own profile
create policy "Users can view their own profile" 
on public.profiles 
for select 
to authenticated 
using ( (select auth.uid()) = user_id );

-- Insert policy: Users can only create their own profile (though trigger handles this)
create policy "Users can create their own profile" 
on public.profiles 
for insert 
to authenticated 
with check ( (select auth.uid()) = user_id );

-- Update policy: Users can only update their own profile
create policy "Users can update their own profile" 
on public.profiles 
for update 
to authenticated 
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

-- Delete policy: Users can only delete their own profile
create policy "Users can delete their own profile" 
on public.profiles 
for delete 
to authenticated 
using ( (select auth.uid()) = user_id );

-- Create function to handle automatic profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Insert a new profile record for the new user
  -- Extract email from the new user record and create profile
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Trigger function to automatically create a profile record when a new user signs up through auth.users.';

-- Create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Update the updated_at timestamp on row modification
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.handle_updated_at() is 'Trigger function to automatically update the updated_at timestamp when a record is modified.';

-- Create trigger to update the updated_at column
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

comment on trigger handle_profiles_updated_at on public.profiles is 'Automatically updates the updated_at timestamp when a profile record is modified.';
