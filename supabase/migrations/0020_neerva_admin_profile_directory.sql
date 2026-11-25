-- Restored from existing production migration 20261124105110 neerva_admin_profile_directory; local replay only, do not reapply to production.
create schema if not exists neerva_internal;
revoke all on schema neerva_internal from public, anon, authenticated;
create or replace function neerva_internal.sync_auth_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.profiles(id,display_name,preferred_locale)
 values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'Account holder'),100),
 case when new.raw_user_meta_data->>'preferred_locale'='hi' then 'hi' else 'en' end)
 on conflict(id) do nothing;
 return new;
end;
$$;
revoke all on function neerva_internal.sync_auth_profile() from public, anon, authenticated;
create trigger neerva_sync_auth_profile after insert on auth.users for each row execute function neerva_internal.sync_auth_profile();
insert into public.profiles(id,display_name,preferred_locale)
select id,left(coalesce(nullif(btrim(raw_user_meta_data->>'display_name'),''),'Account holder'),100),
case when raw_user_meta_data->>'preferred_locale'='hi' then 'hi' else 'en' end from auth.users
on conflict(id) do nothing;
create policy profile_read_platform_admin on public.profiles for select to authenticated using ((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
