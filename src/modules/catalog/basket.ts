export const BASKET_STORAGE_KEY = "neerva.material-list.v1";

export type BasketLine = {
  key: string;
  category: string;
  productSlug: string;
  productName: string;
  brand: string;
  option: string;
  unit: string;
  quantity: number;
};

export function safeBasket(value: unknown): BasketLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 25).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const line = raw as Partial<BasketLine>;
    if (
      typeof line.key !== "string" || line.key.length > 180 ||
      typeof line.category !== "string" || line.category.length > 40 ||
      typeof line.productSlug !== "string" || line.productSlug.length > 100 ||
      typeof line.productName !== "string" || line.productName.length > 160 ||
      typeof line.brand !== "string" || line.brand.length > 100 ||
      typeof line.option !== "string" || line.option.length > 80 ||
      typeof line.unit !== "string" || line.unit.length > 32 ||
      typeof line.quantity !== "number" || !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 1_000_000
    ) return [];
    return [{
      key: line.key, category: line.category, productSlug: line.productSlug,
      productName: line.productName, brand: line.brand, option: line.option,
      unit: line.unit, quantity: line.quantity,
    }];
  });
}
