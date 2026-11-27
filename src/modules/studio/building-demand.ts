export type DemandInputs={areaSqFt:number;people:number;deadKpa:number;liveKpa:number;powerWPerM2:number;waterLPerPersonDay:number;ventLpsPerPerson:number};
export function calculateConceptDemand(input:DemandInputs){
 if(Object.values(input).some(n=>!Number.isFinite(n)||n<0)||input.areaSqFt<=0||!Number.isInteger(input.people))return null;
 const areaM2=input.areaSqFt*.09290304;
 // Arithmetic only: no load combinations, demand diversity, HVAC heat load,
 // fixture sizing, pipe sizing or occupancy/fire limits are inferred.
 const result={areaM2,unfactoredDeadKn:areaM2*input.deadKpa,unfactoredLiveKn:areaM2*input.liveKpa,assumedElectricalKw:areaM2*input.powerWPerM2/1000,assumedWaterLPerDay:input.people*input.waterLPerPersonDay,assumedOutdoorAirLps:input.people*input.ventLpsPerPerson};
 return Object.values(result).every(n=>Number.isFinite(n)&&n<=Number.MAX_SAFE_INTEGER)?result:null;
}
