-- Public taxonomy only; deliberately NO product/SKU, price, stock, vendor or verification claims.
-- Immutable reference slugs; keep hand-edited admin status and descriptions.
insert into public.categories(slug,name_en,name_hi,pricing_mode,status) values
 ('steel','Steel & TMT','सरिया और TMT','public','published'),
 ('cement','Cement','सीमेंट','public','published'),
 ('bricks-blocks','Bricks & blocks','ईंट और ब्लॉक','public','published'),
 ('plumbing','Pipes & plumbing','पाइप और प्लंबिंग','public','published'),
 ('electrical','Electrical & hardware','इलेक्ट्रिकल और हार्डवेयर','public','published'),
 ('aggregates','Balu, morang & aggregates','बालू, मौरंग और एग्रीगेट','quote_only','published'),
 ('paint','Paint & waterproofing','पेंट व वॉटरप्रूफिंग','public','published'),
 ('tiles','Tiles & flooring','टाइल्स व फ्लोरिंग','public','published'),
 ('hardware','Adhesives & hardware','एडहेसिव व हार्डवेयर','public','published')
on conflict(slug) do nothing;

-- Manufacturer names are searchable admin references only and must not appear as approved dealers.
-- authorized_source NULL means no licence/authorised image and no launch approval.
insert into public.brands(slug,name,status) values
 ('ultratech','UltraTech','draft'),
 ('acc','ACC','draft'),
 ('ambuja','Ambuja','draft'),
 ('tata-tiscon','Tata Tiscon','draft'),
 ('jsw-neosteel','JSW Neosteel','draft'),
 ('astral','Astral','draft'),
 ('supreme','Supreme','draft'),
 ('finolex','Finolex','draft'),
 ('polycab','Polycab','draft'),
 ('asian-paints','Asian Paints','draft'),
 ('berger','Berger','draft'),
 ('nerolac','Nerolac','draft'),
 ('kajaria','Kajaria','draft'),
 ('somany','Somany','draft')
on conflict(slug) do nothing;
