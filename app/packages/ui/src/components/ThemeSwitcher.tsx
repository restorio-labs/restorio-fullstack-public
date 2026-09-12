import { useEffect, useState, type ReactElement } from "react";

import { useI18n } from "../providers/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { cn } from "../utils";

import { Button } from "./primitives/Button";
import { Icon } from "./primitives/Icon";

export interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher = ({ className, showLabel = false }: ThemeSwitcherProps): ReactElement => {
  const { t } = useI18n();

  const { mode, resolvedMode, setMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeMode = mode === "system" ? resolvedMode : mode;
  const visibleMode = mounted ? activeMode : "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = (): void => {
    setMode(activeMode === "light" ? "dark" : "light");
  };

  const icons: Record<"light" | "dark", ReactElement> = {
    light: (
      <Icon size="md" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </Icon>
    ),
    dark: (
      <Icon size="md" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </Icon>
    ),
  };

  const labels: Record<"light" | "dark", string> = {
    light: String(t("themeSwitcher.light", "Light")),
    dark: String(t("themeSwitcher.dark", "Dark")),
  };

  const ariaLabel = String(
    t("themeSwitcher.ariaLabel", "Current theme: {{theme}}. Click to cycle theme.", {
      theme: labels[visibleMode],
    }),
  );

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={cycleTheme}
      className={cn("flex items-center gap-2", className)}
      aria-label={ariaLabel}
    >
      {icons[visibleMode]}
      {showLabel && <span className="text-sm font-medium">{labels[visibleMode]}</span>}
    </Button>
  );
};
