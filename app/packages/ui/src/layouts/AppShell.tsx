import type { ReactNode, ReactElement } from "react";

import { cn } from "../utils";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  className?: string;
  sidebarAriaLabel?: string;
}

export const AppShell = ({
  children,
  header,
  footer,
  sidebar,
  sidebarPosition = "left",
  className,
  sidebarAriaLabel = "Sidebar",
}: AppShellProps): ReactElement => {
  return (
    <div className={cn("flex h-svh min-h-0 flex-col bg-background-primary", className)}>
      {header && (
        <header className="flex-shrink-0 border-b border-border-default bg-surface-primary" role="banner">
          {header}
        </header>
      )}
      <div className="flex min-h-0 flex-1">
        {sidebar && sidebarPosition === "left" && (
          <aside
            className="flex min-h-0 flex-shrink-0 flex-col border-e border-border-default bg-surface-secondary"
            role="complementary"
            aria-label={sidebarAriaLabel}
          >
            {sidebar}
          </aside>
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col" role="main">
          {children}
        </main>
        {sidebar && sidebarPosition === "right" && (
          <aside
            className="flex min-h-0 flex-shrink-0 flex-col border-s border-border-default bg-surface-secondary"
            role="complementary"
            aria-label={sidebarAriaLabel}
          >
            {sidebar}
          </aside>
        )}
      </div>
      {footer && (
        <footer className="flex-shrink-0 border-t border-border-default bg-surface-primary" role="contentinfo">
          {footer}
        </footer>
      )}
    </div>
  );
};
