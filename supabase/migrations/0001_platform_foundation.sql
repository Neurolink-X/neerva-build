create extension if not exists pgcrypto;

create type public.platform_role as enum ('customer','contractor','dealer','dealer_staff','design_professional','support','finance','admin','super_admin');
create type public.catalog_visibility as enum ('draft','published','archived');
create type public.price_visibility as enum ('public','quote_only');
create type public.rfq_status as enum ('open','quoted','accepted','expired','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  preferred_locale text not null default 'en' check (preferred_locale in ('en','hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_role_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.platform_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 2 and 160),
  status text not null default 'pending' check (status in ('pending','active','suspended','closed')),
  created_at timestamptz not null default now()
);

create table public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname text not null unique,
  is_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (hostname = lower(hostname)),
  check ((is_verified and verified_at is not null) or (not is_verified))
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','sales','inventory','dispatch','accounts')),
  permissions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id),
  slug text not null unique,
  name_en text not null,
  name_hi text not null,
  pricing_mode public.price_visibility not null default 'public',
  status public.catalog_visibility not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  authorized_source text,
  status public.catalog_visibility not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  brand_id uuid references public.brands(id),
  slug text not null unique,
  name text not null,
  description text not null default '',
  attributes jsonb not null default '{}',
  status public.catalog_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  unit text not null,
  attributes jsonb not null default '{}',
  status public.catalog_visibility not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.merchant_branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  city text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name, pincode)
);

