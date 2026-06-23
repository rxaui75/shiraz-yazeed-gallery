# Shiraz & Yazeed Memory Wall

Upload these files to GitHub Pages.

Supabase setup:
- Bucket: `wedding-memories` and make it Public.
- Table: `memories` columns:
  - `id` uuid primary key default `gen_random_uuid()`
  - `file_url` text
  - `file_type` text
  - `guest_name` text
  - `message` text
  - `created_at` timestamp default `now()`

If uploads do not work, open Supabase SQL Editor and run `supabase-policies.sql`.
