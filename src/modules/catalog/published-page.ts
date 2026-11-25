import {isMaterialCategory,type MaterialCategory} from "./category-units.ts";
export type PublishedCatalogPage={limit:number;after:string|null;category:MaterialCategory|null};
/** Cursor and query bounds are enforced before any DB or signed-media request. */
export function parsePublishedCatalogPage(params:URLSearchParams):PublishedCatalogPage|null{
 const rawLimit=params.get("limit"),after=params.get("after"),category=params.get("category");
 if(rawLimit!==null&&!/^[1-9][0-9]{0,2}$/.test(rawLimit))return null;
 const limit=rawLimit===null?100:Number(rawLimit);
 if(limit>100||after!==null&&!/^[a-z0-9-]{1,100}$/.test(after)||category!==null&&!isMaterialCategory(category))return null;
 return {limit,after,category:category as MaterialCategory|null};
}
export function takePublishedCatalogPage<T extends {slug:string}>(rows:T[],limit:number){
 const products=rows.slice(0,limit);
 return {products,nextCursor:rows.length>limit?products.at(-1)?.slug??null:null};
}