create table public.inventory (
  branch_id uuid not null references public.merchant_branches(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  available_quantity numeric(14,3) not null default 0 check (available_quantity >= 0),
  unit text not null,
  updated_at timestamptz not null default now(),
  primary key (branch_id, variant_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.merchant_branches(id),
  variant_id uuid not null references public.product_variants(id),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit text not null,
  reason text not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  branch_id uuid references public.merchant_branches(id),
  variant_id uuid not null references public.product_variants(id),
  city text not null,
  pincode_prefix text,
  minimum_quantity numeric(14,3) not null default 1 check (minimum_quantity > 0),
  unit text not null,
  amount_paise bigint not null check (amount_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  visibility public.price_visibility not null default 'public',
  status text not null default 'draft' check (status in ('draft','pending_approval','published','expired','rejected')),
  valid_from timestamptz not null,
  valid_to timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from),
  check (pincode_prefix is null or pincode_prefix ~ '^[1-9][0-9]{0,5}$')
);

create index pricing_lookup_idx on public.pricing_rules (variant_id, city, status, valid_from desc);
create index pricing_tenant_idx on public.pricing_rules (tenant_id, branch_id, variant_id);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  pricing_rule_id uuid not null references public.pricing_rules(id),
  version integer not null,
  prior_amount_paise bigint check (prior_amount_paise is null or prior_amount_paise >= 0),
  new_amount_paise bigint not null check (new_amount_paise >= 0),
  reason text not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (pricing_rule_id, version)
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  requester_id uuid references auth.users(id),
  category_slug text not null,
  material_description text not null check (char_length(material_description) between 3 and 240),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  city text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  requested_date date,
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  status public.rfq_status not null default 'open',
  created_at timestamptz not null default now()
);

create index quote_city_status_idx on public.quote_requests (city, status, created_at desc);
create index quote_requester_idx on public.quote_requests (requester_id, created_at desc);

create table public.quote_offers (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  revision integer not null default 1 check (revision > 0),
  line_items jsonb not null,
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  tax_paise bigint not null check (tax_paise >= 0),
  freight_paise bigint not null check (freight_paise >= 0),
  unloading_paise bigint not null check (unloading_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  terms text not null,
  valid_until timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (quote_request_id, tenant_id, revision)
);

create table public.quote_invites (
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  status text not null default 'invited' check (status in ('invited','viewed','declined','responded','expired')),
  primary key (quote_request_id, tenant_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  tenant_id uuid references public.tenants(id),
  action text not null,
  object_type text not null,
  object_id text,
  safe_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.system_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null unique,
  module text not null,
  severity text not null check (severity in ('info','warning','error','critical')),
  safe_summary text not null,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','investigating','resolved','ignored')),
  safe_trace text
);

create or replace function public.is_tenant_member(p_tenant_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = p_tenant_id and m.user_id = auth.uid() and m.active
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

create or replace function public.has_platform_role(p_roles public.platform_role[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.platform_role_grants g
    where g.user_id = auth.uid() and g.role = any(p_roles)
  );
$$;

revoke all on function public.is_tenant_member(uuid, text[]) from public, anon;
grant execute on function public.is_tenant_member(uuid, text[]) to authenticated;
revoke all on function public.has_platform_role(public.platform_role[]) from public, anon;
grant execute on function public.has_platform_role(public.platform_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.platform_role_grants enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.merchant_branches enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.price_history enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_offers enable row level security;
alter table public.quote_invites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_incidents enable row level security;

create policy profile_read_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profile_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy role_grants_read_self_or_admin on public.platform_role_grants for select to authenticated using (user_id = auth.uid() or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy categories_public_read on public.categories for select to anon, authenticated using (status = 'published');
create policy brands_public_read on public.brands for select to anon, authenticated using (status = 'published');
create policy products_public_read on public.products for select to anon, authenticated using (status = 'published');
create policy variants_public_read on public.product_variants for select to anon, authenticated using (status = 'published');

create policy tenant_read_member on public.tenants for select to authenticated using (public.is_tenant_member(id) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy tenant_domain_read_member on public.tenant_domains for select to authenticated using (public.is_tenant_member(tenant_id) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy membership_read_same_tenant on public.tenant_memberships for select to authenticated using (user_id = auth.uid() or public.is_tenant_member(tenant_id, array['owner','manager']) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy branch_read_approved on public.merchant_branches for select to anon, authenticated using (approved);
create policy branch_manage_tenant on public.merchant_branches for all to authenticated using (public.is_tenant_member(tenant_id, array['owner','manager']) or public.has_platform_role(array['admin','super_admin']::public.platform_role[])) with check (public.is_tenant_member(tenant_id, array['owner','manager']) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy inventory_manage_tenant on public.inventory for all to authenticated using (exists (select 1 from public.merchant_branches b where b.id = branch_id and public.is_tenant_member(b.tenant_id, array['owner','manager','inventory']))) with check (exists (select 1 from public.merchant_branches b where b.id = branch_id and public.is_tenant_member(b.tenant_id, array['owner','manager','inventory'])));
create policy inventory_movement_read_tenant on public.inventory_movements for select to authenticated using (exists (select 1 from public.merchant_branches b where b.id = branch_id and public.is_tenant_member(b.tenant_id)) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

create policy public_published_prices_read on public.pricing_rules for select to anon, authenticated using (
  status = 'published' and visibility = 'public'
  and valid_from <= now() and (valid_to is null or valid_to > now())
  and exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.categories c on c.id = p.category_id
    where v.id = variant_id and v.status = 'published' and p.status = 'published'
      and c.status = 'published' and c.pricing_mode = 'public'
  )
  and (branch_id is null or exists (
    select 1 from public.merchant_branches b where b.id = branch_id and b.approved
  ))
);
create policy tenant_manage_pricing on public.pricing_rules for all to authenticated using (tenant_id is not null and public.is_tenant_member(tenant_id, array['owner','manager']) or public.has_platform_role(array['admin','super_admin']::public.platform_role[])) with check (tenant_id is not null and public.is_tenant_member(tenant_id, array['owner','manager']) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy price_history_read_admin on public.price_history for select to authenticated using (public.has_platform_role(array['admin','super_admin','finance']::public.platform_role[]));

create policy quote_request_read_requester_or_invited_dealer_or_admin on public.quote_requests for select to authenticated using (
  requester_id = auth.uid()
  or public.has_platform_role(array['support','admin','super_admin']::public.platform_role[])
  or exists (select 1 from public.quote_invites i where i.quote_request_id = id and public.is_tenant_member(i.tenant_id))
);
create policy quote_invite_read_invited_tenant_or_admin on public.quote_invites for select to authenticated using (public.is_tenant_member(tenant_id) or public.has_platform_role(array['support','admin','super_admin']::public.platform_role[]));
create policy quote_invite_insert_admin on public.quote_invites for insert to authenticated with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy quote_offer_read_requester_dealer_admin on public.quote_offers for select to authenticated using (
  exists (select 1 from public.quote_requests q where q.id = quote_request_id and q.requester_id = auth.uid())
  or public.is_tenant_member(tenant_id)
  or public.has_platform_role(array['support','admin','super_admin']::public.platform_role[])
);
create policy quote_offer_insert_tenant on public.quote_offers for insert to authenticated with check (
  public.is_tenant_member(tenant_id, array['owner','manager','sales'])
  and exists (select 1 from public.quote_invites i where i.quote_request_id = quote_offers.quote_request_id and i.tenant_id = quote_offers.tenant_id and i.status in ('invited','viewed'))
);

create policy audit_read_admin on public.audit_logs for select to authenticated using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
create policy incident_read_admin on public.system_incidents for select to authenticated using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

grant select on public.categories, public.brands, public.products, public.product_variants, public.merchant_branches, public.pricing_rules to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.platform_role_grants, public.tenants, public.tenant_domains, public.tenant_memberships, public.inventory_movements, public.price_history, public.quote_requests, public.quote_offers, public.audit_logs, public.system_incidents to authenticated;
grant select on public.quote_invites to authenticated;
grant insert, update, delete on public.merchant_branches, public.inventory, public.pricing_rules to authenticated;
grant insert on public.inventory_movements, public.quote_offers to authenticated;
grant insert on public.quote_invites to authenticated;

comment on table public.pricing_rules is 'Amounts are integer paise. quote_only records are never exposed through public pricing responses.';
comment on table public.quote_offers is 'Dealer offers are private; never expose across tenant boundaries.';
comment on table public.system_incidents is 'Sanitized production event summaries only. Do not store secrets or unnecessary personal data.';
