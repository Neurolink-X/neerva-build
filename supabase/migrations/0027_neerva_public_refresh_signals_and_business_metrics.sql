-- Restored from existing production migration 20261124124649 neerva_public_refresh_signals; local replay only, do not reapply to production.
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

-- Restored from existing production migration 20261124124917 neerva_admin_business_metrics; local replay only, do not reapply to production.
create function public.neerva_admin_business_metrics(p_days integer default 30) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare cutoff timestamptz; result jsonb;
begin
 if not public.neerva_admin_access_allowed() then raise exception 'Admin required' using errcode='42501';end if;
 if p_days is null or p_days not in (7,30,90) then raise exception 'Invalid reporting period' using errcode='22023';end if;
 cutoff:=now()-make_interval(days=>p_days);
 select jsonb_build_object('days',p_days,'since',cutoff,'asOf',now(),
 'orders',(select jsonb_build_object('total',count(*),'delivered',count(*) filter(where status='delivered'),'cancelled',count(*) filter(where status in ('cancelled','declined')),'active',count(*) filter(where status in ('pending_confirmation','confirmed','preparing','out_for_delivery')),'acceptedValuePaise',coalesce(sum(total_paise) filter(where status not in ('cancelled','declined')),0),'deliveredValuePaise',coalesce(sum(total_paise) filter(where status='delivered'),0)) from public.orders where created_at>=cutoff),
 'quotes',(select count(*) from public.quote_requests where created_at>=cutoff),
 'studio',(select jsonb_build_object('verifiedCount',count(*) filter(where status='verified'),'verifiedPaise',coalesce(sum(amount_paise) filter(where status='verified'),0),'refundedCount',count(*) filter(where status='refunded'),'refundedPaise',coalesce(sum(amount_paise) filter(where status='refunded'),0),'requestedCount',count(*) filter(where status='requested')) from public.studio_paid_orders where created_at>=cutoff),
 'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day,'orders',d.n,'valuePaise',d.amount) order by d.day),'[]'::jsonb) from (select (created_at at time zone 'Asia/Kolkata')::date as day,count(*) as n,coalesce(sum(total_paise) filter(where status not in ('cancelled','declined')),0) as amount from public.orders where created_at>=cutoff group by 1) d)) into result;
 return result;
end;$$;
revoke all on function public.neerva_admin_business_metrics(integer) from public,anon,authenticated;
grant execute on function public.neerva_admin_business_metrics(integer) to authenticated;
