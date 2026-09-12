import type { Metadata } from "next";
import type { ReactElement } from "react";

import { loadMessages } from "../../../../src/i18n/request";

import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { TableOfContents } from "@/components/legal/TableOfContents";

interface NestedMessages {
  [key: string]: string | NestedMessages;
}

const getNestedValue = (obj: NestedMessages, path: string, values?: Record<string, string>): string => {
  const keys = path.split(".");
  let current: string | NestedMessages = obj;

  for (const key of keys) {
    if (typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }
  let result = typeof current === "string" ? current : path;

  if (values) {
    for (const [k, v] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }

  return result;
};

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const legal = messages.legal as NestedMessages;

  return {
    title: getNestedValue(legal, "termsAndConditions.title"),
    description: getNestedValue(legal, "termsAndConditions.description"),
  };
}

const TermsPage = async ({ params }: PageParams): Promise<ReactElement> => {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const legal = messages.legal as NestedMessages;
  const t = (key: string, values?: Record<string, string>): string => getNestedValue(legal, key, values);

  const lastUpdatedDate = "18 marca 2026";

  const termsSections = [
    "generalProvisions",
    "definitions",
    "registration",
    "subscriptionAndPayments",
    "userRights",
    "operatorRights",
    "dataProtection",
    "intellectualProperty",
    "termination",
    "liability",
    "complaints",
    "finalProvisions",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("termsAndConditions.title"),
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: t("termsAndConditions.description"),
    },
  };

  return (
    <LegalPageLayout>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t("termsAndConditions.title")}</h1>
          <p className="text-sm text-text-secondary">
            {t("termsAndConditions.lastUpdated", { date: lastUpdatedDate })}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <TableOfContents sections={termsSections} namespace="termsAndConditions" />

            {termsSections.map((sectionId) => (
              <LegalSection
                key={`termsAndConditions:${sectionId}`}
                id={sectionId}
                namespace={`termsAndConditions.sections.${sectionId}`}
              />
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 text-sm text-text-secondary">
              <p>
                <strong>{t("common.lastUpdated")}:</strong> {lastUpdatedDate}
              </p>
            </div>
          </aside>
        </div>
      </article>
    </LegalPageLayout>
  );
};

export default TermsPage;
