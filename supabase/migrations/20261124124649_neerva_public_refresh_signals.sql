create table public.public_refresh_signals (
 topic text primary key check(topic in ('catalog','studio')),
 version bigint not null default 1 check(version>0),
 updated_at timestamptz not null default now()
);
insert into public.public_refresh_signals(topic) values('catalog'),('studio');
alter table public.public_refresh_signals enable row level security;
revoke all on public.public_refresh_signals from public,anon,authenticated;
grant select on public.public_refresh_signals to anon,authenticated;
create policy public_refresh_signal_read on public.public_refresh_signals for select to anon,authenticated using (true);
create function neerva_internal.bump_public_refresh() returns trigger language plpgsql security definer set search_path='' as $$
declare before_row jsonb:='{}';after_row jsonb:='{}';should_bump boolean; topic_name text:=TG_ARGV[0];
begin
 if TG_OP<>'INSERT' then before_row:=to_jsonb(old);end if;
 if TG_OP<>'DELETE' then after_row:=to_jsonb(new);end if;
 if TG_OP='UPDATE' and before_row=after_row then return null;end if;
 if TG_TABLE_NAME='studio_feature_settings' then
 should_bump:=coalesce((before_row->>'is_published')::boolean,false) or coalesce((after_row->>'is_published')::boolean,false);
 elsif TG_TABLE_NAME='pricing_rules' then
 should_bump:=coalesce(before_row->>'status'='published' and before_row->>'visibility'='public',false) or coalesce(after_row->>'status'='published' and after_row->>'visibility'='public',false);
 elsif TG_TABLE_NAME='catalog_product_media' then
 should_bump:=coalesce((before_row->>'published')::boolean,false) or coalesce((after_row->>'published')::boolean,false);
 else
 should_bump:=coalesce(before_row->>'status'='published',false) or coalesce(after_row->>'status'='published',false);
 end if;
 if should_bump then update public.public_refresh_signals set version=version+1,updated_at=clock_timestamp() where topic=topic_name;end if;
 return null;
end;$$;
revoke all on function neerva_internal.bump_public_refresh() from public,anon,authenticated;
create trigger refresh_public_studio after insert or update or delete on public.studio_feature_settings for each row execute function neerva_internal.bump_public_refresh('studio');
create trigger refresh_public_prices after insert or update or delete on public.pricing_rules for each row execute function neerva_internal.bump_public_refresh('catalog');
create trigger refresh_public_offers after insert or update or delete on public.catalog_campaigns for each row execute function neerva_internal.bump_public_refresh('catalog');
create trigger refresh_public_products after insert or update or delete on public.products for each row execute function neerva_internal.bump_public_refresh('catalog');
create trigger refresh_public_variants after insert or update or delete on public.product_variants for each row execute function neerva_internal.bump_public_refresh('catalog');
create trigger refresh_public_categories after insert or update or delete on public.categories for each row execute function neerva_internal.bump_public_refresh('catalog');
create trigger refresh_public_media after insert or update or delete on public.catalog_product_media for each row execute function neerva_internal.bump_public_refresh('catalog');
alter publication supabase_realtime add table public.public_refresh_signals;