export type IndexingEnv=NodeJS.ProcessEnv|{VERCEL_ENV?:string;NEXT_PUBLIC_SITE_INDEXABLE?:string;NEXT_PUBLIC_SITE_URL?:string;NEERVA_CUSTOM_DOMAIN_ACTIVE?:string};
/** Exact origin allowlist: do not index a credential-bearing URL, port, path or preview. */
export function publicIndexingEnabled(env:IndexingEnv):boolean{
 if(env.VERCEL_ENV!=="production"||env.NEXT_PUBLIC_SITE_INDEXABLE!=="true")return false;
 return env.NEXT_PUBLIC_SITE_URL==="https://neerva-build.vercel.app"||
  (env.NEXT_PUBLIC_SITE_URL==="https://neerva.in"&&env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true");
}
