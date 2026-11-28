import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";

export async function verifyWallArtwork(page){
 const canvas=page.locator(".nbd-photo .paint-canvas-frame[aria-busy=false] canvas");
    // Actual full-wall sample, not only the small selection fixture. Record
    // all visible designs' rendered pixels and representative screenshots.
    await page.getByRole("button",{name:"Sample room",exact:true}).click();
    await page.locator(".paint-canvas-frame[aria-busy=false] canvas").waitFor({state:"visible"});
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    const wallEvidence=[],pixelDigests=new Set();
    const fullRoom=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Wall Detail",exact:true}).click();assert.equal(await canvas.getAttribute("data-interior-view"),"detail");assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),fullRoom);await page.getByRole("button",{name:"Full Room",exact:true}).click();assert.equal(await canvas.evaluate(c=>c.toDataURL()),fullRoom);
    // Capture the baseline on the same masked wall, then check every artwork
    // changes painted pixels without touching a known protected sofa pixel.
    await page.getByRole("button",{name:"Plain paint",exact:true}).click();
    const baseline=await canvas.evaluate(c=>{const ctx=c.getContext("2d");return {digest:c.toDataURL(),protected:[...ctx.getImageData(Math.floor(c.width*.5),Math.floor(c.height*.72),1,1).data]};});
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    for(const group of ["Signature","Murals","Nature","Classic","Modern","Geometry","Printed","3D effects","Architectural"]){
     await page.getByRole("button",{name:group,exact:true}).click();
     const cards=page.locator(".wall-pattern-options button");assert.equal(await cards.count(),8);
     for(let i=0;i<8;i++){
      const card=cards.nth(i),name=(await card.innerText()).trim(),start=Date.now();
      await card.click();assert.equal(await card.getAttribute("aria-pressed"),"true");
      await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")!=="loading");
      if(await card.locator(".paint-texture-swatch").count())assert.equal(await canvas.getAttribute("data-wall-texture"),"ready");
      const pixels=await canvas.evaluate(c=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(c.toDataURL())))));
      const digest=createHash("sha256").update(pixels).digest("hex");
      assert.notEqual(pixels,baseline.digest,name+" must visibly change the wall");
      assert.deepEqual(await canvas.evaluate(c=>[...c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.72),1,1).data]),baseline.protected,name+" must preserve the protected sofa");
      if(group==="Geometry"){const shade=page.getByLabel("Pattern colour");const prior=await shade.inputValue();await shade.fill(prior==="#305c80"?"#c4925f":"#305c80");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,pixels);await shade.fill(prior);await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,pixels);}
      wallEvidence.push({group,name,digest,automationMs:Date.now()-start});pixelDigests.add(digest);
      await canvas.screenshot({path:path.join("test-results/mobile","wall-art-"+group.toLowerCase().replaceAll(" ","-")+"-"+(i+1)+".png"),animations:"disabled"});
     }
    }
    await page.getByRole("button",{name:"3D effects",exact:true}).click();await page.getByRole("button",{name:"Sculptural wave relief",exact:true}).click();await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");
    const before=await canvas.evaluate(c=>c.toDataURL());await page.getByLabel("Pattern colour").fill("#305c80");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,before);const recoloured=await canvas.evaluate(c=>c.toDataURL());await page.getByLabel(/Design intensity/).fill("0.25");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,recoloured);
    // Exercise multi-wall independently on a synthetic two-plane fixture. This
    // verifies state and pixels, not the quality of a photographic room asset.
    const fixture=await page.evaluate(()=>{const c=document.createElement("canvas");c.width=800;c.height=500;const ctx=c.getContext("2d");ctx.fillStyle="#eee7da";ctx.fillRect(0,0,800,500);ctx.fillStyle="#ccc6bd";ctx.fillRect(450,0,350,500);return c.toDataURL("image/png").split(",")[1]});
    await page.locator('.nbd-photo input[type=file]').setInputFiles({name:"two-wall-fixture.png",mimeType:"image/png",buffer:Buffer.from(fixture,"base64")});
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.dataset.sample==="custom");
    const mark=async(coords)=>{await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();for(const [x,y] of coords)await canvas.click({position:{x:x*b.width,y:y*b.height}})};
    await mark([[.05,.08],[.53,.08],[.53,.89],[.05,.89]]);
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    await page.getByRole("button",{name:"Geometry",exact:true}).click();await page.getByRole("button",{name:"Hexagon geometry",exact:true}).click();
    await page.getByRole("button",{name:"+ Add wall",exact:true}).click();await mark([[.59,.08],[.94,.08],[.94,.89],[.59,.89]]);
    assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Wall 1",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Paint + design",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("button",{name:"Hexagon geometry",exact:true}).getAttribute("aria-pressed"),"true");
    const both=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"All walls",exact:true}).click();assert.equal(await canvas.evaluate(c=>c.toDataURL()),both);
    assert.equal(await page.getByRole("button",{name:"Wall Detail",exact:true}).isDisabled(),true);
    await page.getByRole("button",{name:"Wall 2",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Sample house exterior",exact:true}).click();
    for(const house of ["family","contemporary","villa","compact-family","modern-courtyard"]){await page.locator(`[data-facade-sample="${house}"]`).click();await page.waitForFunction(id=>{const c=document.querySelector(".paint-canvas-frame[aria-busy=false] canvas");return c?.dataset.sample===id},house);await page.getByRole("button",{name:"Paint + design",exact:true}).click();assert.equal(await page.locator(".paint-targets button[aria-pressed=true]").count(),1);assert.match(await page.locator(".paint-targets button[aria-pressed=true]").innerText(),/Best for design/);await page.getByRole("button",{name:"Geometry",exact:true}).click();const before=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Rectangular stone-block effect",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,before);const design=await canvas.evaluate(c=>c.toDataURL());assert.equal(await page.getByRole("button",{name:"3D effects",exact:true}).count(),0);assert.equal(await page.getByRole("button",{name:"Murals",exact:true}).count(),0);await page.getByRole("button",{name:"Full exterior",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,design);}
    fs.writeFileSync("test-results/mobile/wall-art-evidence.json",JSON.stringify({scope:"Full sample wall, local Chromium; pixel diversity and screenshots, not photorealism certification or field INP",designCount:wallEvidence.length,uniqueRenders:pixelDigests.size,designs:wallEvidence},null,2));
    assert.equal(pixelDigests.size,72,"all 72 active wall designs must produce different full-wall pixels");
}
