const FEET_PER_METRE = 3.280839895013123;
const SQUARE_FEET_PER_SQUARE_METRE = FEET_PER_METRE ** 2;
const SQUARE_FEET_PER_SQUARE_GAJ = 9;

export function squareFeetFromDimensions(length: number, width: number, unit: "ft" | "m"): number {
  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
    throw new RangeError("Dimensions must be positive finite numbers");
  }
  const feetLength = unit === "m" ? length * FEET_PER_METRE : length;
  const feetWidth = unit === "m" ? width * FEET_PER_METRE : width;
  return feetLength * feetWidth;
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
