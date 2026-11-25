-- Restored from existing production migration 20261124123644 neerva_design_review_queue; local replay only, do not reapply to production.
create table public.studio_design_reviews (
 design_slug text primary key check(design_slug ~ '^[a-z0-9][a-z0-9-]{1,159}$'),
 status text not null check(status in ('in_review','changes_requested','ready_for_professional_review','archived')),
 note text not null check(char_length(note) between 10 and 1000),
 version integer not null default 1 check(version>0),
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.studio_design_reviews enable row level security;
revoke all on public.studio_design_reviews from public,anon,authenticated;
grant select on public.studio_design_reviews to authenticated;
create policy studio_review_admin_read on public.studio_design_reviews for select to authenticated using ((select public.neerva_admin_access_allowed()));
create function neerva_internal.save_design_review(p_slug text,p_status text,p_note text,p_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item public.studio_design_reviews%rowtype;
begin
 if actor is null or not public.neerva_admin_access_allowed() then raise exception 'Admin required' using errcode='42501'; end if;
 if p_slug is null or p_slug !~ '^[a-z0-9][a-z0-9-]{1,159}$' or p_status is null or p_status not in ('in_review','changes_requested','ready_for_professional_review','archived') or p_note is null or char_length(btrim(p_note)) not between 10 and 1000 or p_version is null or p_version<0 then raise exception 'Invalid review' using errcode='22023';end if;
 if p_version=0 then
 insert into public.studio_design_reviews(design_slug,status,note,updated_by) values(p_slug,p_status,btrim(p_note),actor) on conflict do nothing returning * into item;
 else
 update public.studio_design_reviews set status=p_status,note=btrim(p_note),version=version+1,updated_by=actor,updated_at=now() where design_slug=p_slug and version=p_version returning * into item;
 end if;
 if not found then raise exception 'Review changed; refresh' using errcode='40001';end if;
 insert into public.audit_logs(actor_id,action,object_type,object_id,safe_metadata) values(actor,'studio_design_review','studio_design',p_slug,jsonb_build_object('status',p_status,'version',item.version));
 return to_jsonb(item);
end;$$;
revoke all on function neerva_internal.save_design_review(text,text,text,integer) from public,anon,authenticated;
grant execute on function neerva_internal.save_design_review(text,text,text,integer) to authenticated;
create function public.neerva_save_design_review(p_slug text,p_status text,p_note text,p_version integer) returns jsonb language sql security invoker set search_path='' as $$select neerva_internal.save_design_review(p_slug,p_status,p_note,p_version)$$;
revoke all on function public.neerva_save_design_review(text,text,text,integer) from public,anon,authenticated;
grant execute on function public.neerva_save_design_review(text,text,text,integer) to authenticated;
