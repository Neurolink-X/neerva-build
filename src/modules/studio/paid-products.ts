export const studioProducts={
 home_studio:{label:"Home Studio Pro",short:"Home Studio",pricePaise:14900,
  description:"One-time access to extended plot-plan comparison and personal concept export."},
 colour_studio:{label:"Colour Studio Pro",short:"Colour Studio",pricePaise:14900,
  description:"One-time access to premium wall-palette combinations and downloadable shade specification."}
} as const;
export type StudioProduct=keyof typeof studioProducts;
export const isStudioProduct=(s:unknown):s is StudioProduct=>typeof s==="string"&&Object.hasOwn(studioProducts,s);
export const studioPayee={id:"arjunchaurasiya1254-2@oksbi",name:"ARJUN CHAURASIYA"} as const;
export function studioPaymentEnabled(env:{NEERVA_STUDIO_PAYMENTS_ENABLED?:string;NEERVA_OPERATOR_TERMS_VERIFIED?:string}):boolean{
 return env.NEERVA_STUDIO_PAYMENTS_ENABLED==="true"&&env.NEERVA_OPERATOR_TERMS_VERIFIED==="true";
}
export function studioUpiUrl(product:StudioProduct,orderId?:string):string{
 const service=studioProducts[product];
 const note="Neerva "+service.short+(orderId?" "+orderId.slice(0,8):"")+" INR149";
 const q=new URLSearchParams({pa:studioPayee.id,pn:studioPayee.name,am:(service.pricePaise/100).toFixed(2),cu:"INR",tn:note});
 return "upi://pay?"+q.toString();
}
