import type { Metadata } from "next";
import { HomeStudio } from "@/components/home-studio";
import { conceptRules, type Rules } from "@/modules/studio/layout";
import "./studio.css";
import { palette, type Shade } from "@/modules/studio/room";
export const metadata: Metadata = {
  title: "Home Design Studio for Kanpur Plots",
  description:
    "Explore dimensioned home layouts, parking options and material estimates for your Kanpur plot.",
  alternates: { canonical: "/design-studio" },
};
export default async function DesignStudioPage() {
  let shades = palette;
  let rules = conceptRules,
    configured = false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const shadeTask = fetch(
      new URL(
        "/rest/v1/paint_shades?select=id,name,brand,tier,hex,finish,effect&order=name&limit=250",
        url,
      ),
      {
        headers: { apikey: key },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2500),
      },
    )
      .then(async (r) => {
        if (r.ok) {
          const rows = (await r.json()) as Shade[];
          return [
            ...new Map([...palette, ...rows].map((s) => [s.id, s])).values(),
          ];
        }
        return palette;
      })
      .catch(() => palette);
    try {
      const res = await fetch(
        new URL(
          "/rest/v1/studio_rules?city=eq.Kanpur&select=front,rear,side,bags,steel",
          url,
        ),
     ¶»§q«^