export type IndexingEnv=NodeJS.ProcessEnv|{VERCEL_ENV?:string;NEXT_PUBLIC_SITE_INDEXABLE?:string;NEXT_PUBLIC_SITE_URL?:string;NEERVA_CUSTOM_DOMAIN_ACTIVE?:string};
export function publicIndexingEnabled(env:IndexingEnv):boolean{
 if(env.VERCEL_ENV!=="production"||env.NEXT_PUBLIC_SITE_INDEXABLE!=="true")return false;
 try{const url=new URL(env.NEXT_PUBLIC_SITE_URL??"");
  return url.protocol==="https:"&&url.pathname==="/"&&url.search===""&&url.hash===""&&(
   url.hostname==="neerva-build.vercel.app"||(url.hostname==="neerva.in"&&env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true")
  );
 }catch{return false}
}
