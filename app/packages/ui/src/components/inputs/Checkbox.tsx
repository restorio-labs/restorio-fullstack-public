import { forwardRef, useId } from "react";

import { cn } from "../../utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, containerClassName, labelClassName, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const errorId = `${checkboxId}-error`;
    const helperId = `${checkboxId}-helper`;

    return (
      <div className={cn("w-full", containerClassName)}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "mt-0.5 w-4 h-4 text-interactive-primary bg-surface-primary border-border-default rounded-sm",
              "focus:ring-2 focus:ring-border-focus focus:ring-offset-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-status-error-border",
              className,
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={(error ? errorId : undefined) ?? helperId}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn("text-sm font-medium text-text-primary cursor-pointer", labelClassName)}
            >
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

Checkbox.displayName = "Checkbox";
