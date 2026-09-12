import { cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "../../utils";
import { RestorioLogo } from "../marketing/restorioLogo";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

const LOGO_ASPECT = 3;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  children?: ReactNode;
  as?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isLogo?: boolean;
  logoBackground?: string;
  logoColor?: string;
  wink?: boolean;
  winking?: boolean;
}

const sizeStyles: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
  "3xl": "w-12 h-12",
  "4xl": "w-14 h-14",
  full: "h-full w-full",
};

const logoSizeStyles: Record<IconSize, string> = {
  xs: "h-3 w-auto",
  sm: "h-4 w-auto",
  md: "h-5 w-auto",
  lg: "h-6 w-auto",
  xl: "h-8 w-auto",
  "2xl": "h-10 w-auto",
  "3xl": "h-12 w-auto",
  "4xl": "h-14 w-auto",
  full: "h-full aspect-[3/1]",
};

const sizeToPx: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 56,
  full: 0,
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    {
      size = "md",
      className,
      children,
      as: AsComponent,
      isLogo = false,
      logoBackground,
      logoColor,
      wink,
      winking,
      ...props
    },
    ref,
  ): ReactElement => {
    const sizeClass = isLogo ? logoSizeStyles[size] : sizeStyles[size];
    const combinedClassName = cn("inline-block flex-shrink-0", sizeClass, className);

    if (isLogo) {
      if (size === "full") {
        return (
          <span className={combinedClassName} ref={ref as React.Ref<HTMLSpanElement>}>
            <RestorioLogo fillContainer background={logoBackground} color={logoColor} wink={wink} winking={winking} />
          </span>
        );
      }

      const height = sizeToPx[size];
      const width = Math.round(height * LOGO_ASPECT);

      return (
        <span className={combinedClassName} ref={ref as React.Ref<HTMLSpanElement>}>
          <RestorioLogo
            width={width}
            height={height}
            background={logoBackground}
            color={logoColor}
            wink={wink}
            winking={winking}
          />
        </span>
      );
    }

    if (AsComponent) {
      return <AsComponent ref={ref} className={combinedClassName} {...props} />;
    }

    if (isValidElement(children)) {
      if (children.type === "svg") {
        const svgElement = children as React.ReactElement<React.SVGProps<SVGSVGElement>>;
        const existingClassName = svgElement.props.className;

        return cloneElement(svgElement, {
          ref,
          className: cn(combinedClassName, existingClassName),
          ...props,
        });
      }

      if (typeof children.type === "function") {
        const existingClassName = (children.props as { className?: string }).className;

        return (
          <span className={combinedClassName} ref={ref as React.Ref<HTMLSpanElement>}>
            {cloneElement(children, {
              className: cn(existingClassName, className),
              ...props,
            } as React.Attributes)}
          </span>
        );
      }
    }

    return (
      <svg
        ref={ref}
        className={combinedClassName}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  },
);

Icon.displayName = "Icon";
