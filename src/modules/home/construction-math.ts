
/** Preliminary takeoff only. Structural sizes, mixes and bar schedules must be supplied by the project engineer. */
const valid=(n:number,min:number,max:number)=>Number.isFinite(n)&&n>=min&&n<=max;
export function masonryTakeoff(lengthFt:number,heightFt:number,thicknessMm:number,openingsSqFt:number,unitMm:readonly [number,number,number],jointMm:number,wastePercent:number){
 if(!valid(lengthFt,.1,10000)||!valid(heightFt,.1,100)||!valid(thicknessMm,50,1000)||!valid(openingsSqFt,0,lengthFt*heightFt)||!unitMm.every(n=>valid(n,40,1000))||!valid(jointMm,0,30)||!valid(wastePercent,0,30))return null;
 const netArea=(lengthFt*heightFt-openingsSqFt)*.09290304, volume=netArea*thicknessMm/1000;
 // Modular brick count assumes a continuous bond; non-modular wall thicknesses may need a measured bond takeoff.
 const moduleVolume=unitMm.reduce((p,n)=>p*(n+jointMm)/1000,1);
 const units=volume/moduleVolume;
 return {netArea,volume,units:Math.ceil(units*(1+wastePercent/100)),netUnits:units};
}
export function concreteTakeoff(volumeM3:number,cementKgM3:number,sandKgM3:number,aggregateKgM3:number,waste:number){
 if(!valid(volumeM3,.01,10000)||!valid(cementKgM3,1,1000)||!valid(sandKgM3,1,3000)||!valid(aggregateKgM3,1,3000)||!valid(waste,0,30))return null;
 const volume=volumeM3*(1+waste/100);
 return {volume,bags:Math.ceil(volume*cementKgM3/50),sandTonnes:volume*sandKgM3/1000,aggregateTonnes:volume*aggregateKgM3/1000};
}
export function steelTakeoff(diameterMm:number,totalLengthM:number,waste:number){
 if(!valid(diameterMm,6,50)||!valid(totalLengthM,.01,1000000)||!valid(waste,0,30))return null;
 const kgPerM=Math.PI*(diameterMm/1000)**2/4*7850;
 return {kgPerM,kg:kgPerM*totalLengthM*(1+waste/100),tonnes:kgPerM*totalLengthM*(1+waste/100)/1000};
}
export function areaBudget(areaSqFt:number,ratePerSqFt:number,allowance:number){
 if(!valid(areaSqFt,1,100000)||!valid(ratePerSqFt,1,100000)||!valid(allowance,0,50))return null;
 const subtotal=areaSqFt*ratePerSqFt;return {subtotal,total:subtotal*(1+allowance/100)};
}
