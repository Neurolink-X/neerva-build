import type { Metadata } from "next";
import { HomeStudio } from "@/components/home-studio";

export const metadata: Metadata = { title: "Interactive Home Design Studio", description: "Compare different conceptual floor plan layouts for the same Indian plot size. Arrange room blocks, switch floors and save a local draft.", robots: { index: false, follow: false }, alternates: { canonical: "/design-studio" } };
export default function DesignStudioPage() { return <main className="design-studio-page"><HomeStudio /></main>; }
