import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={
 title:"Install NEERVA BUILD | App and Home Screen",
 description:"How to add NEERVA BUILD construction materials and house planning to your home screen on Android, iPhone or desktop.",
 robots:{index:false,follow:true}
};
export default function InstallPage(){
 return <main className="install-help-page" style={{maxWidth:760,margin:"0 auto",padding:"clamp(22px,6vw,60px) 18px",lineHeight:1.7}}>
  <Link href="/" style={{display:"inline-block",marginBottom:24}}>← Back to NEERVA BUILD</Link>
  <p style={{fontSize:12,fontWeight:800,letterSpacing:1.4}}>NEERVA BUILD · QUICK ACCESS</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,7vw,48px)",lineHeight:1.2}}>Add NEERVA BUILD to your home screen</h1>
  <p>Installable as a progressive web app (PWA) on supported browsers. This is not a native Play Store or App Store download. The installer available on this site will use the browser's real install prompt when supported.</p>
  <section style={{display:"grid",gap:15,marginTop:30}}>
   <article style={{background:"#fff",padding:20,border:"1px solid #dde5dc",borderRadius:16}}>
    <h2>Android · Chrome</h2>
    <p>Open this site in Chrome. Tap the three-dot menu (⋮), then <strong>Install app</strong> or <strong>Add to Home screen</strong>. Some browser versions show their own install prompt.</p>
   </article>
   <article style={{background:"#fff",padding:20,border:"1px solid #dde5dc",borderRadius:16}}>
    <h2>iPhone / iPad · Safari</h2>
    <p>Open the site in Safari, tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong> and confirm. iOS does not provide the same `beforeinstallprompt` button as Chromium browsers.</p>
   </article>
   <article style={{background:"#fff",padding:20,border:"1px solid #dde5dc",borderRadius:16}}>
    <h2>Desktop · Chrome or Edge</h2>
    <p>Look for the install icon in the address bar, or use the browser's menu and select <strong>Install NEERVA BUILD</strong> when available.</p>
   </article>
  </section>
  <p style={{marginTop:24,fontSize:14}}>App installation adds a shortcut and some offline-readable public pages. Login, dealer quotes, prices, live stock, orders and payments still require internet connectivity and active verified services.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}><Link href="/materials" style={{padding:"12px 18px",background:"#244c38",color:"#fff",borderRadius:9}}>Browse materials</Link><Link href="/design-studio/road-planner" style={{padding:"12px 18px",border:"1px solid #c7d4c7",borderRadius:9}}>Explore house plans</Link></div>
 </main>;
}
