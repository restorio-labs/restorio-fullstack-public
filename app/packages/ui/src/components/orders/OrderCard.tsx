import { useId, useState, type ReactElement, type ReactNode } from "react";

import { usePrefersReducedMotion } from "../../hooks";
import { cn } from "../../utils";
import { Card } from "../Card";
import { Button } from "../primitives/Button";
import { Icon } from "../primitives/Icon";
import { Stack } from "../primitives/Stack";

export interface OrderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  summary: ReactNode;
  headerTrailing?: ReactNode;
  details?: ReactNode;
  footer?: ReactNode;
  statusIndicator?: ReactNode;
  toggleLabel: string;
  dragHandleLabel: string;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerMove?: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  };
  isExpanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  isDragging?: boolean;
  isDisabled?: boolean;
  showReorderButtons?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  moveUpLabel?: string;
  moveDownLabel?: string;
}

export const OrderCard = ({
  id,
  summary,
  headerTrailing,
  details,
  footer,
  statusIndicator,
  toggleLabel,
  dragHandleLabel,
  dragHandleProps,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isDragging = false,
  isDisabled = false,
  showReorderButtons = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  moveUpLabel = "Move up",
  moveDownLabel = "Move down",
  className,
  tabIndex,
  ...props
}: OrderCardProps): ReactElement => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const isControlled = typeof isExpanded === "boolean";
  const expanded = isControlled ? isExpanded : uncontrolledExpanded;
  const canExpand = Boolean(details);
  const resolvedTabIndex = tabIndex ?? 0;

  const {
    className: dragHandleClassName,
    disabled: dragHandleDisabled,
    style: dragHandleStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    ...restDragHandleProps
  } = dragHandleProps ?? {};
  const isDragHandleDisabled = isDisabled || Boolean(dragHandleDisabled);

  const handleToggle = (): void => {
    if (!canExpand || isDisabled) {
      return;
    }

    const nextExpanded = !expanded;

    if (!isControlled) {
      setUncontrolledExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
  };

  return (
    <Card
      role="listitem"
      tabIndex={resolvedTabIndex}
      aria-disabled={isDisabled || undefined}
      data-expanded={expanded}
      data-dragging={isDragging}
      data-order-id={id}
      className={cn(
        "w-full overflow-hidden rounded-md border border-border-strong bg-surface-primary p-2 shadow-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-4 focus-visible:ring-offset-background-secondary",
        isDragging && "pointer-events-none opacity-40",
        isDisabled && "opacity-60",
        className,
      )}
      {...props}
    >
      <Stack spacing="sm">
        <Stack direction="row" align="start" spacing="xs" className="min-w-0 gap-1.5 overflow-hidden">
          <Button
            variant="secondary"
            size="lg"
            className={cn(
              "min-w-0 flex-1 justify-center rounded-sm bg-surface-secondary text-text-primary",
              "hover:bg-surface-tertiary active:bg-surface-secondary",
              "min-h-[88px] px-4 py-3",
            )}
            onClick={handleToggle}
            aria-expanded={canExpand ? expanded : undefined}
            aria-controls={canExpand ? contentId : undefined}
            aria-label={toggleLabel}
            disabled={isDisabled || !canExpand}
          >
            <Stack spacing="xs" className="w-full items-center justify-center">
              <Stack direction="row" align="center" justify="between" spacing="sm" className="w-full">
                {statusIndicator}
                <div className="min-w-0 flex-1">{summary}</div>
                {headerTrailing ? <div className="flex flex-shrink-0 items-center">{headerTrailing}</div> : null}
                <Icon
                  size="md"
                  viewBox="0 0 24 24"
                  className={cn(
                    "mt-0.5 flex-shrink-0",
                    !prefersReducedMotion && "transition-transform duration-200",
                    expanded && "-scale-y-100",
                  )}
                >
                  <path d="M6 9l6 6 6-6" />
                </Icon>
              </Stack>
            </Stack>
          </Button>
          <Stack spacing="xs" className="w-[5.5rem] flex-shrink-0 items-stretch">
            {showReorderButtons && (
              <Stack direction="row" spacing="xs" className="gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-[42px] w-[42px] rounded-sm border border-border-strong bg-surface-tertiary text-text-secondary p-0",
                    "hover:bg-surface-secondary active:bg-surface-tertiary disabled:opacity-30",
                  )}
                  aria-label={moveUpLabel}
                  disabled={isDisabled || !canMoveUp}
                  onClick={onMoveUp}
                >
                  <Icon size="md" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M7 14l5-5 5 5"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Icon>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-[42px] w-[42px] rounded-sm border border-border-strong bg-surface-tertiary text-text-secondary p-0",
                    "hover:bg-surface-secondary active:bg-surface-tertiary disabled:opacity-30",
                  )}
                  aria-label={moveDownLabel}
                  disabled={isDisabled || !canMoveDown}
                  onClick={onMoveDown}
                >
                  <Icon size="md" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M7 10l5 5 5-5"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Icon>
                </Button>
              </Stack>
            )}
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "h-[44px] w-full flex-shrink-0 rounded-sm border border-border-strong bg-surface-tertiary text-text-secondary p-0",
                "hover:bg-surface-secondary active:bg-surface-tertiary",
                dragHandleClassName,
              )}
              style={dragHandleStyle}
              aria-label={dragHandleLabel}
              disabled={isDragHandleDisabled}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              {...restDragHandleProps}
            >
              <Icon size="lg" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M9 6h1M9 10h1M9 14h1M14 6h1M14 10h1M14 14h1" />
              </Icon>
            </Button>
          </Stack>
        </Stack>
        {details && (
          <div
            id={contentId}
            aria-hidden={!expanded}
            className={cn(
              expanded ? "mt-3 block" : "hidden",
              prefersReducedMotion ? "transition-none" : "transition-opacity duration-150",
            )}
          >
            <div className="rounded-sm border border-border-muted bg-surface-secondary px-4 py-3">{details}</div>
          </div>
        )}
        {footer && <div className="pt-2">{footer}</div>}
      </Stack>
    </Card>
  );
};
