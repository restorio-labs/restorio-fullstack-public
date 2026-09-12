import { forwardRef, useId } from "react";

import { cn } from "../../utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, resize = "vertical", id, className, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-2 text-base text-text-primary bg-surface-primary border border-border-default rounded-input",
            "placeholder:text-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-secondary",
            "min-h-[100px]",
            resizeClasses[resize],
            error && "border-status-error-border focus:ring-status-error-border focus:border-status-error-border",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
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

Textarea.displayName = "Textarea";
