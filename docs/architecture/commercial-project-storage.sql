-- REVIEW ONLY. Not applied to production; convert to a tracked migration after isolated testing.
begin;
create table public.studio_commercial_snapshots (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 idempotency_key uuid not null,
 title text not null check (char_length(title) between 3 and 120),
 purpose text not null check (purpose in ('mall','school','restaurant','shops','rental')),
 snapshot jsonb not null check (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=400000),
 snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 unique(owner_id,idempotency_key)
);
alter table public.studio_commercial_snapshots enable row level security;
revoke all on public.studio_commercial_snapshots from public,anon,authenticated;
grant select,insert on public.studio_commercial_snapshots to authenticated;
create policy commercial_snapshot_read on public.studio_commercial_snapshots for select to authenticated
 using ((select auth.uid())=owner_id and (select public.neerva_account_access_allowed()));
create policy commercial_snapshot_insert on public.studio_commercial_snapshots for insert to authenticated
 with check ((select auth.uid())=owner_id and (select public.neerva_account_access_allowed()));
create index studio_commercial_snapshots_owner_recent on public.studio_commercial_snapshots(owner_id,created_at desc);
commit;
