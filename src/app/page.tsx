import { HomeShell } from "@/components/home-shell";
import { catalogCategories } from "@/modules/catalog/catalog";

export default function HomePage() {
  return <HomeShell categories={catalogCategories} />;
}
