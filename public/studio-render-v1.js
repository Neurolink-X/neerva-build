// On-demand CPU ray tracer. Geometry is supplied by the selected Three.js scene.
// No network textures, third-party renderer, server GPU or customer photo upload.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const product=(a,b)=>a.map((v,i)=>v*b[i]);
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const EPS=.0001;
const vec=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
const unitColor=v=>vec(v)&&v.every(x=>x>=0&&x<=1);
const range=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
function validateScene(boxes,camera){
 if(!camera||![camera.origin,camera.forward,camera.right,camera.up].every(vec)||!range(camera.fov,10,120))throw new Error("Invalid render camera.");
 const axes=[camera.forward,camera.right,camera.up];
 if(axes.some(v=>Math.abs(Math.hypot(...v)-1)>.02)||Math.abs(dot(axes[0],axes[1]))>.02||Math.abs(dot(axes[0],axes[2]))>.02||Math.abs(dot(axes[1],axes[2]))>.02)throw new Error("Invalid camera orientation.");
 if(boxes.some(b=>!b||!vec(b.lo)||!vec(b.hi)||b.lo.some((v,i)=>v>=b.hi[i]||Math.abs(v)>10000||Math.abs(b.hi[i])>10000)||!unitColor(b.color)||!range(b.opacity,0,1)||!range(b.rough,0,1)||!range(b.metal,0,1)))throw new Error("Invalid render geometry or material.");
}
const linear=v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
function highlight(n,l,d,rough,metal,albedo){
 const h=norm(sub(l,d)),nh=Math.max(0,dot(n,h)),vh=Math.max(0,-dot(d,h));
 const f0=albedo.map(v=>.04*(1-metal)+v*metal),f=f0.map(v=>v+(1-v)*Math.pow(1-vh,5));
 const exponent=Math.min(256,Math.max(4,2/Math.pow(Math.max(.09,rough),2)-2));
 return mul(f,Math.pow(nh,exponent)*Math.min(8,(exponent+2)/8));
}
export function intersectBox(o,d,lo,hi,limit=Infinity){
 let near=-Infinity,far=limit,na=0,fa=0,ns=1,fs=1;
 for(let k=0;k<3;k++){
  if(Math.abs(d[k])<1e-10){if(o[k]<lo[k]||o[k]>hi[k])return null;continue}
  let a=(lo[k]-o[k])/d[k],b=(hi[k]-o[k])/d[k],s=-1;
  if(a>b){[a,b]=[b,a];s=1}
  if(a>near){near=a;na=k;ns=s}if(b<far){far=b;fa=k;fs=-s}
  if(near>far)return null;
 }
 const outside=near>EPS,t=outside?near:far;
 if(t<=EPS||t>=limit)return null;
 const normal=[0,0,0];normal[outside?na:fa]=outside?ns:fs;
 return {t,normal};
}
function bounds(items){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const b of items)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],b.lo[k]);hi[k]=Math.max(hi[k],b.hi[k])}
 return {lo,hi};
}
function bvh(items){
 const box=bounds(items);if(items.length<=5)return {...box,items};
 const ext=sub(box.hi,box.lo),axis=ext.indexOf(Math.max(...ext));
 const ordered=[...items].sort((a,b)=>(a.lo[axis]+a.hi[axis])-(b.lo[axis]+b.hi[axis]));
 const mid=ordered.length>>1;return {...box,left:bvh(ordered.slice(0,mid)),right:bvh(ordered.slice(mid))};
}
function overlaps(o,d,node,limit){
 let near=0,far=limit;
 for(let k=0;k<3;k++){
  if(Math.abs(d[k])<1e-10){if(o[k]<node.lo[k]||o[k]>node.hi[k])return false;continue}
  const a=(node.lo[k]-o[k])/d[k],b=(node.hi[k]-o[k])/d[k];
  near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far)return false;
 }
 return far>EPS;
}
function nearest(tree,o,d,limit=Infinity){
 let best=null;const stack=[tree];
 while(stack.length){const n=stack.pop();if(!overlaps(o,d,n,best?.t??limit))continue;
  if(n.items){for(const b of n.items){const h=intersectBox(o,d,b.lo,b.hi,best?.t??limit);if(h)best={...h,b}}}
  else stack.push(n.left,n.right);
 }
 return best;
}
function hemisphere(n,rng){
 const u=rng(),phi=2*Math.PI*rng(),r=Math.sqrt(u);
 const tangent=norm(cross(Math.abs(n[1])<.9?[0,1,0]:[1,0,0],n)),bitangent=cross(n,tangent);
 return norm(add(add(mul(tangent,r*Math.cos(phi)),mul(bitangent,r*Math.sin(phi))),mul(n,Math.sqrt(1-u))));
}
const reflect=(d,n)=>sub(d,mul(n,2*dot(d,n)));
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
/** Meter-anchored material patterns shared by image renders. No network assets. */
export function materialVariation(finish,p,n){
 const a=Math.abs(n[0])>.5?p[2]:p[0],b=Math.abs(n[1])>.5?p[2]:p[1];
 const fract=x=>x-Math.floor(x),edge=(x,period)=>Math.min(fract(x/period),1-fract(x/period));
 if(finish==="tile")return edge(a,.6)<.012||edge(b,.6)<.012?.62:.96+.03*Math.sin(a*41+b*17);
 if(finish==="marble"){const vein=Math.abs(Math.sin(a*8+b*3+1.8*Math.sin(b*5)+.6*Math.sin(a*19)));return .79+.21*Math.min(1,vein*4);}
 if(finish==="wood")return .87+.11*Math.sin(a*95+2*Math.sin(b*3))+.02*Math.sin(a*250+b*6);
 if(finish==="panel"||finish==="acp")return edge(a,finish==="acp"?1.2:.3)<.009||finish==="acp"&&edge(b,1.2)<.009?.55:.98;
 return 1;
}
function shade(tree,origin,dir,rng,evening,lights){
 let result=[0,0,0],weight=[1,1,1],o=origin,d=dir;
 const light=norm(evening?[-.8,.28,-.6]:[-.65,.85,-.7]),sun=evening?[2.1,1.1,.55]:[2.4,2.25,1.95];
 for(let bounce=0;bounce<4;bounce++){
  const hit=nearest(tree,o,d);
  if(!hit){const t=clamp(d[1]*.5+.5,0,1),sky=evening?[.12+.19*t,.17+.22*t,.28+.32*t]:[.36+.29*t,.48+.28*t,.64+.26*t];result=add(result,product(weight,sky));break}
  const p=add(o,mul(d,hit.t)),n=dot(d,hit.normal)<0?hit.normal:mul(hit.normal,-1),m=hit.b;
  // Low-amplitude, world-anchored diffuse variation gives matte surfaces depth
  // without texture downloads, additional rays or changes to scene geometry.
  const texture=m.opacity>.98&&m.rough>.6&&m.metal<.15?1+.025*Math.sin(p[0]*67+p[1]*53+p[2]*79)*Math.cos(p[0]*31-p[2]*43):1;
  const albedo=m.color.map(v=>clamp(linear(v)*texture*materialVariation(m.finish,p,n),0,1));
  // Transparent panels allow transmission; this is a bounded approximation, not full spectral refraction.
  if(m.opacity<.98){
   const fresnel=.04+.96*Math.pow(1-clamp(-dot(d,n),0,1),5);
   if(rng()<fresnel){d=norm(reflect(d,n));o=add(p,mul(n,EPS*5));continue;}
   if(rng()>m.opacity){o=add(p,mul(d,EPS*5));weight=product(weight,m.color.map(v=>.88+.12*v));continue;}
  }
  const l=norm(add(light,mul(hemisphere(light,rng),.035))),cos=Math.max(0,dot(n,l));
  if(cos>0){const blocker=nearest(tree,add(p,mul(n,EPS*5)),l);const visibility=blocker?(blocker.b.opacity<.98?.5:0):1;
   const diffuse=mul(albedo,(1-m.metal)*.6),gloss=highlight(n,l,d,m.rough,m.metal,albedo);
   result=add(result,mul(product(product(weight,add(diffuse,gloss)),sun),cos*visibility));}
  if(bounce===0&&lights?.length){for(const lamp of lights){const sample=add(lamp.position,[(rng()-.5)*.35,0,(rng()-.5)*.35]),delta=sub(sample,p),distance=Math.hypot(...delta);if(distance<EPS)continue;const l=mul(delta,1/distance),cos=Math.max(0,dot(n,l));if(cos===0)continue;const shadow=nearest(tree,add(p,mul(n,EPS*5)),l,distance-EPS*8);if(!shadow||shadow.b.opacity<.98)result=add(result,mul(product(product(weight,add(mul(albedo,1-m.metal),highlight(n,l,d,m.rough,m.metal,albedo))),lamp.color),cos*lamp.power/(1+distance*distance)*(shadow?.b.opacity<.98?.5:1)));}}
  const spec=clamp(.04+m.metal*.72+(1-m.rough)*.12,.04,.92);
  if(rng()<spec){d=norm(add(reflect(d,n),mul(hemisphere(n,rng),m.rough*m.rough*.65)));if(dot(d,n)<=0)d=hemisphere(n,rng);weight=product(weight,m.color.map(v=>m.metal?v:.85+.15*v));}
  else{d=hemisphere(n,rng);weight=product(weight,albedo);}
  o=add(p,mul(n,EPS*5));
 }
 return result;
}
function toByte(x){const a=clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0,1);return Math.round(255*Math.pow(a,1/2.2))}
export function renderScene(job,report){
 const {boxes,camera,width,height,samples,evening}=job;
 const lights=Array.isArray(job.lights)?job.lights.slice(0,4).filter(l=>l.position?.length===3&&l.color?.length===3&&[...l.position,...l.color,l.power].every(Number.isFinite)&&l.power>=0&&l.power<=100):[];
 if(!Array.isArray(boxes)||!boxes.length||boxes.length>2500||!Number.isInteger(width)||!Number.isInteger(height)||width<16||height<16||width>768||height>768||width*height>420000||!Number.isInteger(samples)||samples<1||samples>16)throw Error("Unsupported render size or scene complexity.");
 validateScene(boxes,camera);
 const tree=bvh(boxes),acc=new Float32Array(width*height*3),rng=random(7319);
 const scale=Math.tan(camera.fov*Math.PI/360),aspect=width/height;
 for(let s=0;s<samples;s++){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const u=(2*(x+rng())/width-1)*scale*aspect,v=(1-2*(y+rng())/height)*scale;
   const ray=norm(add(add(camera.forward,mul(camera.right,u)),mul(camera.up,v)));
   const rgb=shade(tree,camera.origin,ray,rng,evening,lights),i=(y*width+x)*3;
   for(let k=0;k<3;k++)acc[i+k]+=rgb[k];
  }
  if(s===0||(s+1)%2===0||s===samples-1){
   const pixels=new Uint8ClampedArray(width*height*4);
   for(let i=0;i<width*height;i++){for(let k=0;k<3;k++)pixels[i*4+k]=toByte(acc[i*3+k]/(s+1));pixels[i*4+3]=255}
   report({pixels,width,height,completed:s+1,samples});
  }
 }
}
if(typeof self!=="undefined"&&typeof document==="undefined"){
 self.onmessage=event=>{try{renderScene(event.data,frame=>self.postMessage(frame,[frame.pixels.buffer]));}catch(error){self.postMessage({error:error instanceof Error?error.message:"Render failed."});}};
}
