-- Private customer concepts, independent of architect-published studio catalogue.
-- Never automatically publish or treat a customer draft as a permitted building plan.
create table if not exists public.studio_customer_projects(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 idempotency_key uuid not null,
 title text not null check(char_length(title) between 3 and 120),
 plot_width_ft numeric(9,2) not null check(plot_width_ft between 10 and 200),
 plot_depth_ft numeric(9,2) not null check(plot_depth_ft between 15 and 250),
 road_side text not null check(road_side in ('N','E','S','W')),
 floors integer not null check(floors between 1 and 2),
 bedrooms integer not null check(bedrooms between 1 and 3),
 parking boolean not null default true,
 plan_json jsonb not null check(jsonb_typeof(plan_json)='object' and octet_length(plan_json::text)<=90000),
 plan_sha256 text not null check(plan_sha256 ~ '^[0-9a-f]{64}$'),
 status text not null default 'draft' check(status='draft'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id,idempotency_key)
);
create index if not exists studio_customer_project_recent_idx on public.studio_customer_projects(owner_id,updated_at desc);
alter table public.studio_customer_projects enable row level security;
revoke all on public.studio_customer_projects from anon,authenticated,public;
grant select,insert,delete on public.studio_customer_projects to authenticated;
drop policy if exists studio_project_self_read on public.studio_customer_projects;
create policy studio_project_self_read on public.studio_customer_projects for select to authenticated
 using(owner_id=(select auth.uid()));
drop policy if exists studio_project_self_insert on public.studio_customer_projects;
create policy studio_project_self_insert on public.studio_customer_projects for insert to authenticated
 with check(owner_id=(select auth.uid()) and status='draft');
drop policy if exists studio_project_self_delete on public.studio_customer_projects;
create policy studio_project_self_delete on public.studio_customer_projects for delete to authenticated
 using(owner_id=(select auth.uid()));
comment on table public.studio_customer_projects is
 'RLS-private road/parking spatial concept draft, not a registered construction drawing, approved design or order.';
