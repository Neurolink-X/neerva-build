import {SQUARE_METRES_PER_SQUARE_FOOT} from "../calculator/units.ts";
import {validRange as valid,withAllowance,areaCost} from "../calculator/quantity-math.ts";

/** Preliminary takeoff only. Structural sizes, mixes and bar schedules must be supplied by the project engineer. */
export function masonryTakeoff(lengthFt:number,heightFt:number,thicknessMm:number,openingsSqFt:number,unitMm:readonly [number,number,number],jointMm:number,wastePercent:number){
 if(!valid(lengthFt,.1,10000)||!valid(heightFt,.1,100)||!valid(thicknessMm,50,1000)||!valid(openingsSqFt,0,lengthFt*heightFt)||!unitMm.every(n=>valid(n,40,1000))||!valid(jointMm,0,30)||!valid(wastePercent,0,30))return null;
 const netArea=(lengthFt*heightFt-openingsSqFt)*SQUARE_METRES_PER_SQUARE_FOOT, volume=netArea*thicknessMm/1000;
 // Modular brick count assumes a continuous bond; non-modular wall thicknesses may need a measured bond takeoff.
 const moduleVolume=unitMm.reduce((p,n)=>p*(n+jointMm)/1000,1);
 const units=volume/moduleVolume;
 return {netArea,volume,units:Math.ceil(withAllowance(units,wastePercent)),netUnits:units};
}
export function concreteTakeoff(volumeM3:number,cementKgM3:number,sandKgM3:number,aggregateKgM3:number,waste:number,bagKg=50){
 if(!valid(bagKg,1,100)||!valid(volumeM3,.01,10000)||!valid(cementKgM3,1,1000)||!valid(sandKgM3,1,3000)||!valid(aggregateKgM3,1,3000)||!valid(waste,0,30))return null;
 const volume=withAllowance(volumeM3,waste);
 return {volume,cementKg:volume*cementKgM3,bags:Math.ceil(volume*cementKgM3/bagKg),bagKg,sandTonnes:volume*sandKgM3/1000,aggregateTonnes:volume*aggregateKgM3/1000};
}
export function steelTakeoff(diameterMm:number,totalLengthM:number,waste:number){
 if(!valid(diameterMm,6,50)||!valid(totalLengthM,.01,1000000)||!valid(waste,0,30))return null;
 const kgPerM=Math.PI*(diameterMm/1000)**2/4*7850;
 const kg=withAllowance(kgPerM*totalLengthM,waste);
 return {kgPerM,kg,tonnes:kg/1000};
}
export function areaBudget(areaSqFt:number,ratePerSqFt:number,allowance:number){
 if(!valid(areaSqFt,1,100000)||!valid(ratePerSqFt,1,100000)||!valid(allowance,0,50))return null;
 return areaCost(areaSqFt,ratePerSqFt,allowance);
}

export function steelScheduleTakeoff(rows:readonly {diameterMm:number;lengthM:number}[],waste:number){
 if(!rows.length||rows.length>50)return null;
 const details=rows.map(r=>steelTakeoff(r.diameterMm,r.lengthM,waste));
 if(details.some(r=>r===null))return null;
 const kg=details.reduce((sum,r)=>sum+(r?.kg??0),0);
 return {kg,tonnes:kg/1000,totalLengthM:rows.reduce((sum,r)=>sum+r.lengthM,0),firstKgPerM:details[0]!.kgPerM};
}
