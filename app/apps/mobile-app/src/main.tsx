import { runThemeBootScript } from "@restorio/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import plMessages from "./locales/pl.json";
import { AppProviders } from "./wrappers/AppProviders";
import "@restorio/ui/styles";

runThemeBootScript();

const root = document.getElementById("root");

if (!root) {
  throw new Error(plMessages.errors.rootElementNotFound);
}

const reactRoot = createRoot(root);

reactRoot.render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
