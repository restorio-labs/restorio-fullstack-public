"use client";

import type { AppSlug } from "@restorio/types";
import { ChooseApp } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

export const AuthenticatedAppPicker = (): ReactElement => {
  const t = useTranslations();

  const handleSelect = (slug: AppSlug): void => {
    goToApp(slug);
  };

  return <ChooseApp onSelectApp={handleSelect} title={t("chooseApp.title")} subtitle={t("chooseApp.subtitle")} />;
};
