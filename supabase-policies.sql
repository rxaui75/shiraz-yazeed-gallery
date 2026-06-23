-- Run this in Supabase SQL Editor if uploads or viewing do not work.
-- Bucket name must be: wedding-memories and should be Public.

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  file_path text,
  file_type text,
  media_kind text,
  guest_name text,
  message text,
  created_at timestamp with time zone default now()
);

alter table public.memories add column if not exists file_path text;
alter table public.memories add column if not exists media_kind text;
alter table public.memories add column if not exists guest_name text;
alter table public.memories add column if not exists message text;
alter table public.memories alter column created_at set default now();

alter table public.memories enable row level security;

drop policy if exists "Public can view memories" on public.memories;
create policy "Public can view memories" on public.memories
for select using (true);

drop policy if exists "Guests can insert memories" on public.memories;
create policy "Guests can insert memories" on public.memories
for insert with check (true);

-- Delete is enabled for the simple admin page. Remove this policy after the wedding if you want stricter security.
drop policy if exists "Admin can delete memories" on public.memories;
create policy "Admin can delete memories" on public.memories
for delete using (true);

insert into storage.buckets (id, name, public)
values ('wedding-memories', 'wedding-memories', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view wedding files" on storage.objects;
create policy "Public can view wedding files" on storage.objects
for select using (bucket_id = 'wedding-memories');

drop policy if exists "Guests can upload wedding files" on storage.objects;
create policy "Guests can upload wedding files" on storage.objects
for insert with check (bucket_id = 'wedding-memories');

-- Delete is enabled for the simple admin page. Remove this policy after the wedding if you want stricter security.
drop policy if exists "Admin can delete wedding files" on storage.objects;
create policy "Admin can delete wedding files" on storage.objects
for delete using (bucket_id = 'wedding-memories');
