import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { RestorioLogo, RestorioLogoPin, RestorioLogoText } from "../../../../src/components/marketing/restorioLogo";

describe("RestorioLogo", () => {
  it("renders with default size and colors", () => {
    const { container } = render(<RestorioLogo />);

    const svg = container.querySelector("svg");
    const rect = container.querySelector("rect");
    const pinPath = container.querySelector("path[fill='#4da6ff']");
    const textGroup = container.querySelector("g[fill='#4da6ff']");

    expect(svg?.getAttribute("width")).toBe("420");
    expect(svg?.getAttribute("height")).toBe("120");
    expect(rect?.getAttribute("fill")).toBe("#000000");
    expect(pinPath).not.toBeNull();
    expect(textGroup).not.toBeNull();
  });

  it("applies custom width, height, background and color", () => {
    const { container } = render(<RestorioLogo width={360} height={90} background="#101010" color="#00ffaa" />);

    const svg = container.querySelector("svg");
    const rect = container.querySelector("rect");
    const pinPath = container.querySelector("path[fill='#00ffaa']");
    const textGroup = container.querySelector("g[fill='#00ffaa']");

    expect(svg?.getAttribute("width")).toBe("360");
    expect(svg?.getAttribute("height")).toBe("90");
    expect(rect?.getAttribute("fill")).toBe("#101010");
    expect(pinPath).not.toBeNull();
    expect(textGroup).not.toBeNull();
  });

  it("fills container when fillContainer is true", () => {
    const { container } = render(<RestorioLogo fillContainer />);

    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("width")).toBe("100%");
    expect(svg?.getAttribute("height")).toBe("100%");
  });

  it("toggles wink classes", () => {
    const { container, rerender } = render(<RestorioLogo wink />);

    let winkNode = container.querySelector(".restorio-wink-base");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    const getClassName = (node: Element | null): string => (node ? ((node as SVGElement).className.baseVal ?? "") : "");

    expect(getClassName(winkNode)).toContain("restorio-wink-once");

    rerender(<RestorioLogo winking />);
    winkNode = container.querySelector(".restorio-wink-base");

    expect(getClassName(winkNode)).toContain("restorio-winking");
  });
});

describe("RestorioLogoPin", () => {
  it("uses mask and default pin color", () => {
    const { container } = render(
      <svg>
        <RestorioLogoPin />
      </svg>,
    );

    const mask = container.querySelector("mask#restorio-pin-mask");
    const pinPath = container.querySelector("path[mask='url(#restorio-pin-mask)']");

    expect(mask).not.toBeNull();
    expect(pinPath?.getAttribute("fill")).toBe("#8FB3D9");
  });
});

describe("RestorioLogoText", () => {
  it("applies the provided text color", () => {
    const { container } = render(
      <svg>
        <RestorioLogoText color="#ff6600" />
      </svg>,
    );

    const textGroup = container.querySelector("g[fill='#ff6600']");

    expect(textGroup).not.toBeNull();
  });
});
