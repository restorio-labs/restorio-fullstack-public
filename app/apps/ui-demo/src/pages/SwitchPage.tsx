import { Stack, Switch, Text } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const SwitchPage = (): ReactElement => {
  const [enabled, setEnabled] = useState(true);

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Switch
        </Text>
        <Text className="text-text-secondary">Toggle switches with labels and validation states.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Controlled
        </Text>
        <Switch
          label="Enable notifications"
          checked={enabled}
          onChange={(event): void => setEnabled(event.target.checked)}
        />
        <Text variant="body-sm" className="text-text-secondary">
          Status: {enabled ? "Enabled" : "Disabled"}
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          States
        </Text>
        <Stack direction="row" spacing="md" wrap>
          <Switch label="Error state" error="Switch must be on" />
          <Switch label="Disabled" disabled />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SwitchPage;
