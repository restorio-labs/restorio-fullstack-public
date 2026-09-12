"use client";

import { Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface TableOfContentsProps {
  sections: string[];
  namespace: string;
}

export const TableOfContents = ({ sections, namespace }: TableOfContentsProps): ReactElement => {
  const t = useTranslations("legal");

  return (
    <nav aria-label={t("common.tableOfContents")} className="z-10 mb-10 rounded-lg bg-surface-primary/80 p-4 shadow-sm">
      <Text variant="body-sm" weight="medium" className="mb-2 text-text-secondary uppercase tracking-wide">
        {t("common.tableOfContents")}
      </Text>
      <Stack as="ul" spacing="xs" className="list-none space-y-1">
        {sections.map((sectionId) => (
          <li key={sectionId}>
            <a href={`#${sectionId}`} className="text-sm text-text-secondary hover:text-text-primary hover:underline">
              {t(`${namespace}.sections.${sectionId}.title`)}
            </a>
          </li>
        ))}
      </Stack>
    </nav>
  );
};
