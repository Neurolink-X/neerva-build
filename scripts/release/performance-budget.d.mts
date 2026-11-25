export const perfTargets: Record<string,number>;
export const perfCeilings: Record<string,number>;
export function assessPerformance(sample:Record<string,unknown>):{warnings:string[];failures:string[]};
