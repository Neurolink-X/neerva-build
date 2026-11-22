export type PriceVisibility = "public" | "quote_only";

export type PublishedPrice = {
  visibility: PriceVisibility;
  amountPaise: number;
  currency: "INR";
  unit: string;
  updatedAt: string;
};

export type PublicPrice = {
  amountPaise: number;
  currency: "INR";
  unit: string;
  updatedAt: string;
} | null;

/** Allowlist serializer: quote-only rows never expose amount fields. */
export function toPublicPrice(price: PublishedPrice | null): PublicPrice {
  if (!price || price.visibility !== "public") return null;
  if (!Number.isSafeInteger(price.amountPaise) || price.amountPaise < 0) return null;
  return {
    amountPaise: price.amountPaise,
    currency: "INR",
    unit: price.unit,
    updatedAt: price.updatedAt,
  };
}

export function formatInrFromPaise(amountPaise: number): string {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0) throw new RangeError("Invalid amount in paise");
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amountPaise / 100);
}
