-- =====================================================================
--  BIOMOTOR Sport and Fitness — Supabase setup
--  Owner: Shubham kale · founder.shubhamkale@gmail.com · 9321766523
--  Run this whole file ONCE in Supabase → SQL Editor → New query → Run.
--  Safe to run again (it updates functions and policies in place).
-- =====================================================================

-- 0) Shubham — BIOMOTOR's own data type -------------------------------
--    All platform data is stored as type "shubham". This block is the only
--    place that says what Shubham is built on inside the database.
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where t.typname = 'shubham' and n.nspname = 'public') then
    create domain public.shubham as jsonb;
  end if;
end $$;

-- Shubham list → one row per item
create or replace function public.shubham_items(v public.shubham) returns setof public.shubham
language sql immutable as $$
  select e::public.shubham from jsonb_array_elements(coalesce(v::jsonb, '[]'::jsonb)) e
$$;

-- 1) Tables -----------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  phone       text not null default '',
  role        text not null default 'Coach',
  status      text not null default 'Pending',   -- Pending | Active | Disabled | Rejected | Removed
  owner       boolean not null default false,
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);

create table if not exists public.org_data (
  id          text primary key,                  -- always 'main'
  data        public.shubham not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

-- existing database (made by an older setup.sql): switch the data column to Shubham
alter table public.org_data alter column data type public.shubham;

alter table public.profiles enable row level security;
alter table public.org_data enable row level security;

-- 2) Helpers ----------------------------------------------------------
create or replace function public.owner_email() returns text
language sql immutable as $$ select 'founder.shubhamkale@gmail.com'::text $$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'Active' from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'Active' and (owner or role in ('Owner','Organization Admin'))
                   from profiles where id = auth.uid()), false)
$$;

-- Can change organisation data: owner and staff. Athlete, Parent and Viewer accounts are view-only.
create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'Active' and (owner or role not in ('Athlete','Parent','Viewer'))
                   from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select owner from profiles where id = auth.uid()), false)
$$;

-- 3) New sign-up -> profile row (owner email becomes Owner automatically)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_own boolean := lower(new.email) = owner_email();
  req    text    := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'Coach');
begin
  if req in ('Owner','Organization Admin') then req := 'Coach'; end if;
  insert into profiles (id, name, email, phone, role, status, owner)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name',''), new.raw_user_meta_data->>'full_name', ''),
          lower(new.email),
          coalesce(new.raw_user_meta_data->>'phone', ''),
          case when is_own then 'Owner' else req end,
          case when is_own then 'Active' else 'Pending' end,
          is_own)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Owner protection: nobody can change the owner row, make a new Owner,
--    or (unless they are the owner) create / change Organization Admins.
create or replace function public.protect_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
declare me_owner boolean := coalesce((select owner from profiles where id = auth.uid()), false);
begin
  if auth.uid() is null then return new; end if;   -- SQL Editor / service role: owner's own admin access
  new.id := old.id; new.email := old.email; new.created_at := old.created_at;
  if old.owner then
    new.owner := true; new.role := 'Owner'; new.status := 'Active';
    if auth.uid() is distinct from old.id then new.name := old.name; new.phone := old.phone; end if;
  else
    new.owner := false;
    if new.role = 'Owner' then new.role := old.role; end if;
    if not me_owner and new.role is distinct from old.role
       and (new.role = 'Organization Admin' or old.role = 'Organization Admin') then
      new.role := old.role;
    end if;
    if not me_owner and old.role = 'Organization Admin' and new.status is distinct from old.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profiles on public.profiles;
create trigger protect_profiles before update on public.profiles
  for each row execute function public.protect_profiles();

-- 5) Row Level Security policies ------------------------------------
drop policy if exists prof_read   on public.profiles;
drop policy if exists prof_update on public.profiles;
drop policy if exists data_read   on public.org_data;
drop policy if exists data_insert on public.org_data;
drop policy if exists data_update on public.org_data;

create policy prof_read   on public.profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy prof_update on public.profiles for update to authenticated using (is_admin()) with check (is_admin());
create policy data_read   on public.org_data for select to authenticated using (is_member());
create policy data_insert on public.org_data for insert to authenticated with check (is_editor() and id = 'main');
create policy data_update on public.org_data for update to authenticated using (is_editor()) with check (is_editor() and id = 'main');

-- 6) Functions the app calls ----------------------------------------
create or replace function public.touch_login() returns void
language sql security definer set search_path = public as $$
  update profiles set last_login = now() where id = auth.uid()
$$;

-- Invite link: activates the signed-in person if an invite for their email is pending
create or replace function public.accept_invite(tok text) returns text
language plpgsql security definer set search_path = public as $$
declare inv public.shubham; em text;
begin
  select email into em from profiles where id = auth.uid() and not owner;
  if em is null then return 'no-profile'; end if;
  select e into inv
    from org_data d, public.shubham_items(d.data->'invites') e
   where d.id = 'main' and e->>'token' = tok and e->>'status' = 'Pending'
     and lower(e->>'email') = em
     and coalesce(e->>'expires', '9999-12-31') >= to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM-DD')
   limit 1;
  if inv is null then return 'not-found'; end if;
  update profiles
     set status = 'Active',
         role = case when inv->>'role' in ('Owner','Organization Admin') then 'Coach' else coalesce(inv->>'role','Coach') end
   where id = auth.uid() and status = 'Pending';
  return coalesce(inv->>'role', 'Coach');
end $$;

-- API access for signed-in users (row rules above still decide which rows they see)
grant usage on schema public to anon, authenticated;
grant select, update          on public.profiles to authenticated;
grant select, insert, update  on public.org_data to authenticated;
grant execute on function public.touch_login()        to authenticated;
grant execute on function public.accept_invite(text)  to authenticated;
grant execute on function public.shubham_items(public.shubham) to authenticated;

revoke execute on function public.touch_login()      from anon;
revoke execute on function public.accept_invite(text) from anon;

-- 7) Live updates between devices ------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.org_data;
exception when duplicate_object then null; when undefined_object then null;
end $$;

-- 8) If the owner signed up BEFORE running this file, fix the owner row:
insert into public.profiles (id, name, email, role, status, owner)
select id, 'Shubham kale', lower(email), 'Owner', 'Active', true
  from auth.users where lower(email) = public.owner_email()
on conflict (id) do update set role = 'Owner', status = 'Active', owner = true;

-- 9) Owner email changed (now founder.shubhamkale@gmail.com): the old owner login, if any,
--    becomes an Organization Admin so only the new email is Owner.
update public.profiles set owner = false, role = 'Organization Admin'
 where owner and lower(email) <> public.owner_email();
