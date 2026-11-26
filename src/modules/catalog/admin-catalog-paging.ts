export async function loadAllAdminCatalog<T>(request:(path:string)=>Promise<{products?:T[];nextOffset?:number|null}>):Promise<T[]>{
 const products:T[]=[];let offset=0;
 for(let page=0;page<100;page++){const r=await request("/api/admin/catalog?offset="+offset);if(!Array.isArray(r.products))throw Error("Invalid catalog response");products.push(...r.products);if(r.nextOffset==null)return products;if(!Number.isInteger(r.nextOffset)||r.nextOffset!==offset+100)throw Error("Invalid catalog page cursor");offset=r.nextOffset}
 throw Error("Catalog exceeds supported admin batch limit. Narrow the catalog query.");
}
