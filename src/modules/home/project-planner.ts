export const stages=[
 {id:"planning",name:"Planning & approvals",hi:"योजना और अनुमति",tasks:["Confirm plot dimensions","Review layout with a professional","Check local approvals"],links:[["/design-studio","Explore layouts"],["/calculators","Plot calculator"]]},
 {id:"foundation",name:"Foundation",hi:"नींव",tasks:["Confirm structural quantities","Compare delivered material rates"],links:[["/materials/cement","Cement"],["/materials/steel","TMT steel"],["/materials/aggregates","Sand & aggregates"]]},
 {id:"structure",name:"Structure & masonry",hi:"ढांचा और चिनाई",tasks:["Review structural drawings","Prepare material requirements"],links:[["/materials/bricks-blocks","Bricks & blocks"],["/materials/steel","TMT steel"]]},
 {id:"services",name:"Plumbing & electrical",hi:"प्लंबिंग और बिजली",tasks:["Confirm pipe and wiring specifications","Review installation plan"],links:[["/materials/plumbing","Pipes & fittings"],["/materials/electrical","Electrical"]]},
 {id:"finishes",name:"Finishing & interiors",hi:"फिनिशिंग और इंटीरियर",tasks:["Choose physical finish samples","Compare finish quantities and rates"],links:[["/materials/tiles","Tiles"],["/materials/paint","Paint"],["/design-studio/visualizer","Preview colours"]]}
] as const;
export type StageId=typeof stages[number]["id"];
export type Project={stage:StageId;budget:number;spent:number;done:string[]};
export const projectKey="neerva-project-planner-v1";
export const initialProject:Project={stage:"planning",budget:0,spent:0,done:[]};
export const taskIds=stages.flatMap(s=>s.tasks.map((_,i)=>s.id+":"+i));
function amount(v:unknown){return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1000000000?Math.round(v):0}
export function parseProject(value:unknown):Project{
 if(!value||typeof value!=="object")return {...initialProject,done:[]};
 const p=value as Partial<Project>;
 return {stage:stages.some(s=>s.id===p.stage)?p.stage!:"planning",budget:amount(p.budget),spent:amount(p.spent),done:Array.isArray(p.done)?[...new Set(p.done.filter(x=>typeof x==="string"&&taskIds.includes(x)))]:[]};
}
export function projectStats(p:Project){return {completed:p.done.length,total:taskIds.length,percent:Math.round(p.done.length/taskIds.length*100),balance:p.budget-p.spent}}
export function toggleTask(p:Project,id:string):Project{if(!taskIds.includes(id))return p;return {...p,done:p.done.includes(id)?p.done.filter(x=>x!==id):[...p.done,id]}}
