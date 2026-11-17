-- fleurıs — optional cloud graph storage
--
-- Run this in the Supabase SQL editor (hosted project) or save it as a
-- migration when using the Supabase CLI. Every row belongs to exactly one
-- signed-in user, and row-level security keeps users apart.

create extension if not exists pgcrypto;

create table if not exists public.graphs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  title text not null default 'Untitled graph',
  description text not null default '',
  nodes jsonb not null default '[]'::jsonb,
  connections jsonb not null default '[]'::jsonb,
  view jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graphs_user_id_slug_key unique (user_id, slug),
  constraint graphs_slug_length check (char_length(slug) between 1 and 64),
  constraint graphs_nodes_array check (jsonb_typeof(nodes) = 'array'),
  constraint graphs_connections_array check (jsonb_typeof(connections) = 'array')
);

create index if not exists graphs_user_updated_idx
  on public.graphs (user_id, updated_at desc);

alter table public.graphs enable row level security;

-- Re-running this file should be safe.
drop policy if exists "Users can read their own graphs" on public.graphs;
drop policy if exists "Users can create their own graphs" on public.graphs;
drop policy if exists "Users can update their own graphs" on public.graphs;
drop policy if exists "Users can delete their own graphs" on public.graphs;

create policy "Users can read their own graphs"
  on public.graphs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own graphs"
  on public.graphs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own graphs"
  on public.graphs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own graphs"
  on public.graphs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.graphs from anon;
grant select, insert, update, delete on table public.graphs to authenticated;

-- Make PostgREST pick up the table immediately instead of serving a stale
-- "Could not find the table 'public.graphs' in the schema cache" error.
notify pgrst, 'reload schema';
