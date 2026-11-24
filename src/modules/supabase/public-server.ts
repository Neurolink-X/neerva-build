import {createClient,type SupabaseClient} from "@supabase/supabase-js";
// This client is server-side, anonymous and immutable. Never attach a user JWT
// or a service-role key. Reuse transport on warm invocations, not cached prices.
let connection:{url:string;key:string;client:SupabaseClient}|undefined;
export function publicDatabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 if(!connection||connection.url!==url||connection.key!==key){
  connection={url,key,client:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})};
 }
 return connection.client;
}
// No stored response cache: publication changes, timed price expiry, withdrawal
// and checkout availability are read from the authoritative RLS database.
export function timedPublicResponse(start:number,response:Response){
 response.headers.set("Server-Timing","public_api;dur="+Math.max(0,performance.now()-start).toFixed(1));
 response.headers.set("Cache-Control","no-store, max-age=0");
 response.headers.set("X-Content-Type-Options","nosniff");
 return response;
}
