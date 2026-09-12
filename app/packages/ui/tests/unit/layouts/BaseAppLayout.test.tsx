import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaseAppLayout } from "../../../src/layouts/BaseAppLayout";

describe("BaseAppLayout", () => {
  it("renders skip link and wraps content in main when enabled", () => {
    render(
      <BaseAppLayout
        header={<div>Header</div>}
        footer={<div>Footer</div>}
        sidebar={<div>Sidebar</div>}
        skipLabel="Skip to content"
        mainId="content-id"
        wrapChildrenInMain
      >
        <div>Body</div>
      </BaseAppLayout>,
    );

    expect(screen.getByRole("link", { name: "Skip to content" }).getAttribute("href")).toBe("#content-id");
    const main = document.getElementById("content-id");
    expect(main).not.toBeNull();
    expect(main?.textContent).toContain("Body");
    expect(screen.getByText("Header")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
    expect(screen.getByText("Sidebar")).toBeDefined();
  });

  it("renders children without main wrapper by default", () => {
    render(
      <BaseAppLayout>
        <div data-testid="plain-body">Body</div>
      </BaseAppLayout>,
    );

    expect(screen.getByTestId("plain-body")).toBeDefined();
    expect(document.getElementById("main-content")).toBeNull();
  });
});
