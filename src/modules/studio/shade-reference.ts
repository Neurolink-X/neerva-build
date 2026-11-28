import {colourFamilies} from "./colour-families.ts";
const names={
 "Neutrals": [
  "Soft ivory",
  "Oat white",
  "Cloud grey",
  "Linen beige",
  "Sand beige",
  "Mushroom taupe",
  "Stone taupe",
  "Deep charcoal brown"
 ],
 "Greens": [
  "Pale spring green",
  "Soft fern",
  "Muted sage",
  "Eucalyptus",
  "Garden sage",
  "Forest mist",
  "Deep forest",
  "Pine shadow"
 ],
 "Blues": [
  "Frost blue",
  "Powder blue",
  "Mist blue",
  "Sky grey blue",
  "Denim blue",
  "Slate blue",
  "Deep ocean blue",
  "Midnight blue"
 ],
 "Earth": [
  "Cream sand",
  "Honey beige",
  "Warm sandstone",
  "Caramel clay",
  "Copper clay",
  "Red earth",
  "Cocoa brown",
  "Deep chestnut"
 ],
 "Rose": [
  "Blush white",
  "Powder rose",
  "Muted blush",
  "Dusty rose",
  "Mauve rose",
  "Berry mauve",
  "Muted plum",
  "Deep mauve"
 ],
 "Warm whites": [
  "Pure white",
  "Porcelain white",
  "Cream white",
  "Warm ivory",
  "Shell cream",
  "Oat cream",
  "Natural linen",
  "Warm sand"
 ],
 "Greige & taupe": [
  "Pearl greige",
  "Light greige",
  "Stone greige",
  "Soft taupe",
  "Mushroom grey",
  "Warm taupe",
  "Deep taupe",
  "Espresso grey"
 ],
 "Sage & olive": [
  "Pale sage",
  "Soft olive mist",
  "Garden olive",
  "Muted olive",
  "Herbal olive",
  "Olive grove",
  "Deep olive",
  "Olive shadow"
 ],
 "Teal & ocean": [
  "Sea mist",
  "Pale aqua",
  "Sea glass",
  "Muted aqua",
  "Ocean teal",
  "Deep teal",
  "Petrol blue",
  "Deep marine"
 ],
 "Clay & terracotta": [
  "Pale clay",
  "Shell pink clay",
  "Dusty clay",
  "Terracotta rose",
  "Warm terracotta",
  "Burnt clay",
  "Rust brown",
  "Deep brick"
 ],
 "Lavender & plum": [
  "Lavender white",
  "Lavender mist",
  "Soft lilac",
  "Muted lavender",
  "Dusty violet",
  "Deep lavender",
  "Plum violet",
  "Dark plum"
 ],
 "Charcoal & ink": [
  "Silver mist",
  "Cloud silver",
  "Pebble grey",
  "Steel grey",
  "Slate grey",
  "Graphite",
  "Charcoal ink",
  "Midnight ink"
 ],
 "Ochre & gold tones": [
  "Pale wheat",
  "Soft honey",
  "Golden sand",
  "Ochre yellow",
  "Antique gold",
  "Bronze ochre",
  "Umber gold",
  "Deep bronze"
 ],
 "Dusty pastels": [
  "Peach mist",
  "Lilac haze",
  "Mint mist",
  "Powder sky",
  "Rose mist",
  "Oat green",
  "Dusty blue",
  "Soft olive grey"
 ],
 "Jewel tones": [
  "Deep jade",
  "Emerald teal",
  "Sapphire blue",
  "Indigo violet",
  "Amethyst plum",
  "Garnet rose",
  "Amber brown",
  "Ink slate"
 ]
} as const satisfies Record<keyof typeof colourFamilies,readonly string[]>;
export type ShadeReference={hex:string;name:string;family:string;code:string;rgb:string;curated:boolean};
const index=new Map<string,{name:string;family:string}>();
for(const [family,hexes] of Object.entries(colourFamilies))hexes.forEach((hex,i)=>index.set(hex.toUpperCase(),{family,name:names[family as keyof typeof names][i]}));
export function shadeReference(value:string):ShadeReference|null{
 if(!/^#[0-9a-f]{6}$/i.test(value))return null;
 const hex=value.toUpperCase(),rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),curated=index.get(hex);
 return {hex,name:curated?.name??"Custom digital shade",family:curated?.family??"Custom",code:"NB-"+hex.slice(1),rgb:rgb.join(", "),curated:!!curated};
}
export function shadeSpecification(value:string){const s=shadeReference(value);return s?s.name+" ("+s.hex+", digital reference "+s.code+")":"Unspecified digital shade";}
export function shadeBrief(entries:readonly {label:string;value:string}[]){return entries.flatMap(({label,value})=>{const s=shadeReference(value);return s?[label+": "+s.name+" | HEX "+s.hex+" | RGB "+s.rgb+" | "+s.code]:[];}).join("\n")+"\nDigital reference only, not a manufacturer shade code. Ask a dealer for a physical shade-card match and confirm finish, product, coverage and price before purchase.";}

/** Search all 120 shades by name/family or restore a shared custom HEX/NB code.
 * Case-insensitive, no network lookup and no invented manufacturer mappings. */
export function searchShadeReferences(input:string):ShadeReference[]{
 const query=input.trim().toLowerCase().slice(0,100);
 if(!query)return [];
 const exact=/^(?:#|nb-)?([0-9a-f]{6})$/i.exec(query);
 if(exact){const result=shadeReference("#"+exact[1]);return result?[result]:[];}
 const terms=query.split(/\s+/).filter(Boolean);
 return [...index.keys()].flatMap(key=>{const ref=shadeReference(key);if(!ref)return [];const hay=[ref.name,ref.family,ref.hex,ref.code,ref.rgb].join(" ").toLowerCase();return terms.every(term=>hay.includes(term))?[ref]:[];});
}
export function shadeQuoteHref(value:string,application:"interior"|"exterior"|"unspecified"="unspecified"){
 const ref=shadeReference(value);if(!ref)return null;
 const material=(application==="exterior"?"Exterior-rated wall paint":application==="interior"?"Interior wall paint":"Wall paint")+" — "+shadeSpecification(value)+"; match physical shade card, confirm product and finish.";
 return "/quotes?"+new URLSearchParams({category:"paint",unit:"litre",material});
}
