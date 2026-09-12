import type { ReactElement, ReactNode } from "react";

import { AppShell } from "./AppShell";

export interface BaseAppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  skipLabel?: string;
  mainId?: string;
  wrapChildrenInMain?: boolean;
}

export const BaseAppLayout = ({
  children,
  header,
  footer,
  sidebar,
  skipLabel,
  mainId = "main-content",
  wrapChildrenInMain = false,
}: BaseAppLayoutProps): ReactElement => {
  const content = wrapChildrenInMain ? <main id={mainId}>{children}</main> : children;

  return (
    <>
      {skipLabel ? (
        <a
          href={`#${mainId}`}
          className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
        >
          {skipLabel}
        </a>
      ) : null}
      <AppShell header={header} footer={footer} sidebar={sidebar}>
        {content}
      </AppShell>
    </>
  );
};
