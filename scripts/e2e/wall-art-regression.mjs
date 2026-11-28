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
    for(const group of ["Signature","Murals","Nature","Classic","Modern","Geometry","Printed","3D effects","Architectural"]){
     await page.getByRole("button",{name:group,exact:true}).click();
     const cards=page.locator(".wall-pattern-options button");assert.equal(await cards.count(),4);
     for(let i=0;i<4;i++){
      const card=cards.nth(i),name=(await card.innerText()).trim(),start=Date.now();
      await card.click();assert.equal(await card.getAttribute("aria-pressed"),"true");
      await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")!=="loading");
      if(await card.locator(".paint-texture-swatch").count())assert.equal(await canvas.getAttribute("data-wall-texture"),"ready");
      const pixels=await canvas.evaluate(c=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(c.toDataURL())))));
      const digest=createHash("sha256").update(pixels).digest("hex");
      if(group==="Geometry"){const shade=page.getByLabel("Pattern colour");const prior=await shade.inputValue();await shade.fill(prior==="#305c80"?"#c4925f":"#305c80");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,pixels);await shade.fill(prior);await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,pixels);}
      wallEvidence.push({group,name,digest,automationMs:Date.now()-start});pixelDigests.add(digest);
      if(i===0)await canvas.screenshot({path:path.join("test-results/mobile","wall-art-"+group.toLowerCase().replaceAll(" ","-")+".png"),animations:"disabled"});
     }
    }
    await page.getByRole("button",{name:"3D effects",exact:true}).click();await page.getByRole("button",{name:"Sculptural wave relief",exact:true}).click();await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");
    const before=await canvas.evaluate(c=>c.toDataURL());await page.getByLabel("Pattern colour").fill("#305c80");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,before);const recoloured=await canvas.evaluate(c=>c.toDataURL());await page.getByLabel(/Design intensity/).fill("0.25");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,recoloured);
    await page.getByRole("button",{name:"Sample house exterior",exact:true}).click();
    for(const house of ["family","contemporary","villa","compact-family","modern-courtyard"]){await page.locator(`[data-facade-sample="${house}"]`).click();await page.waitForFunction(id=>{const c=document.querySelector(".paint-canvas-frame[aria-busy=false] canvas");return c?.dataset.sample===id},house);await page.getByRole("button",{name:"Paint + design",exact:true}).click();assert.equal(await page.locator(".paint-targets button[aria-pressed=true]").count(),1);assert.match(await page.locator(".paint-targets button[aria-pressed=true]").innerText(),/Best for design/);await page.getByRole("button",{name:"Geometry",exact:true}).click();const before=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Hexagon geometry",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,before);const design=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Full exterior",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,design);}
    fs.writeFileSync("test-results/mobile/wall-art-evidence.json",JSON.stringify({scope:"Full sample wall, local Chromium; pixel diversity and screenshots, not photorealism certification or field INP",designCount:wallEvidence.length,uniqueRenders:pixelDigests.size,designs:wallEvidence},null,2));
    assert.equal(pixelDigests.size,36,"all 36 active wall designs must produce different full-wall pixels");
}
