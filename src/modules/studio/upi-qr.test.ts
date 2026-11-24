import test from "node:test";
import assert from "node:assert/strict";
import {upiQrModules,upiQrSvgPath,UPI_QR_SIZE} from "./upi-qr.ts";
import {studioUpiUrl} from "./paid-products.ts";
test("generate error-corrected locally rendered QR for each admin-set INR amount",()=>{
 for(const amount of [9900,14900,19900,29900,249900]){
  const uri=studioUpiUrl("home_studio","12345678-bbbb-4444-aaaa-123456789000",amount);
  const grid=upiQrModules(uri);
  assert.equal(grid.length,57);
  assert.equal(UPI_QR_SIZE,57);
  assert.ok(grid.every(row=>row.length===57));
  assert.equal(grid[0][0],true);
  assert.equal(grid[0][6],true);
  assert.equal(grid[6][6],true);
  assert.equal(grid[8][6],true,"timing pattern correct");
  assert.equal(grid[49][8],true,"QR fixed dark module");
  assert.ok(grid.flat().filter(Boolean).length>650);
  assert.ok(upiQrSvgPath(uri).startsWith("M"));
 }
});
test("reject unsafe or oversized QR payloads instead of rendering fake payment",()=>{
 assert.throws(()=>upiQrModules("https://example.com"),/INVALID_UPI_PAYLOAD/);
 assert.throws(()=>upiQrModules("upi://pay?pa=x&am=1&cu=INR&tn="+"x".repeat(400)),/QR_CONTENT_LENGTH_UNSUPPORTED/);
});
