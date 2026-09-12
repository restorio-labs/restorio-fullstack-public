import { PageLayout as UIPageLayout, useBreakpoint, type PageLayoutProps } from "@restorio/ui";
import type { ReactNode } from "react";

export const PageLayout = ({ children, description, ...props }: PageLayoutProps): ReactNode => {
  const isTabletUp = useBreakpoint("md");

  return (
    <UIPageLayout {...props} description={isTabletUp ? description : undefined}>
      {children}
    </UIPageLayout>
  );
};
