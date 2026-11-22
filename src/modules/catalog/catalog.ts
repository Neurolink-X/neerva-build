export type CatalogCategory = {
  slug: string;
  title: string;
  titleHi: string;
  description: string;
  quoteOnly: boolean;
  icon: "steel" | "cement" | "brick" | "pipe" | "electric" | "aggregate";
};

export const catalogCategories: CatalogCategory[] = [
  { slug: "steel", title: "Steel & TMT", titleHi: "सरिया और TMT", description: "Grades, diameters and dealer-listed variants", quoteOnly: false, icon: "steel" },
  { slug: "cement", title: "Cement", titleHi: "सीमेंट", description: "Compare product type, grade and bag details", quoteOnly: false, icon: "cement" },
  { slug: "bricks-blocks", title: "Bricks & blocks", titleHi: "ईंट और ब्लॉक", description: "Clay, fly ash, AAC and concrete formats", quoteOnly: false, icon: "brick" },
  { slug: "plumbing", title: "Pipes & plumbing", titleHi: "पाइप और प्लंबिंग", description: "Pipe material, size, pressure class and fittings", quoteOnly: false, icon: "pipe" },
  { slug: "electrical", title: "Electrical & hardware", titleHi: "इलेक्ट्रिकल और हार्डवेयर", description: "Conduits, wires, fittings and site essentials", quoteOnly: false, icon: "electric" },
  { slug: "aggregates", title: "Balu, morang & aggregates", titleHi: "बालू, मौरंग और एग्रीगेट", description: "Share your site and quantity for a private quote", quoteOnly: true, icon: "aggregate" },
];

export function searchCategories(query: string, source: CatalogCategory[] = catalogCategories): CatalogCategory[] {
  const normalized = query.trim().toLocaleLowerCase("en-IN");
  if (!normalized) return source;
  return source.filter((category) =>
    `${category.title} ${category.titleHi} ${category.description} ${category.slug}`.toLocaleLowerCase("en-IN").includes(normalized),
  );
}
