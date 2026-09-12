import { forwardRef, useId, type ReactElement } from "react";

import { cn } from "../../utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, error, id, className, ...props }, ref): ReactElement => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const errorId = `${switchId}-error`;
    const ariaDescribedBy = error ? errorId : undefined;

    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center gap-2">
          <label htmlFor={switchId} className="relative inline-flex items-center cursor-pointer">
            <input
              ref={ref}
              type="checkbox"
              id={switchId}
              role="switch"
              className="sr-only peer"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={ariaDescribedBy}
              {...props}
            />
            <div
              className={cn(
                "w-11 h-6 bg-surface-secondary border border-border-default rounded-full peer",
                "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-border-focus peer-focus:ring-offset-2",
                "peer-checked:bg-interactive-primary peer-checked:border-interactive-primary",
                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                "transition-colors duration-200",
                error && "border-status-error-border peer-focus:ring-status-error-border",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 start-0.5 bg-surface-primary border border-border-default rounded-full h-5 w-5",
                  "peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5",
                  "transition-transform duration-200",
                  "peer-disabled:opacity-50",
                )}
              />
            </div>
          </label>
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-text-primary cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && (
          <span id={errorId} className="block mt-1 text-sm text-status-error-text" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";
