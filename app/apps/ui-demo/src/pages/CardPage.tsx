import { Button, Card, Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";

const CardPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Card
        </Text>
        <Text className="text-text-secondary">
          Simple container with optional header. Style via className overrides.
        </Text>
      </Stack>
      <Stack direction="row" spacing="md" wrap>
        <Card title="Compact card" className="max-w-sm">
          <Stack spacing="sm">
            <Text variant="body-md">Use cards to group related content and actions.</Text>
            <Stack direction="row" spacing="sm">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
            </Stack>
          </Stack>
        </Card>
        <Card title="Emphasized card" className="max-w-sm shadow-lg border-border-default">
          <Stack spacing="sm">
            <Text variant="body-md">
              Override styles per usage. This card adds a stronger shadow and keeps the header visible.
            </Text>
            <Button variant="danger" size="sm">
              Destructive action
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Stack>
  );
};

export default CardPage;
