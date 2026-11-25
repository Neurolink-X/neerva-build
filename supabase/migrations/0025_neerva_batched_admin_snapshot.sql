-- Restored from existing production migration 20261124122148 neerva_batched_admin_snapshot; local replay only, do not reapply to production.
create function public.neerva_admin_snapshot() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.neerva_account_access_allowed() or not public.has_platform_role(array['admin','super_admin']::public.platform_role[]) then raise exception 'Administrator access required' using errcode='42501';end if;
 return jsonb_build_object('counts',jsonb_build_object('orders',(select count(*) from public.orders),'requests',(select count(*) from public.quote_requests),'products',(select count(*) from public.products),'variants',(select count(*) from public.product_variants),'dealers',(select count(*) from public.tenants),'customers',(select count(*) from public.profiles),'publishedPrices',(select count(*) from public.pricing_rules where status='published' and visibility='public' and valid_from<=now() and (valid_to is null or valid_to>now())),'openIncidents',(select count(*) from public.system_incidents where status in ('open','investigating'))),'studio',(select coalesce(jsonb_agg(jsonb_build_object('product_code',product_code,'access_mode',access_mode,'checkout_enabled',checkout_enabled,'is_published',is_published,'price_paise',price_paise) order by product_code),'[]'::jsonb) from public.studio_feature_settings));
end;$$;
revoke all on function public.neerva_admin_snapshot() from public,anon,authenticated;
grant execute on function public.neerva_admin_snapshot() to authenticated;
create function public.neerva_admin_access_allowed() returns boolean language sql stable security invoker set search_path='' as $$select public.neerva_account_access_allowed() and public.has_platform_role(array['admin','super_admin']::public.platform_role[])$$;
revoke all on function public.neerva_admin_access_allowed() from public,anon,authenticated;
grant execute on function public.neerva_admin_access_allowed() to authenticated;
