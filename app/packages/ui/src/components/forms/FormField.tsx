import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  required?: boolean;
  disabled?: boolean;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("w-full space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
});

FormField.displayName = "FormField";
