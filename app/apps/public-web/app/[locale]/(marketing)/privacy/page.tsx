import type { Metadata } from "next";
import type { ReactElement } from "react";

import { loadMessages } from "../../../../src/i18n/request";

import AnimatedReveal from "@/components/legal/AnimatedReveal";
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
    title: getNestedValue(legal, "privacyPolicy.title"),
    description: "Polityka Prywatności oraz Polityka Cookies platformy Restorio do zarządzania restauracją.",
  };
}

const PrivacyPage = async ({ params }: PageParams): Promise<ReactElement> => {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const legal = messages.legal as NestedMessages;
  const t = (key: string, values?: Record<string, string>): string => getNestedValue(legal, key, values);

  const lastUpdatedDate = "18 marca 2026";

  const privacySections = [
    "introduction",
    "dataCollection",
    "dataProcessingPurpose",
    "dataRetention",
    "userRights",
    "dataSharing",
    "dataSecurity",
  ];

  const cookieSections = ["whatAreCookies", "cookieTypes", "cookieManagement", "thirdPartyCookies"];

  return (
    <LegalPageLayout>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t("privacyPolicy.title")}</h1>
          <p className="text-sm text-text-secondary">
            {t("common.lastUpdated")}: {lastUpdatedDate}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <TableOfContents sections={privacySections} namespace="privacyPolicy" />

            {privacySections.map((sectionId) => (
              <LegalSection
                key={`privacyPolicy:${sectionId}`}
                id={sectionId}
                namespace={`privacyPolicy.sections.${sectionId}`}
              />
            ))}

            <section id="cookies" className="mt-12 scroll-mt-24">
              <AnimatedReveal className="mb-4" delayMs={0}>
                <h2 className="text-2xl font-semibold">{t("cookiePolicy.title")}</h2>
              </AnimatedReveal>

              <AnimatedReveal delayMs={120}>
                <TableOfContents sections={cookieSections} namespace="cookiePolicy" />
              </AnimatedReveal>

              {cookieSections.map((sectionId) => (
                <LegalSection
                  key={`cookiePolicy:${sectionId}`}
                  id={sectionId}
                  namespace={`cookiePolicy.sections.${sectionId}`}
                />
              ))}
            </section>
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

export default PrivacyPage;
