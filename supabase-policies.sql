-- Run this in Supabase SQL Editor if uploads or gallery loading are blocked.

-- 1) Memories table policies
alter table public.memories enable row level security;

create policy "Allow public read memories"
on public.memories
for select
to anon
using (true);

create policy "Allow public insert memories"
on public.memories
for insert
to anon
with check (true);

-- 2) Storage policies for wedding-memories bucket
create policy "Allow public read wedding memories"
on storage.objects
for select
to anon
using (bucket_id = 'wedding-memories');

create policy "Allow public upload wedding memories"
on storage.objects
for insert
to anon
with check (bucket_id = 'wedding-memories');
