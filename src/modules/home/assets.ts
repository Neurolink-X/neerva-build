/**
 * Free commercial-use Unsplash and Pexels photographs shown inside NEERVA BUILD.
 * They are visual illustrations, NEVER project photos, actual listed stock,
 * plan-specific renders, or evidence that any supplier is verified.
 * Licenses: https://unsplash.com/license and https://www.pexels.com/legal-pages/license/
 * Hosted remotely until original production renders are ready.
 */
const pexels=(id:number)=>"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg?auto=compress&cs=tinysrgb";
const unsplash=(id:string)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&q=78";
export const homeVisuals={
 hero:"/illustrations/neerva-house-finished.svg",
 construction:"/illustrations/neerva-house-construction.svg",
 warm:unsplash("photo-1600585152915-d208bec867a1"),
 slate:unsplash("photo-1600585152220-90363fe7e115"),
 nature:unsplash("photo-1600566753190-17f0baa2a6c3"),
 interior:unsplash("photo-1600607687939-ce8a6c25118c"),
 steel:pexels(12709141),
 cement:pexels(29519165),
 bricks:pexels(33973793),
 pipes:pexels(4538790),
 paint:pexels(5641676),
 electrical:pexels(37685875),
} as const;
