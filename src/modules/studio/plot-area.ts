/** In northern Indian property listings, a plot "gaj" means one square yard = 9 sq ft.
 * Area alone is never a floor plan: the customer must also specify road-front width. */
export function depthFromGaj(areaGaj:number,frontageFt:number):number|null{
 if(!Number.isFinite(areaGaj)||!Number.isFinite(frontageFt)||areaGaj<=0||
   frontageFt<10||frontageFt>200)return null;
 const depth=Math.round(areaGaj*9/frontageFt*100)/100;
 return depth>=15&&depth<=250?depth:null;
}
export function gajFromFeet(widthFt:number,depthFt:number):number|null{
 if(!Number.isFinite(widthFt)||!Number.isFinite(depthFt)||widthFt<=0||depthFt<=0)return null;
 return Math.round(widthFt*depthFt/9*100)/100;
}

export type PlotAreaUnit="gaj"|"sqft"|"sqm";
export function areaToSquareFeet(value:number,unit:PlotAreaUnit):number|null{
 if(!Number.isFinite(value)||value<=0)return null;
 const result=value*(unit==="gaj"?9:unit==="sqm"?1/(.3048*.3048):1);
 return Number.isFinite(result)?result:null;
}
export function solvePlotDimension(area:number,unit:PlotAreaUnit,known:number,solve:"width"|"depth"):number|null{
 const sqft=areaToSquareFeet(area,unit);
 const knownMin=solve==="depth"?10:15,knownMax=solve==="depth"?200:250;
 if(sqft===null||!Number.isFinite(known)||known<knownMin||known>knownMax)return null;
 const result=Math.round(sqft/known*100)/100;
 return result>=(solve==="depth"?15:10)&&result<=(solve==="depth"?250:200)?result:null;
}
export function measuredPlotSummary(width:number,depth:number,excluded=0){
 if(![width,depth,excluded].every(Number.isFinite)||width<10||width>200||depth<15||depth>250||excluded<0||excluded>=width*depth)return null;
 const sqft=width*depth-excluded;
 return {sqft,gaj:sqft/9,sqm:sqft*.3048*.3048,perimeterFt:2*(width+depth),excluded};
}
