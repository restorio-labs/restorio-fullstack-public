import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { PageLayout } from "../../../src/layouts/PageLayout";

describe("PageLayout", () => {
  it("should render children", () => {
    render(<PageLayout>Page content</PageLayout>);
    expect(screen.getByText("Page content")).toBeDefined();
  });

  it("should render title when provided", () => {
    render(<PageLayout title="Page Title">Content</PageLayout>);
    expect(screen.getByText("Page Title")).toBeDefined();
  });

  it("should render description when provided", () => {
    render(
      <PageLayout title="Title" description="Description text">
        Content
      </PageLayout>,
    );
    expect(screen.getByText("Description text")).toBeDefined();
  });

  it("should render header actions when provided", () => {
    render(
      <PageLayout title="Title" headerActions={<button type="button">Action</button>}>
        Content
      </PageLayout>,
    );
    expect(screen.getByText("Action")).toBeDefined();
  });

  it("should render all header elements together", () => {
    render(
      <PageLayout title="Page Title" description="Description" headerActions={<button type="button">Action</button>}>
        Content
      </PageLayout>,
    );
    expect(screen.getByText("Page Title")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Action")).toBeDefined();
  });

  it("should render title as h1", () => {
    render(<PageLayout title="Page Title">Content</PageLayout>);
    expect(screen.getByText("Page Title").tagName).toBe("H1");
  });
});
