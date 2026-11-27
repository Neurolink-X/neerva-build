const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FEED_PAGE_SIZE=250;
export const FEED_MAX_PAGES=20;
export function feedCursor(value:unknown):value is string{return typeof value==="string"&&uuid.test(value);}
export function parseFeedPage(params:URLSearchParams){
 if(params.getAll("limit").length>1||params.getAll("after").length>1)return null;
 const raw=params.get("limit"),after=params.get("after");
 if(raw===null)return after===null?{limit:1000,after:null,paginated:false}:null;
 if(!/^[1-9][0-9]{0,2}$/.test(raw)||Number(raw)>FEED_PAGE_SIZE||after!==null&&!feedCursor(after))return null;
 return {limit:Number(raw),after,paginated:true};
}
export function takeFeedPage<T extends {id:string}>(rows:T[],limit:number){
 const page=rows.slice(0,limit);
 return {rows:page,nextCursor:rows.length>limit?page.at(-1)?.id??null:null};
}
