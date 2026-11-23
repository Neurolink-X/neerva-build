export type IndexingEnv=NodeJS.ProcessEnv|{VERCEL_ENV?:string;NEXT_PUBLIC_SITE_INDEXABLE?:string;NEXT_PUBLIC_SITE_URL?:string};
export function publicIndexingEnabled(env:IndexingEnv):boolean{
 if(env.VERCEL_ENV!=="production"||env.NEXT_PUBLIC_SITE_INDEXABLE!=="true")return false;
 try{const url=new URL(env.NEXT_PUBLIC_SITE_URL??"");
  return url.protocol==="https:"&&url.pathname==="/"&&url.search===""&&url.hash===""&&url.hostname!=="localhost";
 }catch{return false}
}
