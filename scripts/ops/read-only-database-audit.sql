-- Read-only operational audit. Run as authorized DB operator, never in a browser.
begin read only;
select schemaname,tablename,policyname,roles,cmd,permissive
from pg_policies where schemaname='public' order by tablename,policyname;
select c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p') order by 1;
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef order by 1,2;
-- Candidate FK indexes: compare full, valid, nonpartial btree leading keys.
-- Review workload and query plans before creating an index.
select t.relname as table_name,con.conname,
array(select a.attname from unnest(con.conkey) with ordinality as k(attnum,ord)
join pg_attribute a on a.attrelid=t.oid and a.attnum=k.attnum order by k.ord) as columns
from pg_constraint con join pg_class t on t.oid=con.conrelid
join pg_namespace n on n.oid=t.relnamespace
where n.nspname='public' and con.contype='f' and not exists(
 select 1 from pg_index i join pg_class idx on idx.oid=i.indexrelid join pg_am am on am.oid=idx.relam
 where i.indrelid=t.oid and i.indisvalid and i.indisready and i.indpred is null and am.amname='btree'
 and i.indnkeyatts>=cardinality(con.conkey)
 and array(select x from unnest(i.indkey) with ordinality as k(x,ord) where ord<=cardinality(con.conkey) order by x)
 =array(select x from unnest(con.conkey) as k(x) order by x)
) order by 1,2;
rollback;
