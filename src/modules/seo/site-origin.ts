/** Fail closed: a custom hostname is never canonical before explicit cutover approval. */
export function canonicalPublicOrigin(env:{NEERVA_CUSTOM_DOMAIN_ACTIVE?:string;NEXT_PUBLIC_SITE_URL?:string}):string{
 if(env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true"&&env.NEXT_PUBLIC_SITE_URL==="https://neerva.in")return "https://neerva.in";
 const supplied=env.NEXT_PUBLIC_SITE_URL;
 if(supplied==="https://neerva-build.vercel.app")return supplied;
 // Do not derive SEO authority from arbitrary request Host/X-Forwarded-Host input.
 return "https://neerva-build.vercel.app";
}
export function customDomainCutoverReady(env:{NEERVA_CUSTOM_DOMAIN_ACTIVE?:string;NEXT_PUBLIC_SITE_URL?:string}):boolean{
 return env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true"&&env.NEXT_PUBLIC_SITE_URL==="https://neerva.in";
}
