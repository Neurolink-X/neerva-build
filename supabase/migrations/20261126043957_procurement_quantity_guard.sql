-- Enforce whole physical counts and material-specific units at database intake.
-- Existing orders are immutable: this only affects new requests, not historical data.
set local lock_timeout='5s';
set local statement_timeout='30s';
create function neerva_internal.guard_procurement_quantity() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
  lines jsonb;
  item jsonb;
  c text;
  s text;
  u text;
  q numeric;
  allowed boolean;
begin
  if TG_TABLE_NAME='direct_orders' then
    lines:=new.line_items;
  elsif TG_TABLE_NAME='quote_requests' then
    lines:=jsonb_build_array(jsonb_build_object('category',new.category_slug,'unit',new.unit,'quantity',new.quantity));
  else
    raise exception using errcode='23514',message='INVALID_PROCUREMENT_SOURCE';
  end if;
  if jsonb_typeof(lines) is distinct from 'array' or coalesce(jsonb_array_length(lines),0) not between 1 and 25 then
    raise exception using errcode='23514',message='INVALID_PROCUREMENT_QUANTITY';
  end if;
  for item in select value from jsonb_array_elements(lines) loop
    c:=item->>'category'; s:=coalesce(item->>'productSlug',''); u:=item->>'unit';
    if jsonb_typeof(item->'quantity') is distinct from 'number' then
      raise exception using errcode='23514',message='INVALID_PROCUREMENT_QUANTITY';
    end if;
    q:=(item->>'quantity')::numeric;
    allowed:=case c
      when 'cement' then u in ('bag','tonne')
      when 'steel' then u in ('kg','quintal','tonne','piece','bundle')
      when 'bricks-blocks' then u in ('piece','bundle','truck')
      when 'plumbing' then u in ('length','piece','bundle','metre')
      when 'electrical' then u in ('coil','metre','piece','bundle','kg')
      when 'aggregates' then u in ('cubic_metre','truck','tonne')
      when 'paint' then u in ('litre','kg','bucket','piece')
      when 'tiles' then u in ('box','square_foot','piece')
      when 'hardware' then u in ('piece','box','kg','bag','bundle')
      else false end;
    if c='plumbing' and s ~ 'elbow|coupler|coupling|reducer|socket|union|valve|clamp|adaptor|adapter|connector|nipple|grommet|tee|end-cap|plug|saddle|trap|bend|fitting|pressure-gauge|float-switch' then
      allowed:=u in ('piece','bundle');
    elsif c='electrical' and s ~ 'junction-box|conduit-bend|conduit-coupler|conduit-clamp|switch|socket|plug|mcb' then
      allowed:=u in ('piece','bundle');
    elsif c='electrical' and s ~ 'conduit|casing-capping|duct' then
      allowed:=u in ('metre','piece','bundle');
    end if;
    if not coalesce(allowed,false) or q not between .001 and 1000000 or q<>round(q,3)
       or (u in ('bag','piece','bundle','truck','length','coil','bucket','box') and q<>trunc(q)) then
      raise exception using errcode='23514',message='INVALID_PROCUREMENT_QUANTITY';
    end if;
  end loop;
  return new;
end $$;
revoke all on function neerva_internal.guard_procurement_quantity() from public,anon,authenticated;
create trigger a_procurement_quantity_guard before insert on public.direct_orders
for each row execute function neerva_internal.guard_procurement_quantity();
create trigger a_procurement_quantity_guard before insert on public.quote_requests
for each row execute function neerva_internal.guard_procurement_quantity();
