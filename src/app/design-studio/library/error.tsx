"use client";
import Link from "next/link";
export default function Error({reset}:{error:Error;reset:()=>void}){return <main style={{maxWidth:740,margin:"5rem auto",padding:"2rem"}}><h1>Could not load the design library</h1><p>Try again. Your original plan is unchanged.</p><button onClick={reset}>Retry</button>{" "}<Link href="/design-studio">Back to Studio</Link></main>}