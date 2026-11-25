import {z} from "zod";
export const categories=["Architecture","Materials","Design","Technology","Learning","Platform"] as const;
export const covers={architecture:{src:"/images/studio/house-1.webp",alt:"Residential architecture reference"},materials:{src:"/images/catalog/tmt-bars.webp",alt:"Construction material reference"},interior:{src:"/images/studio/house-4.webp",alt:"Interior design reference"}} as const;
export const slugSchema=z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const source=z.string().max(500).refine(v=>{try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password}catch{return false}});
export const postSchema=z.object({slug:slugSchema,title:z.string().trim().min(8).max(160),summary:z.string().trim().min(20).max(320),body:z.string().trim().min(50).max(16000),language:z.enum(["en","hi"]),category:z.enum(categories),cover:z.enum(["architecture","materials","interior"]),source_url:source.nullable(),status:z.enum(["draft","published","archived"]),reviewed:z.boolean()}).strict().superRefine((v,c)=>{if(v.status==="published"&&(!v.reviewed||v.body.length<150))c.addIssue({code:"custom",path:["reviewed"],message:"Review accuracy and rights and provide at least 150 characters before publishing."})});
export type PostInput=z.infer<typeof postSchema>;
export type PostSummary=Omit<PostInput,"body"|"reviewed"|"source_url">&{version:number;updated_at:string;published_at:string|null};
export type EditorialPost=PostInput&{version:number;updated_at:string;published_at:string|null};
export const summaryColumns="slug,title,summary,language,category,cover,status,version,updated_at,published_at";
export const detailColumns=summaryColumns+",body,reviewed,source_url";
export const editorialTag="neerva-editorial-published";
export const editorialPath=(slug:string)=>"/blog/editorial/"+slug;
export function paragraphs(body:string){return body.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)}
export function readingMinutes(body:string){return Math.max(1,Math.ceil(body.trim().split(/\s+/).length/180))}
