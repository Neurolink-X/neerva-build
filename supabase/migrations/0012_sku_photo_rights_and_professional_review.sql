-- PR26 / 2026-11-23: exact-SKU photographs, rights evidence and external architect review gates.
-- No photo, logo, stock or plan is auto-approved. Existing archived demo products are unaffected.
create table if not exists public.catalog_sku_media(
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null references public.product_variants(id) on delete cascade,
 sku text not null check(length(sku) between 3 and 120),
 image_path text not null check(image_path ~ '^/images/catalog/sku/[a-z0-9][a-z0-9/_-]{3,160}[.](webp|avif|png|jpg|jpeg)$'),
 alt_text text not null check(length(alt_text) between 12 and 240),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(variant_id,image_path)
);
create table if not exists public.catalog_media_evidence(
 media_id uuid primary key references public.catalog_sku_media(id) on delete cascade,
 rights_basis text not null check(rights_basis in ('manufacturer_written_permission','authorised_dealer_written_permission','licensed_product_photography')),
 permission_reference text not null check(length(permission_reference) between 10 and 500),
 source_url text not null check(source_url ~ '^https://'),
 image_sha256 text not null check(image_sha256 ~ '^[0-9a-f]{64}$'),
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 created_at timestamptz not null default now()
);
create or replace function public.neerva_check_sku_media_approval()
returns trigger language plpgsql security invoker
set search_path=pg_catalog,public,auth,pg_temp as $$
declare current_sku text;
begin
 if tg_op='UPDATE' and (new.variant_id is distinct from old.variant_id or new.image_path is distinct from old.image_path or new.sku is distinct from old.sku) then
  raise exception using errcode='23514',message='SKU_MEDIA_IDENTITY_IMMUTABLE';
 end if;
 select sku into current_sku from public.product_variants where id=new.variant_id;
 if current_sku is null or current_sku<>new.sku then
  raise exception using errcode='23514',message='EXACT_MANUFACTURER_SKU_REQUIRED';
 end if;
 if new.status='approved' then
  if new.reviewed_by is distinct from auth.uid() or new.reviewed_at is null then
   raise exception using errcode='23514',message='REAL_MEDIA_REVIEWER_REQUIRED';
  end if;
  if not exists(select 1 from public.catalog_media_evidence ev where ev.media_id=new.id and ev.verified_by is not null and ev.verified_at is not null and ev.verified_by<>auth.uid()) then
   raise exception using errcode='23514',message='INDEPENDENT_MEDIA_RIGHTS_EVIDENCE_REQUIRED';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.neerva_check_sku_media_approval() from public,anon,authenticated;
drop trigger if exists neerva_sku_media_gate on public.catalog_sku_media;
create trigger neerva_sku_media_gate before insert or update on public.catalog_sku_media
for each row execute function public.neerva_check_sku_media_approval();
alter table public.catalog_sku_media enable row level security;
alter table public.catalog_media_evidence enable row level security;
revoke all on public.catalog_sku_media,public.catalog_media_evidence from public,anon,authenticated;
grant select on public.catalog_sku_media to anon,authenticated;
grant select,insert,update on public.catalog_sku_media,public.catalog_media_evidence to authenticated;
create policy sku_media_public_approved_read on public.catalog_sku_media for select to anon,authenticated
 using(status='approved' and exists(
  select 1 from public.product_variants v where v.id=variant_id and v.sku=sku and v.status='published'::public.catalog_visibility
 ));
create policy sku_media_admin_all on public.catalog_sku_media for all to authenticated
 using(public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check(public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy sku_evidence_admin_all on public.catalog_media_evidence for all to authenticated
 using(public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check(public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create index if not exists sku_media_published_variant_idx on public.catalog_sku_media(variant_id) where status='approved';
comment on table public.catalog_sku_media is 'Approved manufacturer-specific SKU photographs ONLY; approval requires independent documented rights review. No rows imply no verified imagery.';
-- Studio review queue is private: storing a certificate reference is not itself architect sign-off.
create table if not exists public.studio_professional_review_requests(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.studio_customer_projects(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'requested' check(status in ('requested','documents_pending','professional_review_pending','closed')),
 reviewer_registration_reference text,
 review_evidence_reference text,
 requested_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id)
);
alter table public.studio_professional_review_requests enable row level security;
revoke all on public.studio_professional_review_requests from public,anon,authenticated;
grant select,insert on public.studio_professional_review_requests to authenticated;
create policy studio_professional_owner_read on public.studio_professional_review_requests for select to authenticated
 using(owner_id=(select auth.uid()));
create policy studio_professional_owner_request on public.studio_professional_review_requests for insert to authenticated
 with check(owner_id=(select auth.uid()) and status='requested' and reviewer_registration_reference is null
  and review_evidence_reference is null and exists(
   select 1 from public.studio_customer_projects p where p.id=project_id and p.owner_id=(select auth.uid())
  ));
create policy studio_professional_admin_read on public.studio_professional_review_requests for select to authenticated
 using(public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
-- No 'approved' state: external credential checks and professional document sign-off are not implemented.
comment on table public.studio_professional_review_requests is 'Tracking request for external architect review; never an automatic approval or building permission.';
