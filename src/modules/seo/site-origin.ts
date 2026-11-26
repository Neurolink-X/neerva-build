const DEFAULT_ORIGIN="https://neerva-build.vercel.app";
const CUSTOM_ORIGINS=["https://neerva.in","https://www.neerva.in"] as const;
type Env=Record<string,string|undefined>;
export function customDomainCutoverReady(env:Env):boolean{
 return env.NEERVA_CUSTOM_DOMAIN_ACTIVE==="true"&&CUSTOM_ORIGINS.some(origin=>origin===env.NEXT_PUBLIC_SITE_URL);
}
/** Never use an untrusted request Host as SEO authority. */
export function canonicalPublicOrigin(env:Env):string{
 return customDomainCutoverReady(env)?env.NEXT_PUBLIC_SITE_URL!:DEFAULT_ORIGIN;
}
/** Use only the chosen verified custom host; never redirect that host to itself. */
export function canonicalRedirects(env:Env){
 if(env.VERCEL_ENV!=="production"||!customDomainCutoverReady(env))return [];
 const origin=canonicalPublicOrigin(env);
 const canonicalHost=new URL(origin).hostname;
 return [new URL(DEFAULT_ORIGIN).hostname,...CUSTOM_ORIGINS.map(value=>new URL(value).hostname)]
  .filter(host=>host!==canonicalHost)
  .map(host=>({source:"/:path*",has:[{type:"host" as const,value:host}],destination:origin+"/:path*",permanent:true}));
}
