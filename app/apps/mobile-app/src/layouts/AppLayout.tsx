import { BaseAppLayout, useI18n } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export const AppLayout = ({ children, header, footer }: AppLayoutProps): ReactNode => {
  const { t } = useI18n();

  return (
    <BaseAppLayout header={header} footer={footer} skipLabel={t("common.skipToContent")} wrapChildrenInMain>
      {children}
    </BaseAppLayout>
  );
};
