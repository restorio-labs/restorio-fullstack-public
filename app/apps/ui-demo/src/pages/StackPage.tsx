import { Box, Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";

const StackPage = (): ReactElement => {
  const items = ["Alpha", "Beta", "Gamma"];

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Stack
        </Text>
        <Text className="text-text-secondary">
          Stack arranges children with configurable direction, alignment, justification, spacing, and wrapping.
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Directions
        </Text>
        <Stack direction="row" spacing="lg" wrap>
          <Stack
            direction="row"
            spacing="sm"
            className="p-4 border border-border-default rounded-lg bg-surface-primary"
          >
            {items.map((item) => (
              <Box key={item} className="px-3 py-2 rounded-md bg-surface-secondary">
                {item}
              </Box>
            ))}
          </Stack>
          <Stack
            direction="column"
            spacing="sm"
            className="p-4 border border-border-default rounded-lg bg-surface-primary"
          >
            {items.map((item) => (
              <Box key={item} className="px-3 py-2 rounded-md bg-surface-secondary">
                {item}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Alignment and justification
        </Text>
        <Stack direction="row" spacing="md" wrap>
          <Stack
            direction="row"
            spacing="sm"
            align="center"
            justify="between"
            className="p-4 border border-border-default rounded-lg bg-surface-primary min-w-[320px]"
          >
            {items.map((item) => (
              <Box key={item} className="px-3 py-2 rounded-md bg-surface-secondary">
                {item}
              </Box>
            ))}
          </Stack>
          <Stack
            direction="row"
            spacing="sm"
            align="end"
            justify="center"
            className="p-4 border border-border-default rounded-lg bg-surface-primary min-w-[320px]"
          >
            {items.map((item) => (
              <Box key={item} className="px-3 py-2 rounded-md bg-surface-secondary">
                {item}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default StackPage;
