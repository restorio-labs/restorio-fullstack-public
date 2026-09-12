import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "error" | "success" | "helper";
}

export const FormMessage = forwardRef<HTMLDivElement, FormMessageProps>(
  ({ variant = "helper", className, children, id, ...props }, ref) => {
    if (!children) {
      return null;
    }

    const variantClasses = {
      error: "text-status-error-text",
      success: "text-status-success-text",
      helper: "text-text-secondary",
    };

    const role = variant === "error" ? "alert" : undefined;
    const ariaLive = variant === "error" ? "polite" : undefined;

    return (
      <div
        ref={ref}
        id={id}
        role={role}
        aria-live={ariaLive}
        className={cn("text-sm", variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

FormMessage.displayName = "FormMessage";
