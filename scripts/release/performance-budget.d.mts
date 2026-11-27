export const perfTargets: Record<string,number>;
export const perfCeilings: Record<string,number>;
export function assessPerformance(sample:Record<string,unknown>):{warnings:string[];failures:string[]};
export function resourceSummary():{documentBytes:number;resourceBytes:number;resourceCount:number;jsTransferBytes:number;jsDecodedBytes:number;jsRequests:number;imageTransferBytes:number;imageRequests:number};
