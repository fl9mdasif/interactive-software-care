import { Analytics, GtmNoScript } from "@/components/analytics/Analytics";
import { Ambient } from "@/components/layout/Ambient";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/ui/JsonLd";
import { getServices, getSettings } from "@/lib/api";
import { organizationSchema } from "@/lib/schema";

/** Chrome for the public marketing site. The dashboard has none of this, and no tracking. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);

  return (
    <>
      <GtmNoScript gtmId={settings.gtmId} />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Ambient />
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} services={services} />
      <JsonLd data={organizationSchema(settings)} />
      <Analytics settings={settings} />
    </>
  );
}
