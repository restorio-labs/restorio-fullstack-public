import { cn } from "@restorio/ui";
import { type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DragOverlayProps {
  isVisible: boolean;
  position: { x: number; y: number } | null;
  children: ReactNode;
  className?: string;
}

export const DragOverlay = ({ isVisible, position, children, className }: DragOverlayProps): ReactElement | null => {
  if (!isVisible || !position) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-50 opacity-90",
        "transform -translate-x-1/2 -translate-y-1/2",
        className,
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};
