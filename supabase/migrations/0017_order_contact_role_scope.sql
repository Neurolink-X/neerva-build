-- Harden access to order delivery address and customer contact fields.
-- The initial order migration granted SELECT to any active tenant membership,
-- including inventory/accounts staff. Only approved operational seller roles
-- should be able to view complete customer order contact and delivery details.
-- Customers still view their own orders; platform admins retain full oversight.
drop policy if exists neerva_orders_read on public.orders;
create policy neerva_orders_read on public.orders for select to authenticated using (
  customer_id=(select auth.uid())
  or (select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
  or (
    (select public.is_tenant_member(tenant_id,array['owner','manager','dispatch']::text[]))
    and exists(select 1 from public.tenants t where t.id=orders.tenant_id and t.status='active')
  )
);
comment on policy neerva_orders_read on public.orders is
 'Customer, approved order-operations dealer roles, and platform administrators only; never expose delivery addresses to generic inventory or accounts members.';
