import assert from "node:assert/strict";
export async function verifyInvalidPhotoUpload(page){
     await page.locator(".paint-source input[type=file]").setInputFiles({name:"broken.png",mimeType:"image/png",buffer:Buffer.from("not an image")});
     await page.getByRole("alert").filter({hasText:"Choose a still photo"}).waitFor();
     assert.equal(await page.locator(".nbd-photo canvas").getAttribute("data-sample"),"compact-family");
     assert.ok(await page.locator(".nbd-photo canvas").isVisible(),"invalid upload preserves the working photo");
}

// Reviewed per-photo paint and protected pixel fixtures; imported by browser gate.
export const visualCases=[
      {id:"modern-courtyard",label:/Modern accent residence/,w:1408,h:1056,paint:[[400,260],[320,375],[900,300],[695,400],[480,585],[647,660],[900,720],[230,850],[1150,850],[450,210],[600,510],[650,520],[835,530]],protect:[[450,400],[1100,400],[750,430],[750,720],[400,720],[1100,720],[1220,300],[945,420],[750,900],[250,935],[50,200],[260,440],[400,473]]},
      {id:"family",label:/Modern family home/,w:1200,h:400,paint:[[550,60],[300,20],[475,115],[475,195],[400,205],[525,125],[525,174],[650,175],[640,115],[802,110],[805,177],[700,201],[700,245],[690,283],[540,244],[865,230],[478,280],[170,340],[220,310],[1000,350]],protect:[[400,130],[390,75],[300,100],[575,141],[710,140],[620,135],[520,155],[850,120],[639,280],[756,280],[538,286],[820,260],[400,275],[870,350],[660,340],[1000,80]]},
      {id:"contemporary",label:/Contemporary home/,w:880,h:738,paint:[[130,470],[575,414],[270,490]],protect:[[575,365],[365,190],[750,620]]},
      {id:"villa",label:/Premium villa/,w:880,h:584,paint:[[790,320],[640,300],[390,320]],protect:[[520,210],[500,460],[100,100]]},
      {id:"compact-family",label:/100 gaj family home/,w:1536,h:1024,paint:[[402,240],[800,145],[840,290],[790,285],[820,540],[460,730],[800,645],[370,850],[1244,850],[788,435],[838,448],[858,480]],protect:[[480,250],[570,380],[699,350],[965,365],[700,450],[950,470],[620,635],[555,745],[700,740],[950,720],[430,850],[275,865],[970,850],[1120,850],[100,200],[1300,420],[700,55],[700,640]]}
    ];
