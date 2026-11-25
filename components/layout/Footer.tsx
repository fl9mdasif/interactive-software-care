import Link from "next/link";
import type { TService, TSettings } from "@/types";
import { SITE } from "@/lib/site";
import { contactLinks } from "@/lib/contact";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";

const COMPANY = [
  { href: "/about", label: "About us" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Our work" },
  { href: "/products", label: "Products" },
  { href: "/#process", label: "Process" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book a meeting" },
];

export function Footer({ settings, services }: { settings: TSettings; services: TService[] }) {
  const c = contactLinks(settings);
  const year = new Date().getFullYear();
  const facebook = c.socials.filter((s) => s.platform.toLowerCase() === "facebook");

  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-about">
            <Link href="/" className="brand">
              <Logo />
              {SITE.name}
            </Link>
            <p>
              A software team building custom websites, e-commerce platforms, mobile apps, SaaS products and AI chatbots
              for businesses worldwide.
            </p>

            <address className="foot-contact">
              {c.email && (
                <a href={c.email.href} className="foot-contact-row">
                  <Icon name="mail" />
                  {c.email.label}
                </a>
              )}
              {c.phone && (
                <a href={c.phone.href} className="foot-contact-row">
                  <Icon name="phone" />
                  {c.phone.label}
                </a>
              )}
              {c.address && (
                <p className="foot-contact-row">
                  <Icon name="pin" />
                  {c.address}
                </p>
              )}
            </address>

            <div className="foot-actions">
              <Link href="/contact" className="btn btn-ghost btn-sm">
                Contact us
              </Link>
              {c.whatsapp && (
                <a
                  href={c.whatsapp.href}
                  className="foot-social"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with us on WhatsApp"
                  title="WhatsApp"
                >
                  <Icon name="whatsapp" />
                </a>
              )}
              {facebook.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  className="foot-social"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <Icon name={s.icon} />
                </a>
              ))}
            </div>
          </div>

          <nav className="foot-col" aria-labelledby="foot-services">
            <h2 id="foot-services">Services</h2>
            <ul>
              {services.slice(0, 8).map((s) => (
                <li key={s._id}>
                  <Link href={`/services/${s.slug}`}>{s.title}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="foot-col" aria-labelledby="foot-company">
            <h2 id="foot-company">Company</h2>
            <ul>
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="foot-bot">
          <span>
            © {year} {SITE.name}. All rights reserved.
          </span>
          <nav className="foot-legal" aria-label="Legal">
            <Link href="/terms">Terms &amp; Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
