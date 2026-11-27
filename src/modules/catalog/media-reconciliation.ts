import {approvedMedia,type ApprovedMedia} from "./approved-family-media.ts";
export type MediaReviewIdentity={slug:string;category:string;familyKey?:string|null;publishedMediaCount:number};
export function mediaReview(identity:MediaReviewIdentity,manifest:readonly ApprovedMedia[]=approvedMedia){
 const matches=manifest.filter(m=>m.verified&&m.category===identity.category&&(
  m.scope==="sku"?m.family===identity.slug:m.family===(identity.familyKey??identity.slug)
 ));
 return {publishedMediaCount:identity.publishedMediaCount,
  state:identity.publishedMediaCount>0?"published_media_present":matches.length?"candidate_review_required":"source_required",
  candidates:matches.map(m=>({scope:m.scope,path:m.path,alt:m.alt,sourceUrl:m.sourceUrl,license:m.license,credit:m.credit,sha256:m.sha256,requiresIdentityAndRightsReview:true as const}))};
}
