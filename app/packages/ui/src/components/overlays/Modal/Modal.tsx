import { useEffect, useRef, type ReactNode, type ReactElement } from "react";

import { cn } from "../../../utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
export type ModalVariant = "default" | "cookie";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  closeButtonAriaLabel?: string;
  variant?: ModalVariant;
  hideCloseButton?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  closeButtonAriaLabel = "Close modal",
  variant = "default",
  hideCloseButton = false,
}: ModalProps): ReactElement | null => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleEscape = (e: KeyboardEvent): void => {
      if (closeOnEscape && e.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const shouldCloseOnOverlay = closeOnOverlayClick && variant !== "cookie";

    if (shouldCloseOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        "modal-overlay-animate fixed inset-0 z-[1000] flex items-center justify-center bg-surface-overlay p-4",
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          "modal-panel-animate relative z-[1001] w-full rounded-lg bg-surface-primary shadow-lg",
          "focus:outline-none",
          sizeStyles[size],
          variant === "cookie" && "border border-border-default",
          className,
        )}
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex min-h-[3.25rem] items-center justify-center border-b border-border-default px-12 py-4">
          <h2 id="modal-title" className="text-center text-xl font-semibold text-text-primary">
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              aria-label={closeButtonAriaLabel}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-4 p-6 text-center">{children}</div>
      </div>
    </div>
  );
};
