/** Compare reference identities with database records without publishing or overwriting dealer data. */
export type ReferenceIdentity={slug:string;category:string;unit:string};
export type DatabaseIdentity={slug:string;category:string|null;status:string;origin:string|null;variants:readonly {sku:string;unit:string;status:string}[]};
export type CatalogDrift={slug:string;kind:"missing"|"category_mismatch"|"reference_variant_missing"|"unit_mismatch"|"reference_published"|"unmanaged_collision"|"orphan_reference"};
export function reconcileCatalog(references:readonly ReferenceIdentity[],database:readonly DatabaseIdentity[]):CatalogDrift[]{
 const rows=new Map(database.map(p=>[p.slug,p]));const expected=new Set(references.map(p=>p.slug));const findings:CatalogDrift[]=[];
 for(const p of references){
  const row=rows.get(p.slug);
  if(!row){findings.push({slug:p.slug,kind:"missing"});continue;}
  if(row.category!==p.category)findings.push({slug:p.slug,kind:"category_mismatch"});
  if(row.origin!=="neerva-static-reference"){findings.push({slug:p.slug,kind:"unmanaged_collision"});continue;}
  const v=row.variants.find(v=>v.sku==="NEERVA-REF-"+p.slug);
  if(!v)findings.push({slug:p.slug,kind:"reference_variant_missing"});
  else if(v.unit!==p.unit)findings.push({slug:p.slug,kind:"unit_mismatch"});
  if(row.status==="published"||v?.status==="published")findings.push({slug:p.slug,kind:"reference_published"});
 }
 for(const row of database)if(row.origin==="neerva-static-reference"&&!expected.has(row.slug))findings.push({slug:row.slug,kind:"orphan_reference"});
 return findings.sort((a,b)=>a.slug.localeCompare(b.slug)||a.kind.localeCompare(b.kind));
}
