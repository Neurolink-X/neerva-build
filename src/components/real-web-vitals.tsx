"use client";
import {useReportWebVitals} from "next/web-vitals";
import {toVitalSample,type VitalSample} from "@/modules/performance/field-vitals";
// Actual browser measurements, not Lighthouse scores. Memory only: no cookies,
// visitor identifiers, raw URLs, queries, or extra requests. Missing metrics stay missing.
const samples=new Map<string,VitalSample>();
function record(metric:Parameters<Parameters<typeof useReportWebVitals>[0]>[0]){
 const sample=toVitalSample(metric.name,metric.value,window.innerWidth);
 if(!sample)return;
 samples.set(sample.name,sample);
 window.dispatchEvent(new CustomEvent("neerva:web-vitals",{detail:[...samples.values()]}));
}
export function RealWebVitals(){useReportWebVitals(record);return null}
