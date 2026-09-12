import { Button, type ButtonProps } from "@restorio/ui";
import { useCallback, useState, type ReactElement, type ReactNode } from "react";

export interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  /**
   * Async function that performs the logout action. It can throw to signal failure.
   */
  onLogout?: () => Promise<void> | void;
  /**
   * Optional URL to redirect to after a successful logout.
   */
  redirectTo?: string;
  /**
   * Custom content to display while the logout action is pending.
   */
  loadingLabel?: ReactNode;
  /**
   * When set, shown instead of loadingLabel while the logout action is pending.
   */
  loadingContent?: ReactNode;
  children?: ReactNode;
}

const redirect = (target?: string): void => {
  if (!target) {
    return;
  }

  if (typeof window !== "undefined") {
    window.location.href = target;
  }
};

const LogoutIcon = ({ className }: { className?: string }): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 5h-2a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 8l4 4-4 4M10 12h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const mergeClasses = (...classes: (string | undefined)[]): string => classes.filter(Boolean).join(" ");

export const LogoutButton = ({
  onLogout,
  redirectTo,
  loadingLabel = "Logging out…",
  loadingContent,
  children,
  disabled,
  className,
  ...buttonProps
}: LogoutButtonProps): ReactElement => {
  const { variant = "danger", ...restButtonProps } = buttonProps;
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await onLogout?.();
      redirect(redirectTo);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onLogout, redirectTo]);

  const handleClick = useCallback((): void => {
    void handleLogout();
  }, [handleLogout]);

  return (
    <Button
      {...restButtonProps}
      variant={variant}
      className={mergeClasses(
        "gap-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-offset-2",
        className,
      )}
      onClick={handleClick}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading}
      aria-label={typeof children === "string" ? children : "Logout"}
    >
      {isLoading ? (loadingContent ?? loadingLabel) : (children ?? <LogoutIcon className="h-6 w-6" />)}
    </Button>
  );
};
