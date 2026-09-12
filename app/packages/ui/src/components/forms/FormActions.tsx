import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center" | "stretch";
  spacing?: "sm" | "md" | "lg";
}

export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  ({ align = "end", spacing = "md", className, children, ...props }, ref) => {
    const alignClasses = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      stretch: "justify-stretch",
    };

    const spacingClasses = {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center", alignClasses[align], spacingClasses[spacing], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

FormActions.displayName = "FormActions";
