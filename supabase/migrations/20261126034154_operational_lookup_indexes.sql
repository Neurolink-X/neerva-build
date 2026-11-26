-- Target high-use foreign keys and operational lookup paths. No data changes.
set local lock_timeout='3s';
set local statement_timeout='30s';
create index if not exists neerva_coupon_customer_idx on neerva_internal.checkout_coupon_uses(customer_id);
create index if not exists neerva_dealer_category_reverse_idx on public.dealer_categories(category_id,application_id);
create index if not exists neerva_dealer_delivery_tenant_idx on public.dealer_delivery_versions(tenant_id);
create index if not exists neerva_inventory_movement_branch_variant_idx on public.inventory_movements(branch_id,variant_id);
create index if not exists neerva_inventory_movement_variant_idx on public.inventory_movements(variant_id);
create index if not exists neerva_inventory_movement_actor_idx on public.inventory_movements(actor_id);
create index if not exists neerva_direct_order_fee_idx on public.direct_orders(fee_version_id);
create index if not exists neerva_direct_sourcing_tenant_idx on public.direct_order_sourcing(tenant_id,created_at desc);
create index if not exists neerva_direct_sourcing_branch_idx on public.direct_order_sourcing(branch_id);
create index if not exists neerva_member_user_active_idx on public.tenant_memberships(user_id,active,tenant_id);
create index if not exists neerva_quote_inviter_idx on public.quote_invites(invited_by);
create index if not exists neerva_dealer_reviewer_idx on public.dealer_applications(reviewed_by);
