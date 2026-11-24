-- Product photos are private until the corresponding published product and photo are visible.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('neerva-catalog-media','neerva-catalog-media',false,3145728,array['image/jpeg','image/png','image/webp']),
 ('neerva-dealer-kyc','neerva-dealer-kyc',false,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
create table public.catalog_product_media(
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete restrict,
 storage_path text not null unique, alt_text text not null check(char_length(alt_text) between 3 and 180),
 published boolean not null default false, created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 check(storage_path like product_id::text||'/%')
);
alter table public.catalog_product_media enable row level security;
grant select on public.catalog_product_media to anon,authenticated;
grant insert,update,delete on public.catalog_product_media to authenticated;
create index catalog_product_media_product_idx on public.catalog_product_media(product_id);
create policy catalog_media_public_read on public.catalog_product_media for select to anon,authenticated using (published and exists(select 1 from public.products p where p.id=product_id and p.status='published'));
create policy catalog_media_admin_manage on public.catalog_product_media for all to authenticated using ((select public.has_platform_role(array['admin','super_admin']::public.platform_role[]))) with check ((select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy catalog_storage_admin_insert on storage.objects for insert to authenticated with check (bucket_id='neerva-catalog-media' and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy catalog_storage_admin_delete on storage.objects for delete to authenticated using (bucket_id='neerva-catalog-media' and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy catalog_storage_public_read on storage.objects for select to anon,authenticated using (bucket_id='neerva-catalog-media' and exists(select 1 from public.catalog_product_media m where m.storage_path=name and m.published and exists(select 1 from public.products p where p.id=m.product_id and p.status='published')));
create policy catalog_storage_admin_read on storage.objects for select to authenticated using (bucket_id='neerva-catalog-media' and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
-- KYC evidence is never anonymously readable.
create policy dealer_kyc_admin_read on storage.objects for select to authenticated using (bucket_id='neerva-dealer-kyc' and (select public.has_platform_role(array['admin','super_admin']::public.platform_role[])));
create policy dealer_kyc_owner_read on storage.objects for select to authenticated using (bucket_id='neerva-dealer-kyc' and exists(select 1 from public.dealer_applications a where a.id::text=split_part(name,'/',1) and a.owner_id=(select auth.uid())));
create policy dealer_kyc_owner_upload on storage.objects for insert to authenticated with check (bucket_id='neerva-dealer-kyc' and exists(select 1 from public.dealer_applications a where a.id::text=split_part(name,'/',1) and a.owner_id=(select auth.uid()) and a.status in ('draft','changes_requested')));
