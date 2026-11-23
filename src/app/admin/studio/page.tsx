import { StudioAdmin } from "@/components/studio-admin";
import { SiteHeader } from "@/components/site-chrome";
export const metadata = {
  title: "Studio configuration",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="catalog-page">
      <SiteHeader />
      <section className="section ops-content">
        <StudioAdmin />
      </section>
    </main>
  );
}
