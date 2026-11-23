/** Local-first material basket. Sample product prices are never payable totals. */
export const BASKET_STORAGE_KEY = "neerva-material-list-v2";
export type BasketLine={
  key:string;category:string;productSlug:string;productName:string;brand:string;
  option:string;unit:string;quantity:number;
};
const safeString=(value:unknown,max=160)=>typeof value==="string"?value.trim().slice(0,max):"";
const slug=(v:unknown)=>/^[a-z0-9-]+$/i.test(safeString(v,100));
const allowedUnits=new Set(["piece","bag","kg","quintal","tonne","cubic_metre","truck","bundle","length","coil","metre"]);
function parseLine(item:unknown):BasketLine|null{
  if(!item||typeof item!=="object"||Array.isArray(item))return null;
  const r=item as Record<string,unknown>;
  if(!slug(r.category)||!slug(r.productSlug)||!safeString(r.productName)||!safeString(r.brand)
     ||!safeString(r.option)||!allowedUnits.has(safeString(r.unit))
     ||typeof r.quantity!=="number"||!Number.isFinite(r.quantity)||r.quantity<=0||r.quantity>1_000_000)return null;
  const category=safeString(r.category,70),productSlug=safeString(r.productSlug,100);
  const option=safeString(r.option,100),unit=safeString(r.unit,30);
  return {key:[category,productSlug,option,unit].join(":"),category,productSlug,productName:safeString(r.productName,160),brand:safeString(r.brand,100),option,unit,quantity:Math.round(r.quantity*1000)/1000};
}
export function safeBasket(input:unknown):BasketLine[]{
  if(!Array.isArray(input))return [];
  const seen=new Set<string>(),output:BasketLine[]=[];
  for(const inputLine of input.slice(0,250)){
    const line=parseLine(inputLine);
    if(!line||seen.has(line.key))continue;
    seen.add(line.key);output.push(line);
    if(output.length>=25)break;
  }
  return output;
}
export function addBasketLine(lines:unknown,input:unknown):BasketLine[]{
  const next=parseLine(input);
  const previous=safeBasket(lines);
  if(!next)return previous;
  const found=previous.findIndex(l=>l.key===next.key);
  if(found<0)return safeBasket([...previous,next]);
  return safeBasket(previous.map((line,index)=>index===found?{...line,quantity:Math.min(1_000_000,Math.round((line.quantity+next.quantity)*1000)/1000)}:line));
}
