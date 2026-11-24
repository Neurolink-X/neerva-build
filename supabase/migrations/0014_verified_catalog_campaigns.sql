-- Neerva: only genuine, reviewable catalog offers. Never simulate stock or a countdown.
-- Baseline price is snapshotted at review and must still match a published public price.
create table if not exists public.catalog_campaigns (
 id uuid primary key default gen_random_uuid(),
 pricing_rule_id uuid not null references public.pricing_rules(id) on delete restrict,
 title text not null check (char_length(title) between 8 and 90),
 terms text not null check (char_length(terms) between 12 and 400),
 base_amount_paise bigint not null check (base_amount_paise > 0),
 offer_amount_paise bigint not null check (offer_amount_paise > 0 and offer_amount_paise < base_amount_paise),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'draft' check (status in ('draft','published','expired')),
 created_by uuid references auth.users(id),
 published_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 published_at timestamptz,
 check (ends_at > starts_at)
);
create index if not exists catalog_campaign_window_idx on public.catalog_campaigns
 (pricing_rule_id,status,starts_at,ends_at);
create unique index if not exists catalog_campaign_one_published_per_rule_idx
 on public.catalog_campaigns (pricing_rule_id) where status='published';

alter table public.catalog_campaigns enable row level security;
revoke all on public.catalog_campaigns from public,anon,authenticated;
grant select on public.catalog_campaigns to anon,authenticated;
grant insert,update on public.catalog_campaigns to authenticated;

drop policy if exists catalog_campaign_public_active on public.catalog_campaigns;
create policy catalog_campaign_public_active on public.catalog_campaigns for select to anon,authenticated
 using (
  status='published' and starts_at<=now() and ends_at>now()
  and exists (
   select 1 from public.pricing_rules p
   where p.id=pricing_rule_id and p.status='published' and p.visibility='public'
    and p.valid_from<=now() and (p.valid_to is null or p.valid_to>now())
    and p.amount_paise=base_amount_paise
  )
 );
drop policy if exists catalog_campaign_admin_all on public.catalog_campaigns;
create policy catalog_campaign_admin_all on public.catalog_campaigns for all to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

-- Avoid silently changing an advertised promotion after publication.
create or replace function public.neerva_lock_published_campaign()
returns trigger language plpgsql security invoker
set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op='UPDATE' and old.status='published' then
  if new.pricing_rule_id is distinct from old.pricing_rule_id
   or new.title is distinct from old.title
   or new.terms is distinct from old.terms
   or new.base_amount_paise is distinct from old.base_amount_paise
   or new.offer_amount_paise is distinct from old.offer_amount_paise
   or new.starts_at is distinct from old.starts_at
   or new.ends_at is distinct from old.ends_at
   or new.status not in ('published','expired') then
    raise exception using errcode='23514',message='PUBLISHED_CAMPAIGN_IMMUTABLE';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.neerva_lock_published_campaign() from public,anon,authenticated;
drop trigger if exists lock_catalog_campaign on public.catalog_campaigns;
create trigger lock_catalog_campaign before update on public.catalog_campaigns
for each row execute function public.neerva_lock_published_campaign();
