import assert from "node:assert/strict";
export async function verifyInvalidPhotoUpload(page){
     await page.locator(".paint-source input[type=file]").setInputFiles({name:"broken.png",mimeType:"image/png",buffer:Buffer.from("not an image")});
     await page.getByRole("alert").filter({hasText:"Choose a still photo"}).waitFor();
     assert.equal(await page.locator(".nbd-photo canvas").getAttribute("data-sample"),"compact-family");
     assert.ok(await page.locator(".nbd-photo canvas").isVisible(),"invalid upload preserves the working photo");
}

// Reviewed per-photo paint and protected pixel fixtures; imported by browser gate.
export const visualCases=[
      {id:"modern-courtyard",label:/Modern accent residence/,w:1408,h:1056,paint:[[400,260],[320,375],[900,300],[695,400],[480,585],[647,660],[900,720],[230,850],[1150,850],[450,210]],protect:[[450,400],[1100,400],[750,430],[750,720],[400,720],[1100,720],[1220,300],[945,420],[750,900],[250,935],[50,200],[260,440],[600,510]]},
      {id:"family",label:/Modern family home/,w:1200,h:400,paint:[[100,35],[1020,70],[190,65],[490,80],[500,201],[530,240],[1050,235],[150,350],[1020,350],[160,240]],protect:[[300,100],[928,110],[600,115],[600,270],[290,265],[930,270],[600,350],[400,165],[20,60],[515,113]]},
      {id:"contemporary",label:/Contemporary home/,w:880,h:738,paint:[[130,470],[575,414],[270,490]],protect:[[575,365],[365,190],[750,620]]},
      {id:"villa",label:/Premium villa/,w:880,h:584,paint:[[790,320],[640,300],[390,320]],protect:[[520,210],[500,460],[100,100]]},
      {id:"compact-family",label:/100 gaj family home/,w:1536,h:1024,paint:[[402,240],[800,145],[840,290],[790,285],[820,540],[460,730],[800,645],[370,850],[1244,850]],protect:[[480,250],[570,380],[699,350],[965,365],[700,450],[950,470],[620,635],[555,745],[700,740],[950,720],[430,850],[275,865],[970,850],[1120,850],[100,200],[1300,420],[700,55],[700,640]]}
    ];
