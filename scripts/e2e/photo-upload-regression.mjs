import assert from "node:assert/strict";
export async function verifyInvalidPhotoUpload(page){
     await page.locator(".paint-source input[type=file]").setInputFiles({name:"broken.png",mimeType:"image/png",buffer:Buffer.from("not an image")});
     await page.getByRole("alert").filter({hasText:"Choose a still photo"}).waitFor();
     assert.equal(await page.locator(".nbd-photo canvas").getAttribute("data-sample"),"compact-family");
     assert.ok(await page.locator(".nbd-photo canvas").isVisible(),"invalid upload preserves the working photo");
}
