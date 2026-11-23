/** One local-only planning list shared by manual entry and product detail.
 * No price or order is stored here; server-side RFQs remain separate.
 */
export const PLANNING_STORAGE_KEY = "neerva-planning-material-list-v1";
export const planningUnits = ["bag","kg","tonne","piece","bundle","quintal","truck","cubic_metre","length","coil","metre"] as const;
export type PlanningUnit = typeof planningUnits[number];
export type PlanningLine = { id: string; name: string; quantity: number; unit: PlanningUnit };
export function isPlanningUnit(input: string): input is PlanningUnit {
  return (planningUnits as readonly string[]).includes(input);
}
export function safePlanningList(value: unknown): PlanningLine[] {
  if (!Array.isArray(value)) return [];
  const output: PlanningLine[] = [];
  const ids = new Set<string>();
  for (const raw of value.slice(0,100)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string,unknown>;
    if (typeof item.id !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(item.id) || ids.has(item.id)) continue;
    if (typeof item.name !== "string" || item.name.trim().length < 2) continue;
    if (typeof item.unit !== "string" || !isPlanningUnit(item.unit)) continue;
    if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1_000_000) continue;
    output.push({id:item.id,name:item.name.trim().slice(0,160),quantity:Math.round(item.quantity*1000)/1000,unit:item.unit});
    ids.add(item.id);
    if (output.length>=25) break;
  }
  return output;
}
export function appendPlanningLine(raw: unknown, candidate: PlanningLine): PlanningLine[] {
  const existing = safePlanningList(raw);
  if (existing.length >= 25) return existing;
  const next = safePlanningList([candidate]);
  return next.length ? [...existing, ...next.filter(i=>!existing.some(row=>row.id===i.id))] : existing;
}
