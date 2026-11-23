-- Append-only pricing history: enforce monotonic revisions and automatic audit.
-- This prevents admins from silently overwriting a published price without a history row.
create or replace function public.neerva_price_revision()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
begin
 if tg_op='UPDATE' then
   if new.id is distinct from old.id or new.variant_id is distinct from old.variant_id
     or new.tenant_id is distinct from old.tenant_id or new.branch_id is distinct from old.branch_id then
     raise exception using errcode='23514',message='PRICING_IDENTITY_IMMUTABLE';
   end if;
   new.version:=old.version+1;
 end if;
 return new;
end $$;
revoke all on function public.neerva_price_revision() from public,anon,authenticated;
drop trigger if exists neerva_price_before_update on public.pricing_rules;
create trigger neerva_price_before_update before update on public.pricing_rules
for each row execute function public.neerva_price_revision();

create or replace function public.neerva_record_price_history()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,auth,pg_temp as $$
begin
 insert into public.price_history(pricing_rule_id,version,prior_amount_paise,new_amount_paise,reason,actor_id)
 values(new.id,new.version,case when tg_op='UPDATE' then old.amount_paise else null end,
        new.amount_paise,case when tg_op='INSERT' then 'price_draft_created'
        when new.status is distinct from old.status then 'status_'||new.status
        else 'price_terms_updated' end,
        auth.uid());
 return new;
end $$;
revoke all on function public.neerva_record_price_history() from public,anon,authenticated;
drop trigger if exists neerva_price_history_insert on public.pricing_rules;
create trigger neerva_price_history_insert after insert on public.pricing_rules
for each row execute function public.neerva_record_price_history();
drop trigger if exists neerva_price_history_update on public.pricing_rules;
create trigger neerva_price_history_update after update on public.pricing_rules
for each row execute function public.neerva_record_price_history();
comment on function public.neerva_record_price_history() is 'Automatically persists immutable pricing revisions, actor and status reason; not user callable.';
