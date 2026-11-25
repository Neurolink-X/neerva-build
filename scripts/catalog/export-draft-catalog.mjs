// Offline export only. No credentials, network, or production writes.
import assert from "node:assert/strict";
import {writeFileSync,mkdirSync} from "node:fs";
import {demoProducts} from "../../src/modules/catalog/marketplace.ts";
import {defaultCategoryUnit,isMaterialCategory} from "../../src/modules/catalog/category-units.ts";
const rows=demoProducts.map(p=>{
 assert.ok(isMaterialCategory(p.category)&&/^[a-z0-9-]{1,100}$/.test(p.slug)&&p.name.trim());
 return {slug:p.slug,category:p.category,name:p.name,description:p.description,brand_slug:p.brand.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),unit:defaultCategoryUnit(p.category),attributes:{origin:"neerva-static-reference",brand_reference:p.brand,reference_only:true,manufacturer_sku:null,quote_only:!!p.quoteOnly,family_key:p.familyKey??p.slug,specifications:p.specifications,source:p.manufacturerReference??p.referenceSource??null}};
});
assert.equal(new Set(rows.map(r=>r.slug)).size,rows.length,"Duplicate product slug");
const data=Buffer.from(JSON.stringify(rows),"utf8").toString("hex");
const sql=`BEGIN;
CREATE TEMP TABLE neerva_reference_import ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset(convert_from(decode('${data}','hex'),'UTF8')::jsonb) AS r(slug text,category text,name text,description text,brand_slug text,unit text,attributes jsonb);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM neerva_reference_import r LEFT JOIN public.categories c ON c.slug=r.category WHERE c.id IS NULL) THEN RAISE EXCEPTION 'Missing reference taxonomy'; END IF; END $$;
INSERT INTO public.products(category_id,brand_id,slug,name,description,attributes,status)
SELECT c.id,b.id,r.slug,r.name,r.description,r.attributes,'draft' FROM neerva_reference_import r JOIN public.categories c ON c.slug=r.category LEFT JOIN public.brands b ON b.slug=r.brand_slug ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.product_variants(product_id,sku,unit,attributes,status)
SELECT p.id,'NEERVA-REF-'||r.slug,r.unit,jsonb_build_object('reference_only',true,'internal_reference_code',true),'draft' FROM neerva_reference_import r JOIN public.products p ON p.slug=r.slug WHERE p.status='draft' AND p.attributes->>'origin'='neerva-static-reference' ON CONFLICT(sku) DO NOTHING;
SELECT count(*) AS matched_reference_rows FROM neerva_reference_import r JOIN public.products p ON p.slug=r.slug;
COMMIT;`;
mkdirSync('catalog-sync',{recursive:true});writeFileSync('catalog-sync/draft-import.sql',sql);writeFileSync('catalog-sync/summary.json',JSON.stringify({referenceRows:rows.length,status:'draft',stockCreated:0,pricesCreated:0,manufacturerSkuVerified:0},null,2)+'\n');console.log('Draft-only reference export:',rows.length);
