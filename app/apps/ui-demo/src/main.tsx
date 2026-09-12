import { runThemeBootScript } from "@restorio/ui";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

runThemeBootScript();

const Root = (): React.ReactElement => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  );
};

const root = document.getElementById("root");

if (root) {
  const reactRoot = createRoot(root);

  reactRoot.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}
