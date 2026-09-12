import { Checkbox, Stack, Text } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const CheckboxPage = (): ReactElement => {
  const [newsletter, setNewsletter] = useState(false);

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Checkbox
        </Text>
        <Text className="text-text-secondary">Labeled checkboxes with validation feedback.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Controlled
        </Text>
        <Checkbox
          label="Subscribe to newsletter"
          checked={newsletter}
          onChange={(event): void => setNewsletter(event.target.checked)}
        />
        <Text variant="body-sm" className="text-text-secondary">
          Status: {newsletter ? "Subscribed" : "Not subscribed"}
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Validation
        </Text>
        <Checkbox label="Terms" error="You must accept the terms" />
        <Checkbox label="Disabled" disabled />
      </Stack>
    </Stack>
  );
};

export default CheckboxPage;
