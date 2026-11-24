/** Fail closed: a custom hostname is never canonical before explicit cutover approval. */
export function canonicalPublicOrigin(env:Record<string,string|undefined>):string{
 if(env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true"&&env.NEXT_PUBLIC_SITE_URL==="https://neerva.in")return "https://neerva.in";
 const supplied=env.NEXT_PUBLIC_SITE_URL;
 if(supplied==="https://neerva-build.vercel.app")return supplied;
 // Do not derive SEO authority from arbitrary request Host/X-Forwarded-Host input.
 return "https://neerva-build.vercel.app";
}
export function customDomainCutoverReady(env:Record<string,string|undefined>):boolean{
 return env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true"&&env.NEXT_PUBLIC_SITE_URL==="https://neerva.in";
}
