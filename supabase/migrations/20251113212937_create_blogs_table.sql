-- Migration: Create blogs table with auto-generated slugs
-- Purpose: Create blog posts table with automatic slug generation from title
-- Affected: blogs table, slug generation function and trigger
-- Special considerations: Uses trigger to auto-generate slugs, implements RLS for public read and authenticated write

-- Create the blogs table
create table public.blogs (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  subtitle text,
  image text,
  content text not null,
  author text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.blogs is 'Blog posts with rich text content. Supports public reading and authenticated authoring.';

-- Create indexes for performance
create index blogs_slug_idx on public.blogs using btree (slug);
create index blogs_created_at_idx on public.blogs using btree (created_at desc);
create index blogs_author_idx on public.blogs using btree (author);

-- Enable Row Level Security
alter table public.blogs enable row level security;

-- Create RLS policies for blogs table

-- Select policy: Public read access for published blogs
create policy "Anyone can view blogs" 
on public.blogs 
for select 
to public 
using (true);

comment on policy "Anyone can view blogs" on public.blogs is 'Allows public read access to blog posts.';

-- Insert policy: Authenticated users can create blogs
create policy "Authenticated users can create blogs" 
on public.blogs 
for insert 
to authenticated 
with check (true);

comment on policy "Authenticated users can create blogs" on public.blogs is 'Allows authenticated users to create new blog posts.';

-- Update policy: Authenticated users can update blogs
create policy "Authenticated users can update blogs" 
on public.blogs 
for update 
to authenticated 
using (true)
with check (true);

comment on policy "Authenticated users can update blogs" on public.blogs is 'Allows authenticated users to update blog posts.';

-- Delete policy: Authenticated users can delete blogs
create policy "Authenticated users can delete blogs" 
on public.blogs 
for delete 
to authenticated 
using (true);

comment on policy "Authenticated users can delete blogs" on public.blogs is 'Allows authenticated users to delete blog posts.';

-- Create function to generate slug from title
create or replace function public.generate_slug(title_text text)
returns text
language plpgsql
security invoker
set search_path = ''
immutable
as $$
declare
  slug_text text;
begin
  -- Convert to lowercase, replace spaces and special chars with hyphens
  slug_text := lower(title_text);
  -- Remove special characters except spaces and hyphens
  slug_text := regexp_replace(slug_text, '[^a-z0-9\s-]', '', 'g');
  -- Replace multiple spaces/hyphens with single hyphen
  slug_text := regexp_replace(slug_text, '[\s-]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug_text := trim(both '-' from slug_text);
  
  return slug_text;
end;
$$;

comment on function public.generate_slug(text) is 'Generates a URL-friendly slug from a title by converting to lowercase, removing special characters, and replacing spaces with hyphens.';

-- Create function to ensure unique slug
create or replace function public.ensure_unique_slug(base_slug text, blog_id bigint default null)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  final_slug text;
  counter integer := 0;
begin
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current blog if updating)
  while exists (
    select 1 
    from public.blogs 
    where slug = final_slug 
    and (blog_id is null or id != blog_id)
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  end loop;
  
  return final_slug;
end;
$$;

comment on function public.ensure_unique_slug(text, bigint) is 'Ensures a unique slug by appending a counter if the base slug already exists.';

-- Create function to handle automatic slug generation
create or replace function public.handle_blog_slug()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_slug text;
  unique_slug text;
begin
  -- Only generate slug if it's not already set or if title changed
  if new.slug is null or new.slug = '' or (tg_op = 'update' and old.title != new.title) then
    base_slug := public.generate_slug(new.title);
    unique_slug := public.ensure_unique_slug(base_slug, new.id);
    new.slug := unique_slug;
  end if;
  
  return new;
end;
$$;

comment on function public.handle_blog_slug() is 'Trigger function to automatically generate a unique slug from the blog title.';

-- Create trigger to automatically generate slug on insert/update
create trigger handle_blogs_slug
  before insert or update on public.blogs
  for each row
  execute function public.handle_blog_slug();

comment on trigger handle_blogs_slug on public.blogs is 'Automatically generates a unique slug from the title when a blog is created or updated.';

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_blogs_updated_at()
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

comment on function public.handle_blogs_updated_at() is 'Trigger function to automatically update the updated_at timestamp when a blog record is modified.';

-- Create trigger to update the updated_at column
create trigger handle_blogs_updated_at_trigger
  before update on public.blogs
  for each row
  execute function public.handle_blogs_updated_at();

comment on trigger handle_blogs_updated_at_trigger on public.blogs is 'Automatically updates the updated_at timestamp when a blog record is modified.';

