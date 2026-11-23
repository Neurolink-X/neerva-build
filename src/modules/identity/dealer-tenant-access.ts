/** Only active approved dealer tenants may see merchant data.
 * Membership is necessary but is not an approval event.
 */
export function activeDealerTenantIds(
 memberships:readonly {tenant_id:string;active:boolean}[],
 tenants:readonly {id:string;status:string}[]
):string[]{
 const active=new Set(tenants.filter(t=>t.status==="active").map(t=>t.id));
 return [...new Set(memberships.filter(m=>m.active&&active.has(m.tenant_id)).map(m=>m.tenant_id))];
}
