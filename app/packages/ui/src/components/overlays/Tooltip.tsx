import { useState, type ReactNode, type ReactElement, useRef, useId, useEffect } from "react";

import { cn } from "../../utils";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  placement = "top",
  delay = 200,
  className,
}: TooltipProps): ReactElement => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const handleMouseEnter = (): void => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible]);

  const placementStyles: Record<TooltipPlacement, string> = {
    top: "bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-2",
    bottom: "top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2",
    left: "end-full top-1/2 -translate-y-1/2 me-2",
    right: "start-full top-1/2 -translate-y-1/2 ms-2",
  };

  const arrowStyles: Record<TooltipPlacement, string> = {
    top: "top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-t-surface-elevated",
    bottom: "bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-b-surface-elevated",
    left: "start-full top-1/2 -translate-y-1/2 border-s-surface-elevated",
    right: "end-full top-1/2 -translate-y-1/2 border-e-surface-elevated",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      {isVisible && (
        <div
          id={tooltipId}
          className={cn(
            "absolute z-tooltip border border-border-default bg-surface-elevated px-2 py-1 text-sm text-text-primary shadow-dropdown rounded-tooltip whitespace-nowrap",
            placementStyles[placement],
            className,
          )}
          role="tooltip"
        >
          {content}
          <div className={cn("absolute w-0 h-0 border-4 border-transparent", arrowStyles[placement])} />
        </div>
      )}
    </div>
  );
};
