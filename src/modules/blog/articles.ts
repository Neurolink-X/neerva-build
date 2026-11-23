export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; title: string; text: string };

export type BlogSection = { id: string; heading: string; blocks: BlogBlock[] };

export type BlogArticle = {
  slug: string;
  category: string;
  readMinutes: number;
  publishedAt: string;
  updatedAt: string;
  title: string;
  titleHi: string;
  excerpt: string;
  excerptHi: string;
  sections: BlogSection[];
  sectionsHi: BlogSection[];
  sources: Array<{ label: string; href: string }>;
};

export const articles: BlogArticle[] = [
  {
    slug: "how-to-compare-construction-material-quotes",
    category: "Buying guide",
    readMinutes: 6,
    publishedAt: "2026-11-22",
    updatedAt: "2026-11-22",
    title: "How to compare a construction material quote before you accept",
    titleHi: "निर्माण सामग्री का कोटेशन स्वीकार करने से पहले कैसे जाँचें",
    excerpt: "Compare specifications, quantity, delivery and the complete payable amount—not just the first number on a quote.",
    excerptHi: "सिर्फ शुरुआती कीमत नहीं—स्पेसिफिकेशन, मात्रा, डिलीवरी और कुल देय राशि की तुलना करें।",
    sections: [
      {
        id: "match-the-material",
        heading: "1. Match the material and specif���q�^