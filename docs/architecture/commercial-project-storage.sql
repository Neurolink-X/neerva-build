-- Applied production migration: 20261127022822 commercial_snapshot_private_concepts.
-- Private untrusted drafts; regenerate on the server before procurement or approval.
begin;
create table public.studio_commercial_snapshots (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 idempotency_key uuid not null,
 title text not null check (char_length(title) between 3 and 120),
 purpose text not null check (purpose in ('mall','school','restaurant','shops','rental')),
 snapshot jsonb not null check (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=400000 and (snapshot->>'approval'='CONCEPT_ONLY' and snapshot->>'kind'='commercial' and snapshot->>'schemaVersion'='1' and snapshot#>>'{plan,brief,purpose}'=purpose) is true),
 snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 unique(owner_id,idempotency_key)
);
alter table public.studio_commercial_snapshots enable row level security;
revoke all on public.studio_commercial_snapshots from public,anon,authenticated;
grant select on public.studio_commercial_snapshots to authenticated;
grant insert (owner_id,idempotency_key,title,purpose,snapshot,snapshot_sha256) on public.studio_commercial_snapshots to authenticated;
create policy commercial_snapshot_read on public.studio_commercial_snapshots for select to authenticated
 using ((select auth.uid())=owner_id and (select public.neerva_account_access_allowed()));
create policy commercial_snapshot_insert on public.studio_commercial_snapshots for insert to authenticated
 with check ((select auth.uid())=owner_id and (select public.neerva_account_access_allowed()));
create index studio_commercial_snapshots_owner_recent on public.studio_commercial_snapshots(owner_id,created_at desc);
comment on table public.studio_commercial_snapshots is 'Private untrusted concept drafts; never use as approval or procurement authority without server regeneration.';
commit;
