import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Temporary preview-only exporter for six ALREADY PUBLIC catalog images. No arbitrary URLs. */
const allowed = new Set(["aggregates-samples.webp","cement-sack.webp","clay-bricks.webp","electrical-wiring.webp","pvc-pipe.webp","tmt-bars.webp"]);
export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production") return NextResponse.json({error:"unavailable"},{status:404});
  const name=request.nextUrl.searchParams.get("name")??"";
  const rawOffset=request.nextUrl.searchParams.get("offset")??"0";
  const rawLength=request.nextUrl.searchParams.get("length")??"4096";
  if (!allowed.has(name)||!/^(0|[1-9][0-9]{0,6})$/.test(rawOffset)||!/^[1-9][0-9]{0,4}$/.test(rawLength)) return NextResponse.json({error:"invalid request"},{status:400});
  const offset=Number(rawOffset),length=Number(rawLength);
  if (length>4096) return NextResponse.json({error:"limit"},{status:400});
  try {
    const upstream=await fetch("https://neerva-build.vercel.app/images/catalog/"+name,{cache:"no-store"});
    if(!upstream.ok) return NextResponse.json({error:"asset unavailable"},{status:502});
    const data=Buffer.from(await upstream.arrayBuffer());
    if(data.length>512000||offset>data.length) return NextResponse.json({error:"out of range"},{status:416});
    return NextResponse.json({name,totalBytes:data.length,offset,contentBase64:data.subarray(offset,offset+length).toString("base64")});
  }catch{return NextResponse.json({error:"asset unavailable"},{status:502});}
}
