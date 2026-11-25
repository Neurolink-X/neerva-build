-- Rehearse on disposable database only. Existing production trigger unchanged until reviewed migration.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create or replace function public.neerva_order_prepare_insert()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
declare
 actor uuid := auth.uid();
 chosen public.quote_offers%rowtype;
 request_row public.quote_requests%rowtype;
 seller public.tenants%rowtype;
 source_lines jsonb;
begin
 if actor is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if new.idempotency_key is null or new.quote_offer_id is null or
    new.delivery_address is null or char_length(btrim(new.delivery_address)) not between 12 and 300 then
  raise exception using errcode='23514',message='INVALID_ORDER_DETAILS';
 end if;
 select * into chosen from public.quote_offers where id=new.quote_offer_id;
 if not found then raise exception using errcode='23514',message='OFFER_NOT_FOUND'; end if;
 select * into request_row from public.quote_requests where id=chosen.quote_request_id for update;
 if not found or request_row.requester_id is distinct from actor then
  raise exception using errcode='42501',message='NOT_CUSTOMER_OFFER';
 end if;
 if request_row.status not in ('open','quoted') or
    exists(select 1 from public.orders existing where existing.quote_request_id=request_row.id) then
  raise exception using errcode='23505',message='RFQ_ALREADY_ACCEPTED';
 end if;
 if chosen.valid_until <= statement_timestamp() or chosen.currency <> 'INR' or
    chosen.total_paise <= 0 or chosen.total_paise > 20000000000 or
    chosen.total_paise <> chosen.subtotal_paise+chosen.tax_paise+chosen.freight_paise+chosen.unloading_paise then
  raise exception using errcode='23514',message='OFFER_EXPIRED_OR_INVALID';
 end if;
 if exists(select 1 from public.quote_offers newer
   where newer.quote_request_id=chosen.quote_request_id and newer.tenant_id=chosen.tenant_id
    and newer.revision>chosen.revision) then
  raise exception using errcode='23514',message='NEWER_OFFER_REVISION_AVAILABLE';
 end if;
 if not exists(select 1 from public.quote_invites invite where
   invite.quote_request_id=chosen.quote_request_id and invite.tenant_id=chosen.tenant_id
   and invite.status in ('invited','viewed','responded')) then
  raise exception using errcode='23514',message='OFFER_NOT_INVITED';
 end if;
 select * into seller from public.tenants where id=chosen.tenant_id;
 if not found or seller.status<>'active' then
  raise exception using errcode='23514',message='DEALER_NOT_ACTIVE';
 end if;
 if not exists(
  select 1 from public.dealer_applications app
  join public.dealer_service_pincodes pin on pin.application_id=app.id
  where app.tenant_id=chosen.tenant_id and app.status='approved'
    and app.gstin_verification='verified' and pin.pincode=request_row.pincode
 ) or not exists(
  select 1 from public.merchant_branches b
  where b.tenant_id=chosen.tenant_id and b.approved
 ) then
  raise exception using errcode='23514',message='DEALER_DELIVERY_AREA_UNVERIFIED';
 end if;
 if jsonb_typeof(chosen.line_items)<>'array' or jsonb_array_length(chosen.line_items) not between 1 and 30 then
  raise exception using errcode='23514',message='INVALID_OFFER_LINES';
 end if;
 select jsonb_agg(jsonb_build_object(
  'productName',line->>'description','quantity',(line->>'quantity')::numeric,
  'unit',line->>'unit',
  'lineTotalPaise',round((line->>'quantity')::numeric*(line->>'unitPricePaise')::numeric)::bigint
 )) into source_lines
 from jsonb_array_elements(chosen.line_items) as line;
 if source_lines is null or
   (select coalesce(sum((item->>'lineTotalPaise')::bigint),0)
    from jsonb_array_elements(source_lines) item) <> chosen.subtotal_paise then
  raise exception using errcode='23514',message='OFFER_TOTAL_MISMATCH';
 end if;
 new.quote_request_id:=request_row.id;
 new.customer_id:=actor;
 new.tenant_id:=chosen.tenant_id;
 new.business_name:=seller.business_name;
 new.contact_name:=request_row.contact_name;
 new.phone:=request_row.phone;
 new.city:=request_row.city;
 new.pincode:=request_row.pincode;
 new.delivery_address:=btrim(new.delivery_address);
 new.line_items:=source_lines;
 new.subtotal_paise:=chosen.subtotal_paise;
 new.tax_paise:=chosen.tax_paise;
 new.freight_paise:=chosen.freight_paise;
 new.unloading_paise:=chosen.unloading_paise;
 new.total_paise:=chosen.total_paise;
 new.currency:='INR';
 new.status:='pending_confirmation';
 new.invoice_number:=null;
 new.created_at:=statement_timestamp();
 new.updated_at:=new.created_at;
 return new;
end $$;
revoke all on function public.neerva_order_prepare_insert() from public,anon,authenticated;

commit;
