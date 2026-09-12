import { createTranslator, runThemeBootScript } from "@restorio/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { defaultMessages } from "./i18n/messages";
import { AppProviders } from "./wrappers/AppProviders";
import "./index.css";

runThemeBootScript();

const root = document.getElementById("root");

if (!root) {
  const t = createTranslator(defaultMessages);

  throw new Error(t("errors.rootElementNotFound"));
}

const reactRoot = createRoot(root);

reactRoot.render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
