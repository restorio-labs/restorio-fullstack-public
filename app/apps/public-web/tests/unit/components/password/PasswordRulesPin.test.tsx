import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PasswordRulesPin } from "../../../../src/components/password/RulesPin";

type TranslationFn = (key: string) => string;
type UseTranslationsFn = (namespace?: string) => TranslationFn;

const { useTranslationsMock } = vi.hoisted(() => {
  const translate: TranslationFn = (key) => key;

  const useTranslationsMockInner: UseTranslationsFn = () => translate;

  return {
    useTranslationsMock: vi.fn<UseTranslationsFn>().mockImplementation(useTranslationsMockInner),
  };
});

vi.mock("@/i18n/useT", () => ({
  useTranslations: useTranslationsMock,
}));

describe("PasswordRulesPin", () => {
  beforeEach((): void => {
    useTranslationsMock.mockClear();
  });

  it("renders all password rules with correct translation keys", () => {
    render(
      <PasswordRulesPin
        checks={{
          minLength: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false,
        }}
      />,
    );

    expect(screen.getByText("minLength")).toBeInTheDocument();
    expect(screen.getByText("lowercase")).toBeInTheDocument();
    expect(screen.getByText("uppercase")).toBeInTheDocument();
    expect(screen.getByText("number")).toBeInTheDocument();
    expect(screen.getByText("special")).toBeInTheDocument();
    expect(useTranslationsMock).toHaveBeenCalledWith("register.passwordRules");
  });

  it("applies success class when checks pass", () => {
    render(
      <PasswordRulesPin
        checks={{
          minLength: true,
          lowercase: true,
          uppercase: true,
          number: true,
          special: true,
        }}
      />,
    );

    expect(screen.getByText("minLength")).toHaveClass("text-status-success-text");
    expect(screen.getByText("lowercase")).toHaveClass("text-status-success-text");
    expect(screen.getByText("uppercase")).toHaveClass("text-status-success-text");
    expect(screen.getByText("number")).toHaveClass("text-status-success-text");
    expect(screen.getByText("special")).toHaveClass("text-status-success-text");
  });

  it("applies default class when checks fail", () => {
    render(
      <PasswordRulesPin
        checks={{
          minLength: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false,
        }}
      />,
    );

    expect(screen.getByText("minLength")).toHaveClass("text-text-tertiary");
    expect(screen.getByText("lowercase")).toHaveClass("text-text-tertiary");
    expect(screen.getByText("uppercase")).toHaveClass("text-text-tertiary");
    expect(screen.getByText("number")).toHaveClass("text-text-tertiary");
    expect(screen.getByText("special")).toHaveClass("text-text-tertiary");
  });
});
