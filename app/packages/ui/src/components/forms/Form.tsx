import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  spacing?: "sm" | "md" | "lg";
}

export const Form = forwardRef<HTMLFormElement, FormProps>(({ spacing = "md", className, children, ...props }, ref) => {
  const spacingClasses = {
    sm: "space-y-4",
    md: "space-y-6",
    lg: "space-y-8",
  };

  return (
    <form ref={ref} className={cn("w-full", spacingClasses[spacing], className)} {...props}>
      {children}
    </form>
  );
});

Form.displayName = "Form";
