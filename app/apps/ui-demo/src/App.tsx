import { Button, Stack, Text, ThemeProvider, ToastProvider, useTheme } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import type { ReactElement } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";

import {
  BoxPage,
  ButtonPage,
  CardPage,
  CheckboxPage,
  DropdownPage,
  EmptyStatePage,
  IconPage,
  InputPage,
  LoaderPage,
  ModalPage,
  OverviewPage,
  SelectPage,
  SkeletonPage,
  StackPage,
  SwitchPage,
  TextPage,
  ToastPage,
  TooltipPage,
} from "./pages";

interface NavItem {
  path: string;
  label: string;
  element: ReactElement;
}

const navItems: NavItem[] = [
  { path: "/overview", label: "Overview", element: <OverviewPage /> },
  { path: "/box", label: "Box", element: <BoxPage /> },
  { path: "/stack", label: "Stack", element: <StackPage /> },
  { path: "/text", label: "Text", element: <TextPage /> },
  { path: "/buttons", label: "Button", element: <ButtonPage /> },
  { path: "/icons", label: "Icon", element: <IconPage /> },
  { path: "/card", label: "Card", element: <CardPage /> },
  { path: "/inputs", label: "Input", element: <InputPage /> },
  { path: "/select", label: "Select", element: <SelectPage /> },
  { path: "/checkbox", label: "Checkbox", element: <CheckboxPage /> },
  { path: "/switch", label: "Switch", element: <SwitchPage /> },
  { path: "/empty-state", label: "EmptyState", element: <EmptyStatePage /> },
  { path: "/loader", label: "Loader", element: <LoaderPage /> },
  { path: "/skeleton", label: "Skeleton", element: <SkeletonPage /> },
  { path: "/dropdown", label: "Dropdown", element: <DropdownPage /> },
  { path: "/tooltip", label: "Tooltip", element: <TooltipPage /> },
  { path: "/modal", label: "Modal", element: <ModalPage /> },
  { path: "/toast", label: "Toast", element: <ToastPage /> },
];

const ThemeToggle = (): ReactElement => {
  const { resolvedMode, mode, setMode } = useTheme();
  const nextMode = resolvedMode === "light" ? "dark" : "light";
  const activeLabel = mode === "system" ? `System (${resolvedMode})` : resolvedMode;

  return (
    <Button variant="secondary" size="sm" onClick={(): void => setMode(nextMode)}>
      Theme: {activeLabel} → {nextMode}
    </Button>
  );
};

const App = (): ReactElement => {
  return (
    <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
      <ToastProvider>
        <div className="min-h-screen bg-background-primary text-text-primary">
          <header className="border-b border-border-default bg-surface-primary">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
              <Text variant="h3" weight="semibold">
                UI Demo
              </Text>
              <ThemeToggle />
            </div>
          </header>
          <div className="mx-auto max-w-6xl px-6 py-6 flex gap-6">
            <nav className="w-56 flex-shrink-0">
              <Stack spacing="xs">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }): string =>
                      [
                        "block px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-surface-secondary text-text-primary"
                          : "text-text-secondary hover:bg-surface-secondary",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </Stack>
            </nav>
            <main className="flex-1">
              <Routes>
                {navItems.map((item) => (
                  <Route key={item.path} path={item.path} element={item.element} />
                ))}
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
