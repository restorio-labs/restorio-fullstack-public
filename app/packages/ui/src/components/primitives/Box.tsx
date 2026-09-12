import { forwardRef } from "react";

import { cn } from "../../utils";

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export const Box = forwardRef<HTMLElement, BoxProps>(({ className, as, children, ...props }, ref) => {
  const Component = (as ?? "div") as React.ElementType;
  const cnClassName = cn("block", className);

  return (
    <Component ref={ref} className={cnClassName} {...props}>
      {children}
    </Component>
  );
});

Box.displayName = "Box";
