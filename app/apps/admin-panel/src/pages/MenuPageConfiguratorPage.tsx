import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const MenuPageConfiguratorPage = (): ReactElement => {
  const { t } = useI18n();

  return (
    <PageLayout title={`${t("menuConfigurator.title")} [WIP]`} description={t("menuConfigurator.description")}>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">{`${t("menuConfigurator.placeholderTitle")} [WIP]`}</h2>
          <p className="mt-2 text-sm text-text-tertiary">{`${t("menuConfigurator.placeholderDescription")} This screen is not implemented yet.`}</p>
        </div>
      </div>
    </PageLayout>
  );
};
