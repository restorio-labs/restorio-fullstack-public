import { Children, type ReactNode, isValidElement } from "react";

import { cn } from "../../utils";

export interface NavSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export const NavSection = ({
  title,
  children,
  className,
  "aria-label": ariaLabel,
}: NavSectionProps): React.ReactElement => {
  return (
    <section className={cn("flex flex-col", className)} aria-label={ariaLabel ?? title}>
      {title != null && title !== "" ? (
        <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</h3>
      ) : null}
      <ul role="menu" className="flex flex-col list-none m-0 p-0">
        {Children.map(children, (child, i) => (
          <li key={isValidElement(child) && child.key != null ? child.key : i} role="none">
            {child}
          </li>
        ))}
      </ul>
    </section>
  );
};
