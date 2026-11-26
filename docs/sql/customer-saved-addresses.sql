-- Staged schema: generate a tracked migration with the project's Supabase CLI,
-- apply to isolated staging and run ownership tests before production release.
-- No changes to existing orders, users, or delivery snapshots.
begin;
create table public.customer_saved_addresses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 label text not null check (char_length(btrim(label)) between 2 and 40),
 contact_name text not null check (char_length(btrim(contact_name)) between 2 and 100),
 phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
 city text not null check (char_length(btrim(city)) between 2 and 80),
 pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
 delivery_address text not null check (char_length(btrim(delivery_address)) between 12 and 300),
 created_at timestamptz not null default now()
);
create index customer_saved_addresses_owner_idx on public.customer_saved_addresses(user_id,created_at desc);
alter table public.customer_saved_addresses enable row level security;
revoke all on public.customer_saved_addresses from public,anon,authenticated;
grant select,delete on public.customer_saved_addresses to authenticated;
grant insert(user_id,label,contact_name,phone,city,pincode,delivery_address) on public.customer_saved_addresses to authenticated;
grant update(label,contact_name,phone,city,pincode,delivery_address) on public.customer_saved_addresses to authenticated;
create policy address_owner_select on public.customer_saved_addresses for select to authenticated using ((select auth.uid())=user_id);
create policy address_owner_insert on public.customer_saved_addresses for insert to authenticated with check ((select auth.uid())=user_id);
create policy address_owner_update on public.customer_saved_addresses for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy address_owner_delete on public.customer_saved_addresses for delete to authenticated using ((select auth.uid())=user_id);
commit;
