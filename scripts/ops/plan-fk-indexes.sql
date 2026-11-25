-- READ ONLY. Generates reviewable commands; never executes DDL.
-- Composite indexes subsume their same-prefix single-column candidates.
-- Run using psql -X -At -f; review EXPLAIN and index costs before applying.
begin read only;
with candidates as (select t.relname as table_name,con.conname,
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
) order by 1,2),
dedup as (select distinct table_name,columns from candidates),
chosen as (
 select a.* from dedup a where not exists(
  select 1 from dedup b where b.table_name=a.table_name and cardinality(b.columns)>cardinality(a.columns)
  and b.columns[1:cardinality(a.columns)]=a.columns
 )
)
select format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON public.%I (%s);',
 'neerva_fk_'||substr(md5(table_name||':'||array_to_string(columns,',')),1,20),
 table_name,(select string_agg(quote_ident(col),', ' order by ord) from unnest(columns) with ordinality as u(col,ord)))
from chosen order by table_name,columns;
rollback;
