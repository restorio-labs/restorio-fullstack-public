import { Button, Stack, Text, Tooltip } from "@restorio/ui";
import type { ReactElement } from "react";

const TooltipPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Tooltip
        </Text>
        <Text className="text-text-secondary">Hover or focus triggers with configurable placement and delays.</Text>
      </Stack>
      <Stack direction="row" spacing="md" wrap>
        <Tooltip content="Appears above" placement="top">
          <Button variant="secondary">Top</Button>
        </Tooltip>
        <Tooltip content="Appears below" placement="bottom">
          <Button variant="secondary">Bottom</Button>
        </Tooltip>
        <Tooltip content="Appears left" placement="left">
          <Button variant="secondary">Left</Button>
        </Tooltip>
        <Tooltip content="Appears right" placement="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export default TooltipPage;
