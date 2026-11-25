import "server-only";
import {createClient} from "@supabase/supabase-js";
import {unstable_cache} from "next/cache";
import {cache} from "react";
import {summaryColumns,detailColumns,editorialTag,slugSchema,type PostSummary,type EditorialPost} from "./editorial";
function publicClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:"no-store",signal:AbortSignal.timeout(3500)})}})}
const cachedList=unstable_cache(async()=>{const db=publicClient();if(!db)return [];const {data,error}=await db.from("editorial_posts").select(summaryColumns).eq("status","published").order("published_at",{ascending:false}).order("slug").limit(24);if(error)throw Error("Editorial list unavailable");return (data??[]) as unknown as PostSummary[]},["neerva-editorial-list-v1"],{revalidate:60,tags:[editorialTag]});
export async function publishedEditorial(){try{return {posts:await cachedList(),available:true}}catch{return {posts:[],available:false}}}
export const publishedPost=cache(async(slug:string):Promise<{post:EditorialPost|null;available:boolean}>=>{if(!slugSchema.safeParse(slug).success)return {post:null,available:true};try{const db=publicClient();if(!db)return {post:null,available:false};const {data,error}=await db.from("editorial_posts").select(detailColumns).eq("slug",slug).eq("status","published").maybeSingle();return error?{post:null,available:false}:{post:data as unknown as EditorialPost|null,available:true}}catch{return {post:null,available:false}}});
