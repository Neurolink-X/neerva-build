-- NEERVA BUILD: privileged draft catalog administration and inventory consistency.
-- All catalog writes require platform admin. Existing public published-only reads remain RLS-limited.
-- No product/vendor is automatically published, approved, or stocked.
revoke all on public.categories, public.brands, public.products, public.product_variants from anon, authenticated;
grant select on public.categories, public.brands, public.products, public.product_variants to anon, authenticated;
grant insert, update on public.categories, public.brands, public.products, public.product_variants to authenticated;

drop policy if exists catalog_admin_select_categories on public.categories;
create policy catalog_admin_select_categories on public.categories for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists catalog_admin_manage_categories on public.categories;
create policy catalog_admin_manage_categories on public.categories for all to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

drop policy if exists catalog_admin_select_brands on public.brands;
create policy catalog_admin_select_brands on public.brands for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists catalog_admin_manage_brands on public.brands;
create policy catalog_admin_manage_brands on public.brands for all to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

drop policy if exists catalog_admin_select_products on public.products;
create policy catalog_admin_select_products on public.products for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists catalog_admin_manage_products on public.products;
create policy catalog_admin_manage_products on public.products for all to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

drop policy if exists catalog_admin_select_variants on public.product_variants;
create policy catalog_admin_select_variants on public.product_variants for select to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));
drop policy if exists catalog_admin_manage_variants on public.product_variants;
create policy catalog_admin_manage_variants on public.product_variants for all to authenticated
 using (public.has_platform_role(array['admin','super_admin']::public.platform_role[]))
 with check (public.has_platform_role(array['admin','super_admin']::public.platform_role[]));

-- Never trust a dealer request's unit or arbitrary variant against stock table.
create or replace function public.neerva_validate_inventory_unit()
returns trigger language plpgsql security invoker
set search_path=pg_catalog,public,pg_temp as $$
declare expected_unit text;
begin
 select v.unit into expected_unit from public.product_variants v
 where v.id=new.variant_id and v.status='published'::public.catalog_visibility;
 if expected_unit is null or new.unit is distinct from expected_unit then
   raise exception using errcode='23514', message='INVENTORY_UNIT_OR_VARIANT_INVALID';
 end if;
 new.updated_at:=statement_timestamp();
 return new;
end $$;
revoke all on function public.neerva_validate_inventory_unit() from public,anon,authenticated;
drop trigger if exists inventory_verify_unit on public.inventory;
create trigger inventory_verify_unit before insert or update on public.inventory
for each row execute function public.neerva_validate_inventory_unit();

-- Dealer offers must have consistent totals and valid item arrays.
do $$ begin
 if not exists(select 1 from pg_constraint where conname='neerva_offer_total_check' and conrelid='public.quote_offers'::regclass) then
  alter table public.quote_offers add constraint neerva_offer_total_check
   check(total_paise=subtotal_paise+tax_paise+freight_paise+unloading_paise);
 end if;
 if not exists(select 1 from pg_constraint where conname='neerva_offer_items_check' and conrelid='public.quote_offers'::regclass) then
  alter table public.quote_offers add constraint neerva_offer_items_check
   check(jsonb_typeof(line_items)='array' and jsonb_array_length(line_items) between 1 and 30);
 end if;
 if not exists(select 1 from pg_constraint where conname='neerva_offer_expiry_check' and conrelid='public.quote_offers'::regclass) then
  alter table public.quote_offers add constraint neerva_offer_expiry_check check(valid_until > created_at);
 end if;
end $$;
comment on function public.neerva_validate_inventory_unit() is 'Checks incoming dealer inventory rows against the published variant and canonical server unit.';
