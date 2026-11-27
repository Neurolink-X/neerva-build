import {readFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {houseJourney} from "./house-journey.ts";
import {encodedPhotoDimensions} from "./photo-budget.ts";
/** Build/server-only check: the selected masks are tied to these exact bytes. */
export function verifyHouseJourney(root=process.cwd()){
 try{
  return [houseJourney.finished,houseJourney.shell].every(a=>{
   const bytes=readFileSync(join(root,"public",a.src.slice(1)));
   if(bytes.length!==a.bytes||createHash("sha256").update(bytes).digest("hex")!==a.sha256)return false;
   const size=encodedPhotoDimensions(bytes);
   return size?.width===houseJourney.width&&size.height===houseJourney.height;
  });
 }catch{return false}
}
let checked:boolean|undefined;
export function hasHouseJourney(){return checked??=verifyHouseJourney()}
