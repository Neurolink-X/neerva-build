-- One shipment from one eligible branch; never multiply a shipment charge per SKU.
-- Existing dealer comparison validates published stock, rates and reviewed tax/delivery.
create function neerva_internal.combined_cart_estimate(p_items jsonb,p_pin text,p_unload boolean)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; n integer; policy_category text;
begin
 if auth.uid() is null or not public.neerva_account_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or coalesce(jsonb_array_length(p_items),0) not between 1 and 25 or p_pin !~ '^[1-9][0-9]{5}$' then raise exception 'INVALID_CART' using errcode='22023';end if;
 n:=jsonb_array_length(p_items);
 if exists(select 1 from jsonb_array_elements(p_items) x where coalesce(x->>'category','') !~ '^[a-z0-9-]{1,40}$' or coalesce(x->>'productSlug','') !~ '^[a-z0-9-]{1,100}$' or jsonb_typeof(x->'quantity') is distinct from 'number' or (x->>'quantity')::numeric not between .001 and 1000000 or coalesce(x->>'unit','')='' ) then raise exception 'INVALID_CART' using errcode='22023';end if;
 if (select count(distinct (x->>'category',x->>'productSlug',x->>'unit')) from jsonb_array_elements(p_items) x)<>n then raise exception 'DUPLICATE_CART' using errcode='22023';end if;
 select case when count(distinct x->>'category')=1 then min(x->>'category') else null end into policy_category from jsonb_array_elements(p_items) x;
 with items as (select x,i from jsonb_array_elements(p_items) with ordinality t(x,i)),
 matches as (
 select i,r.* from items cross join lateral public.neerva_compare_dealer_prices(x->>'category',x->>'productSlug',p_pin,(x->>'quantity')::numeric) r
 where r.unit=x->>'unit' and r.estimated_total_paise is not null
 and exists(select 1 from public.merchant_branches b join public.dealer_applications a on a.tenant_id=b.tenant_id join public.dealer_categories dc on dc.application_id=a.id join public.categories c on c.id=dc.category_id where b.id=r.branch_id and a.status='approved' and a.owner_id<>auth.uid() and c.slug=x->>'category')
 ),
 exact as (select i from matches group by i having count(distinct sku)=1),
 combined as (select m.branch_id,min(m.seller) seller,sum(m.material_paise)::bigint material_paise,sum(m.tax_paise)::bigint tax_paise,max(m.freight_paise) freight_paise,case when p_unload then max(m.unloading_paise) else 0 end unloading_paise,min(m.valid_to) valid_to,max(m.lead_days) lead_days
 from matches m join exact e using(i) group by m.branch_id having count(*)=n and count(distinct m.i)=n and count(distinct m.freight_paise)=1 and count(distinct m.unloading_paise)=1),
 priced as (select c.*,coalesce(public.neerva_fee_amount(c.material_paise,f.fixed_paise,f.rate_bps,f.cap_paise),0) fee_paise,coalesce(public.neerva_discount_amount(c.material_paise,f.discount_fixed_paise,f.discount_rate_bps,f.discount_cap_paise,f.discount_minimum_paise),0) discount_paise from combined c left join lateral public.neerva_effective_fee(policy_category,p_pin) f on true)
 select to_jsonb(z) into result from (select p.*,p.material_paise+p.tax_paise+p.freight_paise+p.unloading_paise+p.fee_paise-p.discount_paise estimated_total_paise from priced p order by  p.material_paise+p.tax_paise+p.freight_paise+p.unloading_paise+p.fee_paise-p.discount_paise,p.branch_id limit 1) z;
 return result;
end;$$;
revoke all on function neerva_internal.combined_cart_estimate(jsonb,text,boolean) from public,anon,authenticated;
grant execute on function neerva_internal.combined_cart_estimate(jsonb,text,boolean) to authenticated;
create function public.neerva_combined_cart_estimate(p_items jsonb,p_pin text,p_unload boolean) returns jsonb language sql stable security invoker set search_path='' as $$select neerva_internal.combined_cart_estimate(p_items,p_pin,p_unload)$$;
revoke all on function public.neerva_combined_cart_estimate(jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.neerva_combined_cart_estimate(jsonb,text,boolean) to authenticated;

alter table public.direct_orders add column unloading_requested boolean not null default false;
grant insert(unloading_requested),select(unloading_requested) on public.direct_orders to authenticated;
create table public.direct_order_sourcing (
 order_id uuid primary key references public.direct_orders(id),
 branch_id uuid not null references public.merchant_branches(id),
 tenant_id uuid not null references public.tenants(id),
 line_items jsonb not null, pincode text not null,
 estimate jsonb not null, status text not null default 'assigned' check(status in ('assigned','acknowledged','declined','closed')),
 created_at timestamptz not null default now()
);
alter table public.direct_order_sourcing enable row level security;
revoke all on public.direct_order_sourcing from public,anon,authenticated;
grant select on public.direct_order_sourcing to authenticated;
create policy sourcing_admin_read on public.direct_order_sourcing for select to authenticated using((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy sourcing_dealer_read on public.direct_order_sourcing for select to authenticated using(public.is_tenant_member(tenant_id,array['owner','manager','sales']::text[]) and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create function neerva_internal.assign_direct_sourcing() returns trigger language plpgsql security definer set search_path='' as $$
declare estimate jsonb; bid uuid;
begin
 if tg_op='UPDATE' then
  if new.status='cancelled' then update public.direct_order_sourcing set status='closed' where order_id=new.id;end if;
  return new;
 end if;
 -- A sourcing assignment is not a reservation, acceptance or shipment.
 estimate:=neerva_internal.combined_cart_estimate(new.line_items,new.pincode,new.unloading_requested);
 if estimate is null then return new;end if;
 bid:=(estimate->>'branch_id')::uuid;
 insert into public.direct_order_sourcing(order_id,branch_id,tenant_id,line_items,pincode,estimate)
 select new.id,b.id,b.tenant_id,new.line_items,new.pincode,estimate from public.merchant_branches b where b.id=bid;
 return new;
exception when others then
 -- Intake remains available even if the optional pricing/routing dependency fails.
 raise warning 'Direct sourcing estimate unavailable; admin review required';
 return new;
end;$$;
revoke all on function neerva_internal.assign_direct_sourcing() from public,anon,authenticated;
create trigger direct_sourcing_assignment after insert or update of status on public.direct_orders for each row execute function neerva_internal.assign_direct_sourcing();
create function neerva_internal.respond_direct_sourcing(p_order uuid,p_accept boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.neerva_account_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 update public.direct_order_sourcing s set status=case when p_accept then 'acknowledged' else 'declined' end
 where s.order_id=p_order and s.status='assigned' and public.is_tenant_member(s.tenant_id,array['owner','manager','sales']::text[]) and exists(select 1 from public.tenants t where t.id=s.tenant_id and t.status='active');
 return found;
end;$$;
revoke all on function neerva_internal.respond_direct_sourcing(uuid,boolean) from public,anon,authenticated;
grant execute on function neerva_internal.respond_direct_sourcing(uuid,boolean) to authenticated;
create function public.neerva_respond_direct_sourcing(p_order uuid,p_accept boolean) returns boolean language sql security invoker set search_path='' as $$select neerva_internal.respond_direct_sourcing(p_order,p_accept)$$;
revoke all on function public.neerva_respond_direct_sourcing(uuid,boolean) from public,anon,authenticated;
grant execute on function public.neerva_respond_direct_sourcing(uuid,boolean) to authenticated;
