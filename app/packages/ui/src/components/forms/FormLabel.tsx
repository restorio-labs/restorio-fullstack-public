import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  requiredAriaLabel?: string;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ required, disabled, className, children, requiredAriaLabel = "required", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-text-primary",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ms-1 text-status-error-text" aria-label={requiredAriaLabel}>
            *
          </span>
        )}
      </label>
    );
  },
);

FormLabel.displayName = "FormLabel";
