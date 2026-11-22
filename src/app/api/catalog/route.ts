import { NextResponse } from "next/server";
import { catalogCategories } from "@/modules/catalog/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    categories: catalogCategories.map(({ slug, title, titleHi, description, quoteOnly }) => ({
      slug,
      title,
      titleHi,
      description,
      pricingMode: quoteOnly ? "quotation" : "published-price-required",
    })),
    note: "No live inventory or prices are configured in this foundation build.",
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
