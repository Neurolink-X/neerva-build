import type {DemoProduct} from "./marketplace.ts";
export type AggregateGroup="morang"|"balu"|"gitti";
type Row=[string,string,string,AggregateGroup,string,string,string];
const rows:Row[]=[
  [
    "morang-coarse-sand",
    "Morang / coarse sand",
    "मौरंग / मोटी बालू",
    "morang",
    "Coarse natural sand; confirm grading, source and silt",
    "Concrete or masonry only as specified by site engineer",
    "Grading report, silt, moisture and source"
  ],
  [
    "river-sand-bulk",
    "River sand / balu",
    "नदी की बालू",
    "balu",
    "Natural sand; grading to be confirmed",
    "Concrete or mortar according to approved grading",
    "Source, silt, moisture and legal transit documents"
  ],
  [
    "fine-plaster-sand",
    "Fine plaster sand",
    "प्लास्टर की बारीक बालू",
    "balu",
    "Fine sand for plastering; confirm grading",
    "Plaster and specified finishing mortar",
    "Particle grading, clay/silt and finish requirements"
  ],
  [
    "washed-sand",
    "Washed construction sand",
    "धुली हुई बालू",
    "balu",
    "Washed sand; confirm actual grading and cleanliness",
    "Mortar or concrete only if approved for the mix",
    "Washing, grading, moisture and test report"
  ],
  [
    "manufactured-sand",
    "M-sand / crushed stone sand",
    "एम-सैंड",
    "balu",
    "Manufactured crushed stone sand",
    "Approved concrete and masonry mixes",
    "Particle grading, fines content and mix approval"
  ],
  [
    "filling-sand",
    "Filling sand",
    "भराई की बालू",
    "balu",
    "Non-structural fill; confirm source and compaction",
    "Plinth and floor filling where specified",
    "Compaction, contamination and moisture; not concrete-grade by default"
  ],
  [
    "crushed-aggregate-bulk",
    "Gitti / crushed stone",
    "गिट्टी / क्रश्ड स्टोन",
    "gitti",
    "Select nominal size or graded mix",
    "Concrete or base layers according to specification",
    "Nominal size, sieve analysis, shape and source"
  ],
  [
    "gitti-10mm",
    "10 mm stone aggregate",
    "10 मिमी गिट्टी",
    "gitti",
    "10 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "gitti-12-5mm",
    "12.5 mm stone aggregate",
    "12.5 मिमी गिट्टी",
    "gitti",
    "12.5 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "gitti-16mm",
    "16 mm stone aggregate",
    "16 मिमी गिट्टी",
    "gitti",
    "16 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "gitti-20mm",
    "20 mm stone aggregate",
    "20 मिमी गिट्टी",
    "gitti",
    "20 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "gitti-40mm",
    "40 mm stone aggregate",
    "40 मिमी गिट्टी",
    "gitti",
    "40 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "gitti-63mm",
    "63 mm stone aggregate",
    "63 मिमी गिट्टी",
    "gitti",
    "63 mm nominal size; actual grading to confirm",
    "Concrete or infrastructure use only according to engineer-approved mix",
    "Sieve analysis, flakiness, strength and approved nominal size"
  ],
  [
    "graded-aggregate",
    "Graded stone aggregate",
    "मिक्स ग्रेड गिट्टी",
    "gitti",
    "Graded aggregate mix; specify sieve range",
    "Concrete or base applications as specified",
    "Mix grading, fines, compaction and engineer approval"
  ],
  [
    "crusher-dust",
    "Crusher dust / stone dust",
    "स्टोन डस्ट",
    "gitti",
    "Fine crushed material; not automatically M-sand",
    "Bedding or fill where specified",
    "Fines, contamination, compaction; not a concrete-sand substitute without testing"
  ]
];
export const aggregateReferences=rows.map(([slug,name,hi,group,grade,use,checks])=>({slug,name,hi,group,grade,use,checks}));
export const aggregateProducts:DemoProduct[]=aggregateReferences.map(r=>({slug:r.slug,category:"aggregates",name:r.name,brand:"Local supplier to confirm",verification:"reference",quoteOnly:true,description:r.use+". "+r.checks+". Final supply and freight depend on your delivery location.",specifications:[{label:"Material / grade",value:r.grade},{label:"Application",value:r.use},{label:"Quality checks",value:r.checks},{label:"Quantity unit",value:"Cubic metre / tonne / truck (capacity to confirm)"},{label:"Delivery",value:"Confirm pincode, vehicle access, legal source and unloading"}]}));
export const aggregatePhotoSources={
 morang:{src:"https://upload.wikimedia.org/wikipedia/commons/0/03/Sand_as_building_materials.jpg",source:"https://commons.wikimedia.org/wiki/File:Sand_as_building_materials.jpg",alt:"Representative construction sand texture, not a verified morang source"},
 balu:{src:"https://upload.wikimedia.org/wikipedia/commons/d/db/Heap_of_Fine_Construction_Sand.jpg",source:"https://commons.wikimedia.org/wiki/File:Heap_of_Fine_Construction_Sand.jpg",alt:"Representative fine construction sand, not a verified supplier batch"},
 gitti:{src:"https://upload.wikimedia.org/wikipedia/commons/8/84/Coarse_aggregate.jpg",source:"https://commons.wikimedia.org/wiki/File:Coarse_aggregate.jpg",alt:"Representative coarse aggregate, not a calibrated nominal size"}
} as const;
export function aggregateReference(slug:string){return aggregateReferences.find(r=>r.slug===slug);}
export function aggregateQuoteQuantity(quantity:string,unit:string){
 const amount=Number(quantity);if(!quantity.trim()||!Number.isFinite(amount)||amount<=0||amount>1000000)return null;
 if(unit==="cft"){const converted=Math.round(amount*0.028316846592*1000)/1000;return converted>=.001?{quantity:String(converted),unit:"cubic_metre",note:amount+" cubic feet requested (converted to m³)"}:null;}
 if(!["cubic_metre","tonne","truck"].includes(unit)||unit==="truck"&&!Number.isInteger(amount))return null;
 return {quantity:String(amount),unit,note:""};
}
