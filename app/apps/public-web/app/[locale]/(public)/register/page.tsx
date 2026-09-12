import type { Metadata } from "next";
import type { ReactElement } from "react";

import type { MetadataParams } from "../../../[locale]/layout";

import { RegisterContent } from "./RegisterContent";

import { getPageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "register");
}

export default function RegisterPage(): ReactElement {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-border-default bg-surface-primary p-8 sm:p-10 shadow-sm animate-slide-up">
        <RegisterContent />
      </div>
    </div>
  );
}
