-- NEERVA BUILD order privacy hardening, additive and backward compatible.
-- The initial order read policy allowed all dealer membership roles; inventory-only
-- and sales users must NOT read personal delivery addresses or telephone numbers.
alter policy neerva_orders_read on public.orders using (
 customer_id=(select auth.uid())
 or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 or (
   public.is_tenant_member(tenant_id,array['owner','manager','dispatch']::text[])
   and exists(select 1 from public.tenants t
     where t.id=orders.tenant_id and t.status='active')
 )
);
create index if not exists orders_offer_lookup_idx on public.orders(quote_offer_id);
comment on policy neerva_orders_read on public.orders is
 'Customer, platform admin or approved active dealer owner/manager/dispatch only. Sales, accounts and stock staff do not see private delivery addresses.';
