-- NEERVA BUILD: additive order offer lookup index; order RLS was already
-- hardened in the canonical and applied 0017_order_contact_role_scope.sql.
create index if not exists orders_offer_lookup_idx on public.orders(quote_offer_id);
