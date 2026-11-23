-- Neerva Build Phase A schema — REVIEW ONLY; do not apply to unrelated projects.
-- Apply only to a dedicated Neerva PostgreSQL/Supabase project after role/RLS tests.
-- No city regulatory values, image sources or legal approvals are seeded here.

create table public.studio_city_rules (
 id uuid primary key default gen_random_uuid(),
 city_slug text not null check (city_slug ~ '^[a-z][a-z-]{2,45}$'),
 version integer not null check (version > 0),
 authority_name text,
 source_url text check (source_url is null or source_url ~ '^https://'),
 legal_effective_on date,
 front_setback_ft numeric(7,2) check (front_setback_ft >= 0),
 rear_setback_ft numeric(7,2) check (rear_setback_ft >= 0),
 left_setback_ft numeric(7,2) check (left_setback_ft >= 0),
 right_setback_ft numeric(7,2) check (right_setback_ft >= 0),
 habitable_min_sqft numeric(8,2) check (habitable_min_sqft > 0),
 kitchen_min_sqft numeric(8,2) check (kitchen_min_sqft > 0),
 bath_min_sqft numeric(8,2) check (bath_min_sqft > 0),
 max_far numeric(6,2) check (max_far > 0),
 status text not null default 'draft' check (status in ('draft','in_review','verified','archived')),
 created_by uuid references auth.users(id),
 reviewed_by uuid references auth.users(id),
 verified_on date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (city_slug, version),
 check (status <> 'verified' or (
    authority_name is not null and source_url is not null and
    legal_effective_on is not null and verified_on is not null and reviewed_by is not null and
    front_setback_ft is not null and rear_setback_ft is not null and left_setback_ft is not null and right_setback_ft is not null and
    habitable_min_sqft is not null and kitchen_min_sqft is not null and bath_min_sqft is not null
 ))
);
create unique index studio_city_one_verified_version on public.studio_city_rules (city_slug) where status='verified';

create table public.studio_design_records (
 id uuid primary key default gen_random_uuid(),
 slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 version integer not null check (version > 0),
 title_en text not null check (length(title_en) between 4 and 120),
 title_hi text,
 plot_width_ft numeric(7,2) not null check (plot_width_ft > 0),
 plot_depth_ft numeric(7,2) not null check (plot_depth_ft > 0),
 facing text not null check (facing in ('North','South','East','West')),
 floors integer not null check (floors between 1 and 4),
 bedrooms integer not null check (bedrooms between 1 and 8),
 style_slug text not null,
 plan_json jsonb not null check (jsonb_typeof(plan_json)='object'),
 plan_sha256 text not null check (plan_sha256 ~ '^[a-f0-9]{64}$'),
 derived_metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(derived_metrics)='object'),
 status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
 created_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(slug,version),
 check (status<>'published' or (reviewed_by is not null and published_at is not null))
);
create unique index studio_design_one_published_version on public.studio_design_records (slug) where status='published';
create index studio_design_filter_idx on public.studio_design_records (status,plot_width_ft,plot_depth_ft,floors,bedrooms);

create table public.studio_design_assets (
 id uuid primary key default gen_random_uuid(),
 design_id uuid not null references public.studio_design_records(id) on delete cascade,
 asset_kind text not null check (asset_kind in ('exterior','interior','mask','model')),
 angle text not null check (length(angle) between 2 and 48),
 storage_path text not null unique check (storage_path ~ '^[a-zA-Z0-9/_-]+[.][a-zA-Z0-9]+$' and storage_path !~ '[.][.]'),
 sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
 width_px integer check (width_px between 64 and 16000),
 height_px integer check (height_px between 64 and 16000),
 mask_schema_version integer check (mask_schema_version > 0),
 license_kind text not null check (license_kind in ('original','licensed','sample')),
 license_proof text,
 alt_text text not null default '',
 status text not null default 'draft' check (status in ('draft','in_review','approved','rejected')),
 created_by uuid not null references auth.users(id),
 approved_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 approved_at timestamptz,
 check(status<>'approved' or (
  approved_by is not null and approved_at is not null and
  license_kind in ('original','licensed') and license_proof is not null and
  length(alt_text)>=12 and
  (asset_kind in ('model','mask') or (width_px is not null and height_px is not null))
 ))
);
create index studio_asset_design_status_idx on public.studio_design_assets(design_id,status,asset_kind);

