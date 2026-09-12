import { ThemeSwitcher } from "@restorio/ui";
import type { ReactElement, ReactNode } from "react";

interface GuestBottomNavProps {
  ariaLabel: string;
  children: ReactNode;
}

export const GuestBottomNav = ({ ariaLabel, children }: GuestBottomNavProps): ReactElement => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-border-default bg-surface-primary/95 px-4 py-3 backdrop-blur-sm"
      aria-label={ariaLabel}
    >
      <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-2">
        {children}
        <ThemeSwitcher className="h-8 px-2" />
      </div>
    </nav>
  );
};
