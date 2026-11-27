import test from "node:test";
import assert from "node:assert/strict";
import {mediaReview} from "./media-reconciliation.ts";
import type {ApprovedMedia} from "./approved-family-media.ts";
const sample:ApprovedMedia={category:"paint",family:"interior",scope:"family",path:"/images/catalog/approved/sample.webp",sourceType:"curated",sourceUrl:"https://example.org/source",license:"CC BY",licenseUrl:"https://example.org/license",credit:"Sample",verified:true,primary:true,alt:"Family reference",view:"front",width:400,height:400,sha256:"a".repeat(64),bytes:1000,sortOrder:0};
test("media candidates never become publication evidence",()=>{
 const identity={slug:"interior-20l",category:"paint",familyKey:"interior",publishedMediaCount:0};
 const review=mediaReview(identity,[sample]);
 assert.equal(review.state,"candidate_review_required");assert.equal(review.candidates[0].requiresIdentityAndRightsReview,true);
 assert.equal(mediaReview({...identity,category:"tiles"},[sample]).state,"source_required");
 assert.equal(mediaReview(identity,[{...sample,scope:"sku"}]).state,"source_required");
 assert.equal(mediaReview({...identity,publishedMediaCount:1},[]).state,"published_media_present");
});
