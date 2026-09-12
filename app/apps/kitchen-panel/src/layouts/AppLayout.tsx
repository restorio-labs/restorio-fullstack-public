import { BaseAppLayout, useI18n } from "@restorio/ui";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
}

export const AppLayout = ({ children, header, footer, sidebar }: AppLayoutProps): ReactNode => {
  const { t } = useI18n();

  return (
    <BaseAppLayout
      header={header}
      footer={footer}
      sidebar={sidebar}
      skipLabel={t("common.skipToContent")}
      wrapChildrenInMain
    >
      {children}
    </BaseAppLayout>
  );
};
