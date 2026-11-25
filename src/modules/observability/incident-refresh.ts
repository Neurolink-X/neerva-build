export const INCIDENT_REFRESH_MS=15000;
export function incidentRefreshDelay(failures:number){return failures<=0?INCIDENT_REFRESH_MS:Math.min(120000,30000*2**Math.min(2,failures-1))}
export function canRefreshIncidents(visible:boolean,online:boolean,busy:boolean){return visible&&online&&!busy}
export function countActiveIncidents(rows:readonly {status:string;severity:string}[]){const active=rows.filter(r=>r.status==="open"||r.status==="investigating");return {active:active.length,urgent:active.filter(r=>r.severity==="critical"||r.severity==="error").length}}
