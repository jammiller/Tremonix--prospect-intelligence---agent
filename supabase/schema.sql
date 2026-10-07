-- Run once in your Supabase project's SQL Editor before using the application.
create table if not exists public.prospects (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data) = 'object'),
 updated_at timestamptz not null default now()
);
create index if not exists prospects_user_id_idx on public.prospects(user_id);
alter table public.prospects enable row level security;
revoke all on public.prospects from anon;
grant select, insert, update, delete on public.prospects to authenticated;
create policy "Read own prospects" on public.prospects for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own prospects" on public.prospects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own prospects" on public.prospects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own prospects" on public.prospects for delete to authenticated using ((select auth.uid()) = user_id);
