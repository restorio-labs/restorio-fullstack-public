import type { Metadata } from "next";
import type { ReactElement } from "react";

import type { MetadataParams } from "../../../[locale]/layout";

import { AboutContent } from "./AboutContent";

import { getPageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getPageMetadata(locale, "about");
}

export default function AboutPage(): ReactElement {
  return <AboutContent />;
}
