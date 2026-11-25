"use client";
import Link from "next/link";

// Root layout failures replace the document, so keep this recovery shell independent.
export default function GlobalError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <html lang="en-IN"><body style={{fontFamily:"system-ui, sans-serif",margin:0,color:"#17221e",background:"#f5f4ef"}}><main role="alert" style={{maxWidth:640,margin:"12vh auto",padding:24}}><h1>Neerva couldn’t load this screen.</h1><p>Try again, or return to the homepage. Check your account before repeating a payment or order.</p><button type="button" onClick={reset}>Try again</button>{" "}<Link href="/">Return home</Link></main></body></html>;
}
