-- Reference identities may be retained as private drafts, never sold as real SKUs.
set local lock_timeout='5s';
set local statement_timeout='30s';
alter table public.product_variants add constraint neerva_verified_sku_publication
check (status::text <> 'published' or (sku !~* '^NEERVA-REF-' and coalesce(attributes->>'reference_only','false') <> 'true'));
-- No private rate, tenant, SKU, or customer data is emitted. Only a generic version
-- bump after a reviewed delivery policy or an approved fee/tax version changes.
create function neerva_internal.bump_reviewed_pricing_policy() returns trigger
language plpgsql security definer set search_path='' as $$
declare before_row jsonb:='{}'; after_row jsonb:='{}'; should_bump boolean;
begin
 if TG_OP<>'INSERT' then before_row:=to_jsonb(old);end if;
 if TG_OP<>'DELETE' then after_row:=to_jsonb(new);end if;
 if TG_OP='UPDATE' and before_row=after_row then return null;end if;
 if TG_TABLE_NAME='dealer_delivery_versions' then
  should_bump:=coalesce(before_row->>'status'='approved',false) or coalesce(after_row->>'status'='approved',false);
 elsif TG_TABLE_NAME in ('marketplace_fee_versions','sku_tax_versions') then
  should_bump:=true;
 else return null;
 end if;
 if should_bump then update public.public_refresh_signals set version=version+1,updated_at=clock_timestamp() where topic='catalog';end if;
 return null;
end $$;
revoke all on function neerva_internal.bump_reviewed_pricing_policy() from public,anon,authenticated;
create trigger refresh_reviewed_delivery after insert or update or delete on public.dealer_delivery_versions for each row execute function neerva_internal.bump_reviewed_pricing_policy();
create trigger refresh_reviewed_fee after insert or update or delete on public.marketplace_fee_versions for each row execute function neerva_internal.bump_reviewed_pricing_policy();
create trigger refresh_reviewed_tax after insert or update or delete on public.sku_tax_versions for each row execute function neerva_internal.bump_reviewed_pricing_policy();
