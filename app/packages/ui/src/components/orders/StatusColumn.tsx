import { forwardRef, type ReactElement, type ReactNode } from "react";

import { cn } from "../../utils";
import { Box } from "../primitives/Box";
import { Stack } from "../primitives/Stack";
import { Text } from "../primitives/Text";

export interface StatusColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  ariaLabel?: string;
  statusIndicator?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  stickyHeader?: boolean;
  ordersClassName?: string;
  enableSnapScroll?: boolean;
  minWidth?: string;
  zoneId?: string;
  isActive?: boolean;
}

export const StatusColumn = forwardRef<HTMLDivElement, StatusColumnProps>(
  (
    {
      label,
      ariaLabel,
      statusIndicator,
      headerAction,
      footer,
      stickyHeader = true,
      ordersClassName,
      enableSnapScroll = false,
      minWidth,
      zoneId,
      isActive = false,
      className,
      children,
      ...props
    },
    ref,
  ): ReactElement => {
    return (
      <Box
        ref={ref}
        as="section"
        role="listitem"
        aria-label={ariaLabel ?? label}
        data-snap-zone="true"
        data-zone-id={zoneId}
        style={minWidth ? { minWidth } : undefined}
        className={cn(
          "flex w-full min-w-0 flex-shrink-0 flex-col gap-3 rounded-card border shadow-card transition-all duration-200 px-3 pt-1",
          isActive
            ? "border-2 border-border-focus bg-surface-tertiary ring-2 ring-border-focus ring-opacity-50"
            : "border border-border-strong bg-surface-secondary",
          enableSnapScroll && "snap-start snap-always",
          className,
        )}
        {...props}
      >
        <Box
          className={cn(
            "flex items-center justify-between gap-3 px-3 py-3",
            stickyHeader && "sticky top-0 z-10 bg-surface-secondary",
          )}
        >
          <Stack direction="row" align="center" spacing="sm">
            {statusIndicator}
            <Text as="h2" variant="body-lg" weight="semibold">
              {label}
            </Text>
          </Stack>
          {headerAction}
        </Box>
        <Box
          role="list"
          className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3", ordersClassName)}
        >
          {children}
        </Box>
        {footer && <Box className="px-3 pb-3">{footer}</Box>}
      </Box>
    );
  },
);

StatusColumn.displayName = "StatusColumn";
