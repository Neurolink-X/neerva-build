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
     const cards=page.locator(".wall-pattern-options button");assert.equal(await cards.count(),8);
     for(let i=0;i<8;i++){
      const card=cards.nth(i),name=(await card.innerText()).trim(),start=Date.now();
      await card.click();assert.equal(await card.getAttribute("aria-pressed"),"true");
      const pixels=await canvas.evaluate(c=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(c.toDataURL())))));
      const digest=createHash("sha256").update(pixels).digest("hex");
      wallEvidence.push({group,name,digest,automationMs:Date.now()-start});pixelDigests.add(digest);
      if(i===0)await canvas.screenshot({path:path.join("test-results/mobile","wall-art-"+group.toLowerCase().replaceAll(" ","-")+".png"),animations:"disabled"});
     }
    }
    fs.writeFileSync("test-results/mobile/wall-art-evidence.json",JSON.stringify({scope:"Full sample wall, local Chromium; pixel diversity and screenshots, not photorealism certification or field INP",designCount:wallEvidence.length,uniqueRenders:pixelDigests.size,designs:wallEvidence},null,2));
    assert.equal(pixelDigests.size,72,"all 72 active wall designs must produce different full-wall pixels");
}
