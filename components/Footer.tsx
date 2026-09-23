"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { navLinks, APP_NAME, APP_TAGLINE } from "@/lib/data";
import { Activity, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const footerT = t.raw("footer") as Record<string, string>;

  function getLinkHref(href: string): string {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  }

  function handleLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (href.startsWith("#") && pathname === "/") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
              >
                <Activity className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </div>
              <span
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {APP_TAGLINE}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              {footerT["navigation"] ?? "Navigation"}
            </h3>
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={getLinkHref(link.href)}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-sm transition-colors duration-200 hover:text-[var(--primary)]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {navT[link.key] ?? link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              {footerT["info"] ?? "Info"}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {footerT["privacy"] ?? "Your data stays on your device"}
                </span>
              </li>
              <li>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {footerT["storage"] ?? "Powered by localStorage"}
                </span>
              </li>
              <li>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {footerT["currency"] ?? "Currency: USD ($)"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {footerT["copyright"] ?? `© ${APP_NAME}. All rights reserved.`}
          </p>
          <motion.p
            className="text-xs flex items-center gap-1"
            style={{ color: "var(--muted-foreground)" }}
            whileHover={{ scale: 1.02 }}
          >
            {footerT["made-with"] ?? "Made with"}
            <Heart className="w-3 h-3 inline" style={{ color: "var(--accent)" }} aria-hidden="true" />
            {footerT["for-finance"] ?? "for smarter finances"}
          </motion.p>
        </div>
      </div>
    </footer>
  );
}