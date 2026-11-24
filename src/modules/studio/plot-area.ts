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
