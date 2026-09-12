import { Box, cn, Icon, Stack, Text, usePrefersReducedMotion } from "@restorio/ui";
import { type ReactElement } from "react";

import type { DropZone } from "../types/orders.types";

export interface DropZoneBarProps {
  isVisible: boolean;
  zones: DropZone[];
  activeZoneId: string | null;
  onZoneClick?: (zoneId: string) => void;
}

export const DropZoneBar = ({ isVisible, zones, activeZoneId, onZoneClick }: DropZoneBarProps): ReactElement => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!isVisible) {
    return <></>;
  }

  return (
    <Box
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-surface-primary border-t-2 border-border-strong shadow-2xl",
        "px-4 py-4",
        !prefersReducedMotion && "animate-in slide-in-from-bottom duration-200",
      )}
    >
      <Stack direction="row" spacing="md" justify="center" className="max-w-screen-xl mx-auto">
        {zones.map((zone) => {
          const isActive = activeZoneId === zone.id;

          return (
            <button
              key={zone.id}
              type="button"
              data-snap-zone="true"
              data-zone-id={zone.id}
              onClick={() => onZoneClick?.(zone.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-card border-2 px-6 py-4 min-w-32",
                "transition-all duration-200",
                isActive
                  ? "border-border-focus bg-surface-tertiary scale-110 shadow-lg"
                  : "border-border-strong bg-surface-secondary hover:bg-surface-tertiary hover:scale-105",
                zone.className,
              )}
            >
              <Box
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2",
                  isActive ? "border-border-focus" : "border-current",
                )}
              >
                <Icon size="md" viewBox="0 0 24 24">
                  {zone.iconPath}
                </Icon>
              </Box>
              <Text as="span" variant="body-sm" weight="semibold">
                {zone.label}
              </Text>
            </button>
          );
        })}
      </Stack>
    </Box>
  );
};
