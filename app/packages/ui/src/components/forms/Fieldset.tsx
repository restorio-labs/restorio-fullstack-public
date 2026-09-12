import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend?: string;
  description?: string;
  spacing?: "sm" | "md" | "lg";
}

export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ legend, description, spacing = "md", className, children, disabled, ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-3",
      md: "space-y-4",
      lg: "space-y-6",
    };

    return (
      <fieldset
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full border border-border-default rounded-lg p-4",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {legend && <legend className="text-base font-semibold text-text-primary px-2 -ms-2">{legend}</legend>}
        {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
        <div className={spacingClasses[spacing]}>{children}</div>
      </fieldset>
    );
  },
);

Fieldset.displayName = "Fieldset";
