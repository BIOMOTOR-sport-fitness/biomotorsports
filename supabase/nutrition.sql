-- BIOMOTOR Sport Nutrition: athlete meal log (run once in Supabase → SQL Editor)
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email text not null default '',
  athlete_id text not null,
  log_date date not null default current_date,
  meal text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists meal_logs_ath on public.meal_logs (athlete_id, log_date);
alter table public.meal_logs enable row level security;
drop policy if exists ml_read on public.meal_logs;
drop policy if exists ml_insert on public.meal_logs;
drop policy if exists ml_delete on public.meal_logs;
create policy ml_read on public.meal_logs for select to authenticated using (user_id = auth.uid() or is_editor());
create policy ml_insert on public.meal_logs for insert to authenticated with check (user_id = auth.uid() and is_member());
create policy ml_delete on public.meal_logs for delete to authenticated using (user_id = auth.uid() or is_admin());
