/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { AppShell } from "../../../src/layouts/AppShell";

describe("AppShell", () => {
  it("should render children", () => {
    render(<AppShell>Main content</AppShell>);
    expect(screen.getByText("Main content")).toBeDefined();
  });

  it("should render header when provided", () => {
    render(<AppShell header={<div>Header</div>}>Content</AppShell>);
    expect(screen.getByText("Header")).toBeDefined();
  });

  it("should render footer when provided", () => {
    render(<AppShell footer={<div>Footer</div>}>Content</AppShell>);
    expect(screen.getByText("Footer")).toBeDefined();
  });

  it("should render sidebar when provided", () => {
    render(<AppShell sidebar={<div>Sidebar</div>}>Content</AppShell>);
    expect(screen.getByText("Sidebar")).toBeDefined();
  });

  it("should render sidebar on left by default", () => {
    render(<AppShell sidebar={<div>Sidebar</div>}>Content</AppShell>);
    const sidebar = screen.getByText("Sidebar").parentElement;

    expect(sidebar?.className).toContain("border-e");
  });

  it("should render sidebar on right when specified", () => {
    render(
      <AppShell sidebar={<div>Sidebar</div>} sidebarPosition="right">
        Content
      </AppShell>,
    );
    const sidebar = screen.getByText("Sidebar").parentElement;

    expect(sidebar?.className).toContain("border-s");
  });

  it("should render all sections together", () => {
    render(
      <AppShell header={<div>Header</div>} footer={<div>Footer</div>} sidebar={<div>Sidebar</div>}>
        Content
      </AppShell>,
    );
    expect(screen.getByText("Header")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
    expect(screen.getByText("Sidebar")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
  });
});
