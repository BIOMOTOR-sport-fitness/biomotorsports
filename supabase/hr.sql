-- BIOMOTOR Device Nexus: heart-rate sessions and HRV tests in their own table (run once in Supabase → SQL Editor).
-- Why: the heart-rate curve of every session made the one big organisation record (org_data) grow fast; now each
-- session is its own small row. Safe to run again.

-- athletes the signed-in account may see (Athlete: own profile, Parent: own children) – same rules as the platform
create or replace function public.my_athlete_ids() returns text[]
language sql stable security definer set search_path = public as $$
  with me as (select lower(email) em, role from profiles where id = auth.uid() and status = 'Active'),
       d  as (select data::jsonb j from org_data where id = 'main'),
       u  as (select x->>'id' uid from d, me, jsonb_array_elements(coalesce(d.j->'users','[]'::jsonb)) x
              where lower(x->>'email') = me.em and coalesce(x->>'status','') <> 'Archived')
  select coalesce(array_agg(distinct a), '{}') from (
    select l->>'athlete' a from d, me, jsonb_array_elements(coalesce(d.j->(case when me.role = 'Parent' then 'parentLinks' else 'athLinks' end),'[]'::jsonb)) l
      where l->>'status' = 'Active' and l->>'user' in (select uid from u)
    union
    select x->>'id' from d, me, jsonb_array_elements(coalesce(d.j->'athletes','[]'::jsonb)) x
      where (me.role = 'Athlete' and lower(coalesce(x->>'email','')) = me.em)
         or (me.role = 'Parent' and me.em in (lower(coalesce(x->>'parentEmail','')), lower(coalesce(x->>'guardianEmail',''))))
    union
    select i->>'athlete' from d, me, jsonb_array_elements(coalesce(d.j->'invites','[]'::jsonb)) i
      where lower(i->>'email') = me.em and i->>'role' = me.role and coalesce(i->>'athlete','') <> '' and coalesce(i->>'status','') <> 'Revoked'
  ) s where a is not null
$$;
grant execute on function public.my_athlete_ids() to authenticated;
revoke execute on function public.my_athlete_ids() from anon;

create table if not exists public.hr_logs (
  id          text primary key,                       -- the platform's own id (hs_…, hv_…)
  athlete_id  text not null,
  kind        text not null check (kind in ('HR','HRV')),
  log_date    date not null,
  data        public.shubham not null default '{}'::jsonb,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email       text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists hr_logs_ath on public.hr_logs (athlete_id, log_date);
alter table public.hr_logs enable row level security;
drop policy if exists hr_read on public.hr_logs;
drop policy if exists hr_insert on public.hr_logs;
drop policy if exists hr_update on public.hr_logs;
drop policy if exists hr_delete on public.hr_logs;
-- staff see everything; athletes / parents see their own athletes' sessions (also the ones a coach recorded)
create policy hr_read   on public.hr_logs for select to authenticated using (is_editor() or user_id = auth.uid() or athlete_id in (select unnest(public.my_athlete_ids())));
create policy hr_insert on public.hr_logs for insert to authenticated with check (user_id = auth.uid() and is_member() and (is_editor() or athlete_id in (select unnest(public.my_athlete_ids()))));
create policy hr_update on public.hr_logs for update to authenticated using (is_editor()) with check (is_editor());
create policy hr_delete on public.hr_logs for delete to authenticated using (is_editor() or user_id = auth.uid());
