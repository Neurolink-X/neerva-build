create function public.neerva_admin_business_metrics(p_days integer default 30) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare cutoff timestamptz; result jsonb;
begin
 if not public.neerva_admin_access_allowed() then raise exception 'Admin required' using errcode='42501';end if;
 if p_days is null or p_days not in (7,30,90) then raise exception 'Invalid reporting period' using errcode='22023';end if;
 cutoff:=now()-make_interval(days=>p_days);
 select jsonb_build_object('days',p_days,'since',cutoff,'asOf',now(),
 'orders',(select jsonb_build_object('total',count(*),'delivered',count(*) filter(where status='delivered'),'cancelled',count(*) filter(where status in ('cancelled','declined')),'active',count(*) filter(where status in ('pending_confirmation','confirmed','preparing','out_for_delivery')),'acceptedValuePaise',coalesce(sum(total_paise) filter(where status not in ('cancelled','declined')),0),'deliveredValuePaise',coalesce(sum(total_paise) filter(where status='delivered'),0)) from public.orders where created_at>=cutoff),
 'quotes',(select count(*) from public.quote_requests where created_at>=cutoff),
 'studio',(select jsonb_build_object('verifiedCount',count(*) filter(where status='verified'),'verifiedPaise',coalesce(sum(amount_paise) filter(where status='verified'),0),'refundedCount',count(*) filter(where status='refunded'),'refundedPaise',coalesce(sum(amount_paise) filter(where status='refunded'),0),'requestedCount',count(*) filter(where status='requested')) from public.studio_paid_orders where created_at>=cutoff),
 'daily',(select coalesce(jsonb_agg(jsonb_build_object('day',d.day,'orders',d.n,'valuePaise',d.amount) order by d.day),'[]'::jsonb) from (select (created_at at time zone 'Asia/Kolkata')::date as day,count(*) as n,coalesce(sum(total_paise) filter(where status not in ('cancelled','declined')),0) as amount from public.orders where created_at>=cutoff group by 1) d)) into result;
 return result;
end;$$;
revoke all on function public.neerva_admin_business_metrics(integer) from public,anon,authenticated;
grant execute on function public.neerva_admin_business_metrics(integer) to authenticated;