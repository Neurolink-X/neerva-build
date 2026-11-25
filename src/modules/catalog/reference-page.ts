/** Bound catalog rendering without dropping any product or variant. */
export const REFERENCE_PAGE_SIZE=24;
export function referencePage<T>(items:readonly T[],requestedPage:number){
 const pages=Math.max(1,Math.ceil(items.length/REFERENCE_PAGE_SIZE));
 const page=Math.min(pages-1,Math.max(0,Number.isSafeInteger(requestedPage)?requestedPage:0));
 const start=page*REFERENCE_PAGE_SIZE;
 return {page,pages,start,end:Math.min(start+REFERENCE_PAGE_SIZE,items.length),items:items.slice(start,start+REFERENCE_PAGE_SIZE)};
}
