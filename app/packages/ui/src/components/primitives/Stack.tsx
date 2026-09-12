import { forwardRef } from "react";

import { cn } from "../../utils";

export type StackDirection = "row" | "column";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";
export type StackSpacing = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  spacing?: StackSpacing;
  wrap?: boolean;
}

const directionStyles: Record<StackDirection, string> = {
  row: "flex-row",
  column: "flex-col",
};

const alignStyles: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const spacingStyles: Record<StackSpacing, string> = {
  xs: "gap-xs",
  sm: "gap-sm",
  md: "gap-md",
  lg: "gap-lg",
  xl: "gap-xl",
  "2xl": "gap-2xl",
  "3xl": "gap-3xl",
  "4xl": "gap-4xl",
};

export const Stack = forwardRef<HTMLElement, StackProps>(
  (
    {
      as = "div",
      direction = "column",
      align = "stretch",
      justify = "start",
      spacing = "md",
      wrap = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = as as React.ElementType;

    return (
      <Component
        ref={ref}
        className={cn(
          "flex",
          directionStyles[direction],
          alignStyles[align],
          justifyStyles[justify],
          spacingStyles[spacing],
          wrap && "flex-wrap",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Stack.displayName = "Stack";
