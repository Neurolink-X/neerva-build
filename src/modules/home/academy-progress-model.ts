// Stable content identifiers; client progress never imports the lesson corpus.
export const lessonIds=["spatial-thinking","materials-engineering","money-literacy","colour-light","sustainable-thinking","digital-models","career-skills","digital-trust"] as const;
export const progressKey="neerva-academy-v1";
export type Progress={completed:string[];practiced:string[]};
export function parseProgress(value:unknown):Progress{const p=value&&typeof value==="object"?value as Partial<Progress>:{};const clean=(v:unknown)=>Array.isArray(v)?[...new Set(v.slice(0,128).filter((id):id is string=>typeof id==="string"&&lessonIds.some(l=>l===id)))].slice(0,lessonIds.length):[];return {completed:clean(p.completed),practiced:clean(p.practiced)}}
export function updateProgress(p:Progress,id:string,key:keyof Progress):Progress{return parseProgress({...p,[key]:[...p[key],id]})}
export function readProgress(raw:string|null):Progress{try{return parseProgress(raw&&raw.length<=4096?JSON.parse(raw):null)}catch{return parseProgress(null)}}
