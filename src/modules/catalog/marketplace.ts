import { catalogCategories } from "@/modules/catalog/catalog";

export type DemoProduct = {
  slug: string;
  category: string;
  name: string;
  description: string;
  brand: string;
  specifications: { label: string; value: string }[];
  quoteOnly?: boolean;
  images?: string[];
  publishedListing?: boolean;
  priceOffers?: { amountPaise: number; city: string; unit: string; minimumQuantity: number; dealerName?: string }[];
  priceVariant?: string | null;
  /** Real variants attached to one catalog product. Populated only from dealer/admin SKU data. */
  variantOptions?: { slug: string; label: string; unit: string }[];
  /** Units that a buyer may request; a published price is shown only for its exact unit. */
  unitOptions?: string[];
};

// Brand names and examples help discovery only. There is no claim of dealer
// authorization, live inventory, certification, or a current selling price.
export const demoProducts: DemoProduct[] = [
  { slug: "fe-500d-tmt-12mm", category: "steel", name: "TMT bar Â· Fe 500D Â· 12 mm", description: "Illustrative product profile. Confirm the exact manufacturer range and test documents with the supplying dealer.", brand: "Tata Tiscon", specifications: [{ label: "Grade", value: "Fe 500D (verify SKU)" }, { label: "Diameter", value: "12 mm" }, { label: "Typical unit", value: "kg / quintal / tonne" }, { label: "Supply note", value: "Actual weight and bundle details must be confirmed" }] },
  { slug: "fe-500d-tmt-10mm", category: "steel", name: "TM¶»§q«^