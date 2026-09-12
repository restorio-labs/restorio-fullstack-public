import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  isInvalid?: boolean;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, children, isInvalid, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative w-full", isInvalid && "form-control-invalid", className)} {...props}>
        {children}
      </div>
    );
  },
);

FormControl.displayName = "FormControl";
