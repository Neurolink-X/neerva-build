import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {visualCases} from "./photo-upload-regression.mjs";

export async function verifyWallArtwork(page){
 const canvas=page.locator(".nbd-photo .paint-canvas-frame[aria-busy=false] canvas");
 await page.getByRole("button",{name:"Signature Wall Gallery",exact:true}).click();
 const gallery=page.getByRole("region",{name:"Signature wall gallery"});await gallery.waitFor({state:"visible"});assert.equal(await gallery.locator(".signature-wall-grid button").count(),8);assert.equal(await gallery.locator(".signature-wall-grid img").count(),8);assert.equal(await gallery.locator("input,canvas,svg").count(),0);for(const img of await gallery.locator(".signature-wall-grid img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0&&getComputedStyle(i).objectFit==="contain"));}assert.equal(await page.getByRole("searchbox",{name:"Find a shade"}).count(),0);await gallery.getByRole("button",{name:/Emerald & champagne/}).click();await gallery.getByRole("region",{name:"Selected wall artwork"}).waitFor({state:"visible"});await gallery.getByRole("region",{name:"Selected wall artwork"}).locator("img").evaluate(i=>i.decode());await gallery.getByRole("button",{name:"Close detail"}).click();await page.getByRole("button",{name:"Paint visualizer",exact:true}).click();

    // The new corner sample has two pre-marked walls and preserves furniture.
    await page.getByRole("button",{name:"Sample room",exact:true}).click();
    await page.getByRole("combobox",{name:"Room sample",exact:true}).selectOption("corner");
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.getAttribute("data-room-sample")==="corner");
    assert.equal(await page.getByRole("button",{name:"All walls",exact:true}).getAttribute("aria-pressed"),"true");
    const search=page.getByRole("searchbox",{name:"Find a shade"});await search.fill("NB-B6C7A3");assert.equal(await page.getByRole("button",{name:"Select #b6c7a3",exact:true}).count(),1);await search.fill("");
    await page.getByText("Shade details & purchase reference",{exact:true}).click();assert.match(await page.locator(".neerva-shade-reference").innerText(),/NB-[0-9A-F]{6}/);const quote=await page.getByRole("link",{name:"Quote selected shade",exact:false}).getAttribute("href");assert.match(quote,/category=paint/);assert.ok(!quote.includes("quantity="));await page.getByText("Shade details & purchase reference",{exact:true}).click();
    const protectedPixel=await canvas.evaluate(c=>[...c.getContext("2d").getImageData(Math.floor(c.width*.16),Math.floor(c.height*.72),1,1).data]);
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    const designPicker=page.getByRole("group",{name:"Choose which wall gets the design"});
    await designPicker.waitFor({state:"visible"});
    assert.equal(await page.locator(".wall-pattern-options").count(),1,"design library remains visible while choosing a wall");
    await designPicker.getByRole("button",{name:"Sofa wall",exact:true}).click();
    assert.equal(await designPicker.count(),0);
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")!=="loading");
    const design=await canvas.evaluate(c=>c.toDataURL());
    await page.getByRole("button",{name:"Full Room",exact:true}).click();await page.getByRole("button",{name:"Full Room",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Sofa wall",exact:true}).getAttribute("aria-pressed"),"true");assert.equal(await canvas.evaluate(c=>c.toDataURL()),design);
    await page.getByRole("button",{name:"Side wall",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Sofa wall",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Paint + design",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await canvas.evaluate(c=>c.toDataURL()),design);
    assert.deepEqual(await canvas.evaluate(c=>[...c.getContext("2d").getImageData(Math.floor(c.width*.16),Math.floor(c.height*.72),1,1).data]),protectedPixel);
    await canvas.screenshot({path:path.join("test-results/mobile","corner-room-two-walls.png")});
    // Clicking an active sample tab must not reload or reset the selected artwork.
    await page.getByRole("button",{name:"Sample room",exact:true}).click();assert.equal(await canvas.evaluate(c=>c.toDataURL()),design);
    // Daylight sample requires confirmed manual marking before enabling paint.
    await page.getByRole("combobox",{name:"Room sample",exact:true}).selectOption("daylight");
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.getAttribute("data-room-sample")==="daylight");
    assert.equal(await page.getByRole("button",{name:"Save colour preview",exact:true}).isDisabled(),true);
    assert.equal(await page.getByRole("button",{name:"Paint + design",exact:true}).isDisabled(),true);
    const manual=page.getByRole("group",{name:"Manual wall marking"});
    await manual.waitFor();
    assert.equal(await page.getByRole("button",{name:"Save colour preview",exact:true}).isDisabled(),true);
    await canvas.scrollIntoViewIfNeeded();
    const bounds=await canvas.boundingBox();
    for(const [x,y] of [[.1,.2],[.9,.2],[.9,.7]])await canvas.click({position:{x:x*bounds.width,y:y*bounds.height}});
    await manual.getByRole("button",{name:"Undo last point",exact:true}).click();
    assert.match(await manual.innerText(),/2\/4/);
    await manual.getByRole("button",{name:"Reset points",exact:true}).click();
    assert.match(await manual.innerText(),/0\/4/);
    const updated=await canvas.boundingBox();
    for(const [x,y] of [[.1,.2],[.9,.2],[.9,.7],[.1,.7]])await canvas.click({position:{x:x*updated.width,y:y*updated.height}});
    assert.equal(await page.getByRole("button",{name:"Save colour preview",exact:true}).isDisabled(),true);
    await page.getByRole("button",{name:"Confirm wall",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"Save colour preview",exact:true}).isEnabled(),true);
    const daylight=await canvas.evaluate(c=>c.toDataURL());
    await page.locator(".paint-custom-shade input[type=color]").fill("#385c71");
    await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,daylight);
    await page.getByRole("combobox",{name:"Room sample",exact:true}).selectOption("feature");
    // Actual full-wall sample, not only the small selection fixture. Record
    // all visible designs' rendered pixels and representative screenshots.
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.getAttribute("data-room-sample")==="feature");
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:/Image-based premium finishes/i}).count(),0,"no duplicate image-only collection");
    for(const [group,name] of [["Signature","Metallic floral frames"],["Nature","Tropical leaf fresco"],["Modern","Sculpted arch and ribbons"],["Geometry","Metallic architectural geometry"]]){
     await page.getByRole("button",{name:group,exact:true}).click();
     const card=page.getByRole("button",{name,exact:true});await card.click();
     await card.locator(".paint-texture-swatch").waitFor({state:"visible"});
     await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");
     assert.equal(await page.getByText("How to paint this design",{exact:true}).count(),1);
    }
    await page.getByRole("button",{name:"Signature",exact:true}).click();
    await page.getByRole("button",{name:"3D effects",exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll(".wall-pattern-options .paint-texture-swatch").length===8);await page.getByRole("button",{name:"Signature",exact:true}).click();
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
      if(group==="Geometry"){const opacity=page.getByLabel(/Design intensity/);const previous=await opacity.inputValue();await opacity.fill("0.65");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,pixels);const edited=await canvas.evaluate(c=>c.toDataURL());await card.click();assert.equal(await opacity.inputValue(),"0.65");assert.equal(await canvas.evaluate(c=>c.toDataURL()),edited);await opacity.fill(previous);await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,pixels);}
      const digest=createHash("sha256").update(pixels).digest("hex");
      assert.notEqual(pixels,baseline.digest,name+" must visibly change the wall");
      assert.deepEqual(await canvas.evaluate(c=>[...c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.72),1,1).data]),baseline.protected,name+" must preserve the protected sofa");
      if(group==="Geometry"){const shade=page.getByLabel("Pattern colour");const prior=await shade.inputValue();await shade.fill(prior==="#305c80"?"#c4925f":"#305c80");await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,pixels);await shade.fill(prior);await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,pixels);}
      wallEvidence.push({group,name,digest,automationMs:Date.now()-start});pixelDigests.add(digest);
      await canvas.screenshot({path:path.join("test-results/mobile","wall-art-"+group.toLowerCase().replaceAll(" ","-")+"-"+(i+1)+".png"),animations:"disabled"});
     }
    }
    // Explicitly exercise artwork against matching light and dark pigments.
    await page.getByRole("button",{name:"Geometry",exact:true}).click();await page.getByRole("button",{name:"Metallic architectural geometry",exact:true}).click();
    const customBase=page.locator(".paint-custom-shade input[type=color]");
    for(const tone of ["#f7f5ef","#20242b"]){await customBase.fill(tone);await page.getByLabel("Pattern colour").fill(tone);await page.getByText("Contrast-adjusted preview pigment:",{exact:false}).waitFor({state:"visible"});await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");const painted=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Plain paint",exact:true}).click();assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),painted,"artwork stays distinct on "+tone);await page.getByRole("button",{name:"Paint + design",exact:true}).click();}
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
    await page.getByRole("button",{name:"Geometry",exact:true}).click();await page.getByRole("button",{name:"Fine hexagonal linework",exact:true}).click();
    await page.getByRole("button",{name:"+ Add wall",exact:true}).click();await mark([[.59,.08],[.94,.08],[.94,.89],[.59,.89]]);
    assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Wall 1",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Paint + design",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("button",{name:"Fine hexagonal linework",exact:true}).getAttribute("aria-pressed"),"true");
    const both=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"All walls",exact:true}).click();assert.equal(await canvas.evaluate(c=>c.toDataURL()),both);
    assert.equal(await page.getByRole("button",{name:"Wall Detail",exact:true}).isDisabled(),true);
    await page.getByRole("button",{name:"Wall 2",exact:true}).click();assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"All walls",exact:true}).click();await page.getByRole("button",{name:"Select #b6c7a3",exact:true}).click();
    await page.getByRole("radio",{name:"Exterior wall",exact:true}).check();
    assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("button",{name:"3D effects",exact:true}).count(),0);
    await page.getByRole("radio",{name:"Interior wall",exact:true}).check();
    assert.equal(await page.getByRole("button",{name:"Wall 1",exact:true}).count(),1);assert.equal(await page.getByRole("button",{name:"Wall 2",exact:true}).count(),1);
    await page.getByText("Shade details & purchase reference",{exact:true}).click();assert.equal((await page.locator(".neerva-shade-row small").allTextContents()).filter(s=>s.includes("NB-B6C7A3")).length,2);await page.getByText("Shade details & purchase reference",{exact:true}).click();
    await page.getByRole("button",{name:"Sample house exterior",exact:true}).click();
    for(const house of ["family","contemporary","villa","compact-family","modern-courtyard"]){await page.locator(`[data-facade-sample="${house}"]`).click();await page.waitForFunction(id=>{const c=document.querySelector(".paint-canvas-frame[aria-busy=false] canvas");return c?.dataset.sample===id},house);await page.getByRole("button",{name:"Paint + design",exact:true}).click();assert.equal(await page.locator(".paint-targets button[aria-pressed=true]").count(),1);assert.match(await page.locator(".paint-targets button[aria-pressed=true]").innerText(),/Full exterior/);await page.getByRole("button",{name:"Geometry",exact:true}).click();const before=await canvas.evaluate(c=>c.toDataURL());await page.getByRole("button",{name:"Rectangular stone-block effect",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()!==old,before);const design=await canvas.evaluate(c=>c.toDataURL());assert.match(await page.locator(".paint-targets button[aria-pressed=true]").innerText(),/Best for design/);assert.equal(await page.getByRole("button",{name:"3D effects",exact:true}).count(),0);assert.equal(await page.getByRole("button",{name:"Murals",exact:true}).count(),0);await page.getByRole("button",{name:"Full exterior",exact:true}).click();await page.waitForFunction(old=>document.querySelector(".paint-canvas-frame canvas")?.toDataURL()===old,design);}
    fs.writeFileSync("test-results/mobile/wall-art-evidence.json",JSON.stringify({scope:"Full sample wall, local Chromium; pixel diversity and screenshots, not photorealism certification or field INP",designCount:wallEvidence.length,uniqueRenders:pixelDigests.size,designs:wallEvidence},null,2));
    assert.equal(pixelDigests.size,72,"all 72 active wall designs must produce different full-wall pixels");
}