create table public.studio_user_favourites (
 user_id uuid not null references auth.users(id) on delete cascade,
 design_id uuid not null references public.studio_design_records(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (user_id,design_id)
);

create table public.studio_design_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 design_id uuid references public.studio_design_records(id),
 action text not null check (action in ('created','edited','submitted','approved','published','archived','asset-reviewed','city-rule-reviewed')),
 safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata)='object'),
 created_at timestamptz not null default now()
);

alter table public.studio_city_rules enable row level security;
alter table public.studio_design_records enable row level security;
alter table public.studio_design_assets enable row level security;
alter table public.studio_user_favourites enable row level security;
alter table public.studio_design_audit enable row level security;

revoke all on public.studio_city_rules,public.studio_design_records,public.studio_design_assets,
 public.studio_user_favourites,public.studio_design_audit from anon,authenticated;
grant select on public.studio_city_rules,public.studio_design_records,public.studio_design_assets to anon,authenticated;
grant insert,update on public.studio_city_rules,public.studio_design_records,public.studio_design_assets to authenticated;
grant select,insert,delete on public.studio_user_favourites to authenticated;
grant select,insert on public.studio_design_audit to authenticated;

create policy studio_city_public_verified on public.studio_city_rules for select to anon,authenticated
 using (status='verified');
create policy studio_city_admin_read on public.studio_city_rules for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy studio_city_admin_insert on public.studio_city_rules for insert to authenticated
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]) and status='draft' and created_by=(select auth.uid()));
create policy studio_city_admin_update on public.studio_city_rules for update to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy studio_design_public_published on public.studio_design_records for select to anon,authenticated
 using (status='published');
create policy studio_design_staff_read on public.studio_design_records for select to authenticated
 using (public.has_platform_role(array['design_professional','admin','super_admin']::public.platform_role[]));
create policy studio_design_staff_create_draft on public.studio_design_records for insert to authenticated
 with check (created_by=(select auth.uid()) and status='draft' and public.has_platform_role(array['design_professional','admin','super_admin']::public.platform_role[]));
create policy studio_design_admin_update on public.studio_design_records for update to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy studio_assets_public_approved on public.studio_design_assets for select to anon,authenticated
 using (status='approved' and license_kind in ('original','licensed') and
 exists(select 1 from public.studio_design_records d where d.id=design_id and d.status='published'));
create policy studio_assets_staff_read on public.studio_design_assets for select to authenticated
 using (public.has_platform_role(array['design_professional','admin','super_admin']::public.platform_role[]));
create policy studio_assets_staff_draft on public.studio_design_assets for insert to authenticated
 with check (created_by=(select auth.uid()) and status='draft' and public.has_platform_role(array['design_professional','admin','super_admin']::public.platform_role[]));
create policy studio_assets_admin_update on public.studio_design_assets for update to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy studio_favourites_self_read on public.studio_user_favourites for select to authenticated
 using (user_id=(select auth.uid()));
create policy studio_favourites_self_insert on public.studio_user_favourites for insert to authenticated
 with check (user_id=(select auth.uid()) and exists (
  select 1 from public.studio_design_records d where d.id=design_id and d.status='published'
 ));
create policy studio_favourites_self_delete on public.studio_user_favourites for delete to authenticated
 using (user_id=(select auth.uid()));

create policy studio_audit_admin_read on public.studio_design_audit for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy studio_audit_admin_append on public.studio_design_audit for insert to authenticated
 with check (actor_id=(select auth.uid()) and public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
-- No UPDATE/DELETE grant on the append-only audit table.
