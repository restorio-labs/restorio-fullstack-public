import { forwardRef, useId, type ReactElement } from "react";

import { cn } from "../utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, ...props }, ref): ReactElement => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2 text-base text-text-primary bg-surface-primary border border-border-default rounded-input",
            "placeholder:text-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-secondary",
            error && "border-status-error-border focus:ring-status-error-border focus:border-status-error-border",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={(error ? errorId : undefined) ?? helperId}
          {...props}
        />
        {error && (
          <span id={errorId} className="block mt-1 text-sm text-status-error-text" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="block mt-1 text-sm text-text-secondary">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
