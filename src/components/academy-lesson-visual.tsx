
import Image from "next/image";
const scenes:Record<string,{title:string;steps:string[];note:string}>={
 "site-soil":{title:"Check the site before excavation",steps:["Measured boundaries","Soil investigation","Engineer’s foundation design","Excavation safety plan"],note:"Order depends on local approvals and site conditions."},
 "underground-work":{title:"A typical foundation sequence",steps:["Setting out","Excavation & inspection","Blinding / footing","Plinth & sleeves","Test, document & backfill"],note:"Concept sequence only; not a footing section or structural detail."},
 "brick-count":{title:"From wall dimensions to brick count",steps:["Gross wall area","Subtract openings","Multiply thickness","Divide modular unit volume","Add order allowance"],note:"The drawing illustrates an opening; actual bond and unit dimensions determine quantity."},
 "cement-mix":{title:"How concrete quality is controlled",steps:["Approved mix","Measured batching","Controlled placement","Compaction","Curing & tests"],note:"A ratio alone does not establish strength."},
 "steel-quantity":{title:"From bar schedule to order quantity",steps:["Diameter","Scheduled length","Unit mass","Total by diameter","Order allowance"],note:"Never choose bar sizes or spacing from this diagram."},
 "site-errors":{title:"Inspection before concealment",steps:["Inspect","Test","Record","Resolve defects","Approve covering"],note:"Keep dated records and escalate structural issues."},
 "waterproofing":{title:"Trace the moisture",steps:["Identify source","Check drainage","Specify system","Inspect details","Test before finish"],note:"A damp stain may be distant from the source."},
 "house-budget":{title:"Budget categories",steps:["Design & approvals","Civil work","Services","Finishes","Contingency"],note:"These stages are not a fixed cost percentage."},
 "services-coordination":{title:"Coordinate before finishing",steps:["Drawings","Service routes","Approved openings","Tests","As-built records"],note:"Use qualified electrical and plumbing professionals."}
};
export function AcademyLessonVisual({id}:{id:string}){
 const scene=scenes[id];if(scene)return <figure className="academy-visual"><figcaption><strong>{scene.title}</strong></figcaption>{id==="brick-count"&&<svg viewBox="0 0 320 150" role="img" aria-label="Concept wall with an opening deducted from gross area"><defs><pattern id="lesson-brick" width="42" height="24" patternUnits="userSpaceOnUse"><rect width="42" height="24" fill="#c78262"/><path d="M0 0H42M0 12H42M0 0V12M21 12V24" stroke="#f4e9db" strokeWidth="2"/></pattern></defs><rect x="24" y="12" width="272" height="120" fill="url(#lesson-brick)" stroke="#79503d"/><rect x="124" y="48" width="72" height="84" fill="#fff" stroke="#79503d"/><text x="160" y="86" fontSize="10" textAnchor="middle" fill="#254738">Opening</text><text x="160" y="145" fontSize="10" textAnchor="middle" fill="#254738">Illustrative wall — not to scale</text></svg>}<ol>{scene.steps.map(step=><li key={step}>{step}</li>)}</ol><small>{scene.note}</small></figure>;
 if(id==="colour-light"||id==="heat-comfort"||id==="spatial-thinking")return <figure className="academy-visual"><div className="academy-reference"><Image src={id==="heat-comfort"?"/images/studio/house-1.webp":"/images/studio/house-4.webp"} alt="Residential design reference photograph" fill sizes="(max-width:700px) 90vw, 680px"/></div><figcaption>Photographic reference: notice the placement of openings, light and circulation. Not an approved Neerva plan.</figcaption></figure>;
 return null;
}
