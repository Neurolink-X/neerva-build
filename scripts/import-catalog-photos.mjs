/**
 * Curated Pexels Free-License photography. Photos are editorial material references,
 * NOT exact manufacturer SKU pictures, endorsement or dealer stock.
 * Download in CI once, validate JPEG, size and sha256 uniqueness, then commit locally.
 * Builds and user page loads never need third-party image servers.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const photos=[
 ["pipe-stack",29301874,"PVC pipe stack at construction site"],
 ["pipe-install",11851260,"White pipes installed on building wall"],
 ["plumbing-fitting",28178448,"Photograph of brass plumbing elbow fitting"],
 ["steel-close",35598610,"Steel rebar close-up"],
 ["steel-bundle",10059199,"Bundle of weathered steel bars"],
 ["bricks-red",30571032,"Stack of weathered clay bricks"],
 ["blocks-stack",9685872,"Concrete masonry blocks stacked"],
 ["cement-stack",6473974,"Stacks of cement sacks"],
 ["wire-coil",8101094,"Electrical cable coil"],
 ["wire-install",5691642,"Electrical wires at wall socket installation"]
];
const out="public/images/catalog/editorial",entries={},hashes=new Set(),issues=[];
await fs.mkdir(out,{recursive:true});
for(const [key,id,alt] of photos){
 const target=path.join(out,key+".jpg");
 const imageUrl="https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg?auto=compress&cs=tinysrgb&w=1150";
 try{
  const response=await fetch(imageUrl,{headers:{"Accept":"image/jpeg"},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error("HTTP "+response.status);
  const mime=response.headers.get("content-type")??"";
  if(!/^image\/jpeg\b/.test(mime))throw Error("Invalid MIME "+mime);
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length<15000||data.length>2200000||data[0]!==255||data[1]!==216||data[2]!==255)throw Error("Invalid JPEG bytes or size "+data.length);
  const fingerprint=crypto.createHash("sha256").update(data).digest("hex");
  if(hashes.has(fingerprint))throw Error("Same binary image in two categories");
  hashes.add(fingerprint);
  await fs.writeFile(target,data);
  entries[key]="/images/catalog/editorial/"+key+".jpg";
  console.log("Verified",key,data.length,fingerprint.slice(0,12),alt);
 }catch(error){
  issues.push(key+": "+String(error));
  console.warn("Skipping unsafe/unavailable media",key,String(error));
 }
}
if(Object.keys(entries).length<7)throw Error("Editorial photo import aborted: only "+Object.keys(entries).length+"/10 validated. "+issues.join("; "));
const manifest="/** Licensed Pexels editorial photos imported and byte-verified by CI; no exact manufacturer SKU claims. */\n"
 +"export const curatedPhotoPaths:Record<string,string>="+JSON.stringify(entries,null,2)+";\n";
await fs.writeFile("src/modules/catalog/curated-photo-paths.ts",manifest);
const sources=photos.map(([key,id,alt])=>"- "+key+": https://www.pexels.com/photo/"+id+"/ — "+alt+"; "+(entries[key]?"locally validated":"not included")).join("\n");
await fs.writeFile("docs/pr30-editorial-image-provenance.md","# NEERVA material reference photos\n\nPexels Free License: https://www.pexels.com/license/\n\n"+
 "Photographs are generic educational/editorial scenes; they are not exact manufacturer SKU photos, dealer offers, specifications or verified stock. No implied manufacturer endorsement.\n\n"+
 sources+"\n\nDownloaded once into the repository at publication; no third-party image fetch on user page loads. 10 MB uploads/remote hotlinking are not used.\n");
