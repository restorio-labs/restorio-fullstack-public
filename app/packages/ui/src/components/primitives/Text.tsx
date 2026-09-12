import { forwardRef } from "react";

import { cn } from "../../utils";

export type TextVariant = "h1" | "h2" | "h3" | "h4" | "body-lg" | "body-md" | "body-sm" | "caption";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: TextVariant;
  weight?: TextWeight;
  align?: "start" | "center" | "end";
}

const variantStyles: Record<TextVariant, string> = {
  h1: "text-4xl leading-tight tracking-tight",
  h2: "text-3xl leading-snug tracking-tight",
  h3: "text-2xl leading-snug",
  h4: "text-xl leading-snug",
  "body-lg": "text-lg leading-relaxed",
  "body-md": "text-base leading-normal",
  "body-sm": "text-sm leading-normal",
  caption: "text-xs leading-normal text-text-secondary",
};

const weightStyles: Record<TextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const alignStyles = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      as = "div" as React.ElementType,
      variant = "body-md",
      weight = "regular",
      align = "start",
      children,
      ...props
    },
    ref,
  ) => {
    const Component = as as React.ElementType;

    return (
      <Component
        ref={ref}
        className={cn("text-text-primary", variantStyles[variant], weightStyles[weight], alignStyles[align], className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Text.displayName = "Text";
