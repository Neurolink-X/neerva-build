export type CatalogCategory = {
  slug: string;
  title: string;
  titleHi: string;
  description: string;
  quoteOnly: boolean;
  icon: "steel" | "cement" | "brick" | "pipe" | "electric" | "aggregate" | "paint" | "tile" | "hardware";
};

export const catalogCategories: CatalogCategory[] = [
  { slug: "steel", title: "Steel & TMT", titleHi: "सरिया और TMT", description: "Grades, diameters and dealer-listed variants", quoteOnly: false, icon: "steel" },
  { slug: "cement", title: "Cement", titleHi: "सीमेंट", description: "Compare product type, grade and bag details", quoteOnly: false, icon: "cement" },
  { slug: "bricks-blocks", title: "Bricks & blocks", titleHi: "ईंट और ब्लॉक", description: "Clay, fly ash, AAC and concrete formats", quoteOnly: false, icon: "brick" },
  { slug: "plumbing", title: "Pipes & plumbing", titleHi: "पाइप और प्लंबिंग", description: "Pipe material, size, pressure class and fittings", quoteOnly: false, icon: "pipe" },
  { slug: "electrical", title: "Electrical & hardware", titleHi: "इलेक्ट्रिकल और हार्डवेयर", description: "Conduits, wires, fittings and site essentials", quoteOnly: false, icon: "electric" },
  { slug: "aggregates", title: "Morang, balu & gitti", titleHi: "मौरंग, बालू और गिट्टी", description: "Coarse sand, fine sand, M-sand and size-graded stone aggregate for bulk delivery quotations", quoteOnly: true, icon: "aggregate" },
  { slug: "paint", title: "Paint & waterproofing", titleHi: "पेंट व वॉटरप्रूफिंग", description: "Primer, emulsion, putty, waterproofing and finish systems", quoteOnly: false, icon: "paint" },
  { slug: "tiles", title: "Tiles & flooring", titleHi: "टाइल्स व फ्लोरिंग", description: "Material, finish, slip grade, size and box coverage", quoteOnly: false, icon: "tile" },
  { slug: "hardware", title: "Adhesives & hardware", titleHi: "एडहेसिव व हार्डवेयर", description: "Tile adhesives, fittings, door hinges and fixings", quoteOnly: false, icon: "hardware" },
];

export function searchCategories(query: string, source: CatalogCategory[] = catalogCategories): CatalogCategory[] {
  const normalized = query.trim().toLocaleLowerCase("en-IN");
  if (!normalized) return source;
  return source.filter((category) =>
    `${category.title} ${category.titleHi} ${category.description} ${category.slug}`.toLocaleLowerCase("en-IN").includes(normalized),
  );
}