/** Complete colour studio browser flow, including all wall pixel checks. */
export async function verifyColourStudio(page,base){
    const visual=await page.goto(base+"/design-studio/visualizer",{waitUntil:"load"});
    assert.equal(visual?.status(),200,"colour editor route");
    assert.equal(await page.locator(".paint-live-workspace .paint-adjacent-controls").count(),1,"colour controls are adjacent to live preview");
    const paintLayout=await page.locator(".paint-live-workspace").evaluate(el=>{const canvas=el.querySelector(".paint-live-preview"),palette=el.querySelector(".paint-adjacent-controls");return !!canvas&&!!palette&&canvas.nextElementSibling?.contains(palette)});
    assert.ok(paintLayout,"photo and palette occupy a single workspace");
    const roomPreview=page.locator(".nbd-photo canvas");
    await roomPreview.waitFor({state:"visible"});
    const samplePixel=()=>roomPreview.evaluate(c=>Array.from(c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data).slice(0,3));
    await page.getByRole("button",{name:"Select #293f36",exact:true}).click();
    await page.waitForFunction(()=>{const c=document.querySelector(".nbd-photo canvas"),p=c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data;return p[1]>p[0]&&p[1]>p[2]&&p[1]<90});
    const dark=await samplePixel();
    await page.getByRole("button",{name:"Select #edf2db",exact:true}).click();
    await page.waitForFunction(d=>{const c=document.querySelector(".nbd-photo canvas");return c.getContext("2d").getImageData(Math.floor(c.width*.5),Math.floor(c.height*.32),1,1).data[1]>d[1]+70},dark);
    // All-walls design action must ask for explicit wall selection, not change it.
    // Then test the retained manual tools
    // on the original feature-room sample instead of expecting them on corner.
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    assert.equal(await page.getByRole("button",{name:"All walls",exact:true}).getAttribute("aria-pressed"),"true");
    const picker=page.getByRole("group",{name:"Choose which wall gets the design"});
    await picker.getByRole("button",{name:"Sofa wall",exact:true}).click();
    assert.equal(await picker.count(),0);
    assert.equal(await page.getByRole("button",{name:"Sofa wall",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("button",{name:"Paint + design",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("button",{name:"Wall Detail",exact:true}).isEnabled(),true);
    assert.equal(await page.locator(".paint-wall-actions").count(),0,"pre-marked corner hides manual selection tools");
    await page.getByRole("combobox",{name:"Room sample",exact:true}).selectOption("feature");
    await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.getAttribute("data-room-sample")==="feature");
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    const actionSizes=await page.locator(".paint-wall-actions button,.paint-preview-actions button").evaluateAll(bs=>bs.filter(b=>b.getClientRects().length>0).map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
    assert.ok(actionSizes.length>=3&&actionSizes.every(b=>b.w>=100&&b.h>=44&&b.h<=88),"wall actions stay compact and readable");
    assert.equal(await page.locator(".paint-wall-actions .paint-more").getAttribute("open"),null,"advanced wall tools are initially collapsed");
    assert.equal(await page.locator(".paint-live-preview .paint-preview-actions button").count(),2,"compare and save remain next to the canvas");
    assert.equal(await page.getByRole("combobox",{name:"Wall design",exact:true}).count(),0,"no duplicate pattern selector");
    await page.getByRole("button",{name:"Sample house exterior"}).click();
    const preview=page.locator(".nbd-photo canvas");
    await preview.waitFor({state:"visible"});
    assert.equal(await page.getByRole("button",{name:"Plain paint",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("group",{name:"Wall design samples",exact:true}).count(),0,"plain mode hides patterns");
    // Test actual painted canvas pixels, not merely sample labels or changed image hashes.
    // All reviewed image fixtures live in the photo regression module.
    assert.equal(await page.locator(".paint-sample-gallery button").count(),visualCases.length,"every house must have a pixel regression case");
    assert.ok(await page.locator(".paint-sample-gallery").evaluate(el=>el.scrollWidth<=el.clientWidth+2&&[...el.querySelectorAll("button")].every(b=>b.getBoundingClientRect().right<=el.getBoundingClientRect().right+1)),"all house cards fit without horizontal clipping");
    const evidence=[];
    for(const sample of visualCases){
      await page.getByRole("button",{name:sample.label}).click();
      await page.waitForFunction(id=>{const c=document.querySelector(".nbd-photo canvas");return c?.dataset.sample===id&&c.getBoundingClientRect().height>0&&!!document.querySelector(".paint-preview-actions button")},sample.id);
      await page.getByRole("button",{name:"Full exterior",exact:true}).click();
      await page.getByRole("button",{name:"View original",exact:true}).click();
      assert.ok(await preview.evaluate(c=>{const r=c.getBoundingClientRect(),p=c.parentElement.getBoundingClientRect();return Math.abs(r.width/r.height-c.width/c.height)<.025&&r.left>=p.left-1&&r.right<=p.right+1&&p.right<=innerWidth+1}),"full facade fits without cropping or horizontal overflow");
      const points=[...sample.paint,...sample.protect].map(([x,y])=>[x/sample.w,y/sample.h]);
      const pixels=()=>preview.evaluate((canvas,coords)=>coords.map(([x,y])=>Array.from(canvas.getContext("2d").getImageData(Math.floor(x*canvas.width),Math.floor(y*canvas.height),1,1).data).slice(0,3)),points);
      const unpainted=await pixels();
      await preview.screenshot({path:path.join("test-results/mobile","390-facade-"+sample.id+"-original.png")});
      await page.getByRole("button",{name:"Show new paint",exact:true}).click();
      await page.getByRole("button",{name:"Select #edf2db",exact:true}).click();
      const pale=await pixels();
      const started=Date.now();
      await page.getByRole("button",{name:"Select #293f36",exact:true}).click();
      await page.waitForFunction(({coords,count})=>{const c=document.querySelector(".nbd-photo canvas");return coords.slice(0,count).every(([x,y])=>{const p=c.getContext("2d").getImageData(Math.floor(x*c.width),Math.floor(y*c.height),1,1).data;return p[1]>p[0]&&p[1]>p[2]&&p[1]<100})},{coords:points,count:sample.paint.length},{timeout:1500});
      const elapsed=Date.now()-started,dark=await pixels();
      for(let i=0;i<sample.paint.length;i++)assert.ok(pale[i][1]>dark[i][1]+45,sample.id+" wall "+i+" changes shade");
      assert.deepEqual(dark.slice(sample.paint.length),unpainted.slice(sample.paint.length),sample.id+" windows/cladding/pool/sky remain unchanged");
      assert.deepEqual(pale.slice(sample.paint.length),unpainted.slice(sample.paint.length),sample.id+" protected areas remain unchanged with pale shade");
      await preview.screenshot({path:path.join("test-results/mobile","390-facade-"+sample.id+"-painted.png")});
      evidence.push({sample:sample.id,wallPoints:sample.paint.length,protectedPoints:sample.protect.length,automationElapsedMs:elapsed});
    }
    fs.writeFileSync("test-results/mobile/facade-pixel-evidence.json",JSON.stringify({scope:"390px Chromium canvas sample points; elapsed includes browser automation and is not field INP",samples:evidence},null,2));
    await page.getByRole("button",{name:"Paint + design",exact:true}).click();
    await page.getByRole("button",{name:"Classic",exact:true}).click();
    const patternButton=page.getByRole("button",{name:"Sandstone-toned bands",exact:true});
    await patternButton.evaluate(el=>el.scrollIntoView({block:"end",behavior:"instant"}));
    await page.waitForFunction(()=>{const b=[...document.querySelectorAll(".wall-pattern-options button")].find(e=>e.textContent?.trim()==="Sandstone-toned bands");if(!b)return false;const r=b.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;return y>0&&y<innerHeight&&b.contains(document.elementFromPoint(x,y));});
    const stableScroll=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(window.scrollY)))));
    const hit=await patternButton.boundingBox();assert.ok(hit);
    await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2);
    const afterPatternScroll=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(window.scrollY)))));
    assert.ok(Math.abs(afterPatternScroll-stableScroll)<=3,"choosing a visible design must not jump the page to the house");
    assert.equal(await patternButton.getAttribute("aria-pressed"),"true");
    await page.getByRole("button",{name:"Sample room",exact:true}).click();
 await page.getByRole("combobox",{name:"Room sample",exact:true}).selectOption("feature");
 await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame[aria-busy=false] canvas")?.getAttribute("data-room-sample")==="feature");
 const canvas=page.locator(".nbd-photo canvas");
 await canvas.waitFor({state:"visible"});await canvas.scrollIntoViewIfNeeded();
 async function mark(x){let b=await canvas.boundingBox();for(const [u,v] of [[x,.12],[x+.12,.12],[x+.12,.26],[x,.26]])await canvas.click({position:{x:u*b.width,y:v*b.height}});}
 await page.getByText("Wall selection tools",{exact:true}).click();
 await page.getByRole("button",{name:/Reset wall selection/}).click();
 await mark(.06);
 const plainBeforePattern=await canvas.evaluate(c=>c.toDataURL());
 await page.getByRole("button",{name:"Paint + design",exact:true}).click();
 await page.getByRole("button",{name:"Signature",exact:true}).click();await page.getByRole("button",{name:"Luxury orbit rings",exact:true}).click();
 const orbit=await canvas.evaluate(c=>c.toDataURL());assert.notEqual(orbit,plainBeforePattern,"circular mural must alter actual canvas pixels");
 await page.getByRole("button",{name:"Nature",exact:true}).click();await page.getByRole("button",{name:"Magnolia garden fresco",exact:true}).click();await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),orbit,"floral artwork differs from the circle mural");
 let visibleDesigns=0;for(const group of ["Signature","Nature","Murals","Classic","Modern","Geometry","Printed","3D effects","Architectural"]){await page.getByRole("button",{name:group,exact:true}).click();visibleDesigns+=await page.locator(".wall-pattern-options button").count();}assert.equal(visibleDesigns,72,"curated collection must not contain retired filler designs");
 await page.getByRole("button",{name:"3D effects",exact:true}).click();
 await page.getByRole("button",{name:"Sculptural wave relief",exact:true}).click();await canvas.waitFor({state:"visible"});await page.waitForFunction(()=>document.querySelector(".paint-canvas-frame canvas")?.getAttribute("data-wall-texture")==="ready");const relief=await canvas.evaluate(c=>c.toDataURL());assert.notEqual(relief,plainBeforePattern);
 await page.getByRole("button",{name:"Printed",exact:true}).click();await page.getByRole("button",{name:"Silk botanical inlay",exact:true}).click();assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),relief);
 await page.getByRole("button",{name:"Classic",exact:true}).click();await page.getByRole("button",{name:"Diamond lattice",exact:true}).click();
 await page.getByRole("button",{name:"Keep wall & select another"}).click();
 await mark(.56);await page.getByRole("button",{name:"Heritage border accent",exact:true}).click();
 const png=()=>canvas.evaluate(c=>c.toDataURL());
 const combo=await png();await page.getByRole("button",{name:"View original"}).click();assert.notEqual(await png(),combo);
 await page.getByRole("button",{name:"Show new colour"}).click();assert.equal(await png(),combo);
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Save colour preview"}).click();assert.match((await download).suggestedFilename(),/png$/);
    await verifyWallArtwork(page);
}
