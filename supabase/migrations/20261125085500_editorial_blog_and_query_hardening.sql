-- Additive editorial publishing; existing static articles remain untouched.
create table public.editorial_posts (
 slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=80),
 title text not null check (char_length(btrim(title)) between 8 and 160),
 summary text not null check (char_length(btrim(summary)) between 20 and 320),
 body text not null check (char_length(btrim(body)) between 50 and 16000),
 language text not null check (language in ('en','hi')),
 category text not null check (category in ('Architecture','Materials','Design','Technology','Learning','Platform')),
 cover text not null check (cover in ('architecture','materials','interior')),
 source_url text check (source_url is null or (source_url ~ '^https://' and char_length(source_url)<=500)),
 status text not null default 'draft' check (status in ('draft','published','archived')),
 reviewed boolean not null default false,
 version integer not null default 1 check(version>=1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 check (status <> 'published' or (reviewed and published_at is not null and char_length(btrim(body))>=150))
);
alter table public.editorial_posts enable row level security;
revoke all on public.editorial_posts from public, anon, authenticated;
grant select on public.editorial_posts to anon, authenticated;
grant insert, update on public.editorial_posts to authenticated;
create policy editorial_guest_read on public.editorial_posts for select to anon using(status='published');
create policy editorial_signed_read on public.editorial_posts for select to authenticated using(status='published' or ((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])) and (select public.neerva_account_access_allowed())));
create policy editorial_admin_insert on public.editorial_posts for insert to authenticated with check((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])) and (select public.neerva_account_access_allowed()));
create policy editorial_admin_update on public.editorial_posts for update to authenticated using((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])) and (select public.neerva_account_access_allowed())) with check((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])) and (select public.neerva_account_access_allowed()));
create index editorial_published_recent_idx on public.editorial_posts(published_at desc,slug) where status='published';
create index editorial_admin_recent_idx on public.editorial_posts(updated_at desc,slug);

create schema if not exists neerva_blog_internal;
revoke all on schema neerva_blog_internal from public,anon,authenticated;
create table neerva_blog_internal.editorial_events (
 id bigint generated always as identity primary key, slug text not null,
 actor_id uuid, old_status text, new_status text not null, version integer not null,
 created_at timestamptz not null default now()
);
alter table neerva_blog_internal.editorial_events enable row level security;
revoke all on neerva_blog_internal.editorial_events from public,anon,authenticated;
create function neerva_blog_internal.editorial_version() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.version=1; new.created_at=now(); new.published_at=null;
 else
  if new.slug<>old.slug then raise exception 'Editorial slug is immutable'; end if;
  new.version=old.version+1; new.created_at=old.created_at; new.published_at=old.published_at;
 end if;
 new.updated_at=now();
 if new.status='published' then new.published_at=coalesce(new.published_at,now()); end if;
 return new;
end $$;
create trigger editorial_version before insert or update on public.editorial_posts for each row execute function neerva_blog_internal.editorial_version();
create function neerva_blog_internal.editorial_audit() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into neerva_blog_internal.editorial_events(slug,actor_id,old_status,new_status,version)
 values(new.slug,auth.uid(),case when tg_op='UPDATE' then old.status else null end,new.status,new.version);
 return new;
end $$;
revoke all on function neerva_blog_internal.editorial_audit() from public,anon,authenticated;
create trigger editorial_audit after insert or update on public.editorial_posts for each row execute function neerva_blog_internal.editorial_audit();

-- Keep the exact existing role/tenant predicates; cache invariant identity lookup per statement.
alter policy quote_request_read_requester_or_invited_dealer_or_admin on public.quote_requests using (
 requester_id=(select auth.uid()) or public.has_platform_role(array['support','admin','super_admin']::public.platform_role[]) or exists(select 1 from public.quote_invites i where i.quote_request_id=quote_requests.id and public.is_tenant_member(i.tenant_id))
);
alter policy quote_offer_read_requester_dealer_admin on public.quote_offers using (
 exists(select 1 from public.quote_requests q where q.id=quote_offers.quote_request_id and q.requester_id=(select auth.uid())) or public.is_tenant_member(tenant_id) or public.has_platform_role(array['support','admin','super_admin']::public.platform_role[])
);
alter policy quote_offer_insert_tenant on public.quote_offers with check (
 created_by=(select auth.uid()) and public.is_tenant_member(tenant_id,array['owner','manager','sales']::text[]) and exists(select 1 from public.quote_invites i where i.quote_request_id=quote_offers.quote_request_id and i.tenant_id=quote_offers.tenant_id and i.status in ('invited','viewed'))
);
alter policy studio_support_read on public.studio_support_tickets using(user_id=(select auth.uid()) or public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
alter policy studio_support_create on public.studio_support_tickets with check(user_id=(select auth.uid()) and status='open' and admin_reply is null and resolved_at is null and (order_id is null or exists(select 1 from public.studio_paid_orders o where o.id=studio_support_tickets.order_id and o.user_id=(select auth.uid()))));
-- Targeted, previously uncovered branch/tenant relationship indexes; no destructive index changes.
create index if not exists neerva_pricing_branch_tenant_idx on public.pricing_rules(branch_id,tenant_id);
create index if not exists neerva_delivery_branch_tenant_idx on public.dealer_delivery_versions(branch_id,tenant_id);
create index if not exists neerva_product_requests_branch_tenant_idx on public.dealer_product_requests(branch_id,tenant_id);
