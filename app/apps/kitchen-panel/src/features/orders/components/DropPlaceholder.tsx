import { Box, cn, Stack, Text, useI18n, usePrefersReducedMotion } from "@restorio/ui";
import { type ReactElement } from "react";

export interface DropPlaceholderProps {
  orderId: string;
  table: string;
  itemCount: number;
  time: string;
  className?: string;
}

export const DropPlaceholder = ({ orderId, table, itemCount, time, className }: DropPlaceholderProps): ReactElement => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { t } = useI18n();

  return (
    <Box
      className={cn(
        "pointer-events-none w-full rounded-card border-2 border-dashed border-border-focus bg-surface-tertiary opacity-60",
        !prefersReducedMotion && "animate-pulse",
        className,
      )}
    >
      <Stack direction="row" align="center" spacing="sm" className="px-5 py-4">
        <Stack spacing="xs" className="min-w-0 flex-1">
          <Text as="p" variant="body-lg" weight="semibold" className="truncate text-text-secondary">
            {orderId}
          </Text>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {table} · {itemCount} {t("common.items")}
          </Text>
        </Stack>
        <Text as="span" variant="body-sm" weight="medium" className="text-text-secondary">
          {time}
        </Text>
      </Stack>
    </Box>
  );
};
