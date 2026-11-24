/** Only add assets after identity, visual review and reuse rights are confirmed. */
export type ApprovedMedia={category:string;family:string;scope:"sku"|"family";path:string;sourceType:"official"|"manufacturer"|"dealer"|"curated";sourceUrl:string;license:string;verified:true;primary:boolean;alt:string;view:"front"|"side"|"close-up"|"installed"|"site";width:number;height:number;sha256:string;bytes:number;sortOrder:number};
export const approvedMedia:readonly ApprovedMedia[]=[];
