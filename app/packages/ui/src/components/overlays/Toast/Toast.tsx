import { useRef, type ReactElement, type ReactNode } from "react";

import { cn } from "../../../utils";

import { createToastId } from "./createToastId";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
  closeButtonAriaLabel?: string;
}

const variantStyles: Record<ToastVariant, string> = {
  info: "bg-status-info-background border-status-info-border text-status-info-text",
  success: "bg-status-success-background border-status-success-border text-status-success-text",
  warning: "bg-status-warning-background border-status-warning-border text-status-warning-text",
  error: "bg-status-error-background border-status-error-border text-status-error-text",
};

export const Toast = ({
  title,
  description,
  variant = "info",
  action,
  onClose,
  className,
  closeButtonAriaLabel = "Close toast",
}: ToastProps): ReactElement => {
  const generatedIdRef = useRef<string>(createToastId());
  const resolvedId = generatedIdRef.current;

  return (
    <div
      id={resolvedId}
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 border rounded-md shadow-lg min-w-[300px] max-w-[500px]",
        variantStyles[variant],
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium">{title}</div>
        {description && <div className="mt-1 text-sm opacity-90">{description}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm"
          aria-label={closeButtonAriaLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
