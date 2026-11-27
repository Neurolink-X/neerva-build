const FEET_PER_METRE = 3.280839895013123;
const SQUARE_FEET_PER_SQUARE_METRE = FEET_PER_METRE ** 2;
const SQUARE_FEET_PER_SQUARE_GAJ = 9;

export function squareFeetFromDimensions(length: number, width: number, unit: "ft" | "m"): number {
  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
    throw new RangeError("Dimensions must be positive finite numbers");
  }
  const feetLength = unit === "m" ? length * FEET_PER_METRE : length;
  const feetWidth = unit === "m" ? width * FEET_PER_METRE : width;
  const area=feetLength*feetWidth;
  if(!Number.isFinite(area)||area<=0)throw new RangeError("Area must be positive and finite");
  return area;
}

export function convertSquareFeet(areaSqFt: number): { squareFeet: number; squareMetres: number; squareGaj: number } {
  if (!Number.isFinite(areaSqFt) || areaSqFt < 0) throw new RangeError("Area must be a non-negative finite number");
  return {
    squareFeet: areaSqFt,
    squareMetres: areaSqFt / SQUARE_FEET_PER_SQUARE_METRE,
    squareGaj: areaSqFt / SQUARE_FEET_PER_SQUARE_GAJ,
  };
}

export function linearFeetFromMillimetres(mm: number): number {
  if (!Number.isFinite(mm) || mm < 0) throw new RangeError("Length must be a non-negative finite number");
  return mm / 304.8;
}

/** Unit switching preserves physical dimensions; input values stay in the chosen unit. */
export function convertLength(value:number,from:"ft"|"m",to:"ft"|"m"):number{
 if(!Number.isFinite(value)||value<0)throw new RangeError("Length must be non-negative and finite");
 const result=from===to?value:from==="ft"?value/FEET_PER_METRE:value*FEET_PER_METRE;
 if(!Number.isFinite(result))throw new RangeError("Length overflow");
 return result;
}
