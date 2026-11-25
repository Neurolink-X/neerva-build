
import {masonryTakeoff,concreteTakeoff,steelTakeoff} from "./construction-math.ts";
export type HouseInputs={floorArea:number;wallLength:number;wallHeight:number;wallThickness:number;openings:number;concreteVolume:number;cementPerM3:number;sandPerM3:number;aggregatePerM3:number;barLengths:readonly {diameter:number;length:number}[];paintCoverage:number;paintCoats:number;waste:number};
export function houseTakeoff(x:HouseInputs){
 if(!Number.isFinite(x.floorArea)||x.floorArea<=0||x.floorArea>100000||!Number.isFinite(x.paintCoverage)||x.paintCoverage<=0||!Number.isInteger(x.paintCoats)||x.paintCoats<1||x.paintCoats>5||!Number.isFinite(x.waste)||x.waste<0||x.waste>30||x.barLengths.length>12)return null;
 const wall=masonryTakeoff(x.wallLength,x.wallHeight,x.wallThickness,x.openings,[190,90,90],10,x.waste),concrete=concreteTakeoff(x.concreteVolume,x.cementPerM3,x.sandPerM3,x.aggregatePerM3,x.waste);
 if(!wall||!concrete)return null;
 const bars=x.barLengths.map(b=>b.length===0&&Number.isFinite(b.diameter)&&b.diameter>=6&&b.diameter<=50?0:steelTakeoff(b.diameter,b.length,x.waste)?.kg);
 if(bars.some(b=>b===undefined))return null;
 const steelKg=bars.reduce<number>((a,b)=>a+(b??0),0);
 return {bricks:wall.units,cementBags:concrete.bags,sandTonnes:concrete.sandTonnes,aggregateTonnes:concrete.aggregateTonnes,steelKg,tilesSqFt:x.floorArea*(1+x.waste/100),paintLitres:wall.netArea*2*x.paintCoats/x.paintCoverage*(1+x.waste/100)};
}
