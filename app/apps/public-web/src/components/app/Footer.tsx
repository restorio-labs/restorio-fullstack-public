"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useLocale, useTranslations } from "@/i18n/useT";

export const Footer = (): ReactElement => {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: `/${locale}/privacy`, label: t("navigation.privacy") },
    { href: "mailto:contact@restorio.org", label: t("navigation.contact") },
    { href: `/${locale}/terms`, label: t("navigation.terms") },
    { href: `/${locale}/status`, label: t("navigation.status") },
  ];

  const leftLinks = navLinks.slice(0, 2);
  const rightLinks = navLinks.slice(2);

  const linkClassName = "text-slate-500 opacity-80 transition-opacity hover:text-white hover:opacity-100 p-2";

  return (
    <footer className="w-full border-t border-slate-800/20 bg-[#0a0e14] px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
        <div className="text-lg font-bold text-slate-200 md:text-xl">{t("footer.brand")}</div>

        <div className="flex max-md:hidden flex-row flex-wrap justify-center gap-8 font-inter text-sm uppercase tracking-widest">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={linkClassName}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex w-full max-w-xs justify-center gap-8 md:hidden">
          <div className="flex flex-col gap-4 text-center font-inter text-xs uppercase tracking-widest">
            {leftLinks.map((link) => (
              <Link key={link.label} href={link.href} className={linkClassName}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-4 text-center font-inter text-xs uppercase tracking-widest">
            {rightLinks.map((link) => (
              <Link key={link.label} href={link.href} className={linkClassName}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full text-center font-inter text-xs uppercase tracking-widest text-slate-400 md:w-auto md:text-sm">
          © {currentYear} Restorio Ecosystem. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
