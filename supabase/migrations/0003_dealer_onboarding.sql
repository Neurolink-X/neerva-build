-- Phase 2: dealer onboarding. Additive schema only; do not apply before a dedicated Neerva database exists.
-- Applications are not proof of GST registration or a verified dealer badge.
create table public.dealer_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete restrict,
  owner_id uuid not null unique references auth.users(id) on delete restrict,
  legal_business_name text not null check (char_length(legal_business_name) between 3 and 160),
  gstin text not null unique check (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$'),
  shop_city text not null check (char_length(shop_city) between 2 and 80),
  status text not null default 'draft' check (status in ('draft','submitted','changes_requested','approved','rejected','suspended')),
  gstin_verification text not null default 'unverified' check (gstin_verification in ('unverified','verified','rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  decision_reason text check (decision_reason is null or char_length(decision_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'approved' or (gstin_verification = 'verified' and reviewed_by is not null and reviewed_at is not null)),
  check (status <> 'submitted' or submitted_at is not null)
);
create index dealer_applications_queue_idx on public.dealer_applications(status, submitted_at desc);

create table public.dealer_service_pincodes (
  application_id uuid not null references public.dealer_applications(id) on delete cascade,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  primary key (application_id, pincode)
);
create index dealer_service_pincodes_pin_idx on public.dealer_service_pincodes(pincode);

create table public.dealer_categories (
  application_id uuid not null references public.dealer_applications(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  primary key (application_id, category_id)
);

-- Private storage bucket only. Browser must never receive unrestricted object URLs.
create table public.dealer_shop_photos (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.dealer_applications(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  storage_path text not null unique check (char_length(storage_path) between 40 and 255),
  content_type text not null check (content_type in ('image/jpeg','image/png','image/webp')),
  file_bytes bigint not null check (file_bytes between 1 and 5242880),
  review_status text not null default 'pending' check (review_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);
create index dealer_shop_photos_app_idx on public.dealer_shop_photos(application_id);

create table public.dealer_review_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.dealer_applications(id),
  reviewer_id uuid not null references auth.users(id),
  action text not null check (action in ('request_changes','verify_gstin','verify_photo','approve','reject','suspend','reactivate')),
  safe_note text check (safe_note is null or char_length(safe_note) <= 500),
  created_at timestamptz not null default now()
);
create index dealer_review_events_app_idx on public.dealer_review_events(application_id, created_at desc);

alter table public.dealer_applications enable row level security;
alter table public.dealer_service_pincodes enable row level security;
alter table public.dealer_categories enable row level security;
alter table public.dealer_shop_photos enable row level security;
alter table public.dealer_review_events enable row level security;

-- Keep all KYC and review tables inaccessible to anonymous visitors.
revoke all on public.dealer_applications, public.dealer_service_pincodes, public.dealer_categories,
  public.dealer_shop_photos, public.dealer_review_events from anon, authenticated;
grant select, insert, update on public.dealer_applications to authenticated;
grant select, insert, delete on public.dealer_service_pincodes, public.dealer_categories to authenticated;
grant select, insert on public.dealer_shop_photos to authenticated;
grant select on public.dealer_review_events to authenticated;

create policy dealer_application_read on public.dealer_applications for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy dealer_application_create on public.dealer_applications for insert to authenticated
  with check (owner_id = (select auth.uid())
    and (select public.is_tenant_member(tenant_id, array['owner']::text[]))
    and status = 'draft' and gstin_verification = 'unverified'
    and submitted_at is null and reviewed_at is null and reviewed_by is null);
create policy dealer_application_edit_draft on public.dealer_applications for update to authenticated
  using (owner_id = (select auth.uid()) and status in ('draft','changes_requested'))
  with check (owner_id = (select auth.uid()) and status in ('draft','submitted')
    and gstin_verification = 'unverified' and reviewed_by is null and reviewed_at is null);

create policy dealer_pins_read on public.dealer_service_pincodes for select to authenticated
  using (exists (select 1 from public.dealer_applications a where a.id = application_id));
create policy dealer_pins_create on public.dealer_service_pincodes for insert to authenticated
  with check (exists (select 1 from public.dealer_applications a where a.id = application_id
    and a.owner_id = (select auth.uid()) and a.status in ('draft','changes_requested')));
create policy dealer_pins_remove on public.dealer_service_pincodes for delete to authenticated
  using (exists (select 1 from public.dealer_applications a where a.id = application_id
    and a.owner_id = (select auth.uid()) and a.status in ('draft','changes_requested')));

create policy dealer_categories_read on public.dealer_categories for select to authenticated
  using (exists (select 1 from public.dealer_applications a where a.id = application_id));
create policy dealer_categories_create on public.dealer_categories for insert to authenticated
  with check (exists (select 1 from public.dealer_applications a where a.id = application_id
    and a.owner_id = (select auth.uid()) and a.status in ('draft','changes_requested')));
create policy dealer_categories_remove on public.dealer_categories for delete to authenticated
  using (exists (select 1 from public.dealer_applications a where a.id = application_id
    and a.owner_id = (select auth.uid()) and a.status in ('draft','changes_requested')));

create policy dealer_photos_read on public.dealer_shop_photos for select to authenticated
  using (exists (select 1 from public.dealer_applications a where a.id = application_id));
create policy dealer_photos_create on public.dealer_shop_photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and review_status = 'pending'
    and split_part(storage_path, '/', 1) = application_id::text
    and exists (select 1 from public.dealer_applications a where a.id = application_id
      and a.owner_id = (select auth.uid()) and a.status in ('draft','changes_requested')));

create policy dealer_review_events_admin_read on public.dealer_review_events for select to authenticated
  using ((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));

-- SECURITY NOTE: verified flags, review events, tenant activation and merchant branch
-- activation have no end-user write policy. A reviewed server-only transaction must
-- perform the full approval atomically and create an append-only audit event.
-- Do not treat an approved row as publicly live until that transaction is implemented.
