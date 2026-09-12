import { forwardRef } from "react";

import { cn } from "../../utils";

export type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn("text-sm text-text-secondary", className)} {...props} />;
  },
);

FormDescription.displayName = "FormDescription";
