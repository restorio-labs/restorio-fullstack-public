import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import { TransactionListContent } from "../features/transactions/components/TransactionListContent";
import { PageLayout } from "../layouts/PageLayout";

export const TransactionListPage = (): ReactElement => {
  const { t } = useI18n();

  return (
    <PageLayout title={t("transactions.title")} description={t("transactions.description")}>
      <TransactionListContent />
    </PageLayout>
  );
};
