import { Box, Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";

const BoxPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Box
        </Text>
        <Text className="text-text-secondary">
          Box renders semantic wrappers while inheriting spacing, borders, and interactive states through className
          overrides.
        </Text>
      </Stack>
      <Stack direction="row" spacing="md" wrap>
        <Box className="p-4 rounded-lg bg-surface-secondary">Default div wrapper</Box>
        <Box as="section" className="p-4 rounded-lg border border-border-default">
          Rendered as section
        </Box>
        <Box
          as="button"
          className="px-4 py-3 rounded-button bg-interactive-primary text-text-inverse hover:bg-interactive-primaryHover transition-colors"
        >
          As button element
        </Box>
        <Box as="article" className="p-4 rounded-lg shadow-md bg-surface-primary border border-border-default">
          Article with shadow
        </Box>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Nested layout
        </Text>
        <Box className="p-5 rounded-lg border border-border-default bg-surface-primary">
          <Stack direction="row" spacing="md" wrap>
            <Box className="p-3 rounded-md bg-surface-secondary min-w-[160px]">Flexible child</Box>
            <Box className="p-3 rounded-md bg-surface-secondary min-w-[160px]">Another child</Box>
            <Box className="p-3 rounded-md bg-surface-secondary min-w-[160px]">Third child</Box>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
};

export default BoxPage;
