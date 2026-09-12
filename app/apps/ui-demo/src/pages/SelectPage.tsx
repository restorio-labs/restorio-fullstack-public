import { Select, Stack, Text } from "@restorio/ui";
import type { SelectOption } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const options: SelectOption[] = [
  { value: "pizza", label: "Pizza" },
  { value: "pasta", label: "Pasta" },
  { value: "salad", label: "Salad" },
];

const SelectPage = (): ReactElement => {
  const [value, setValue] = useState("");

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Select
        </Text>
        <Text className="text-text-secondary">
          Native select with labels, placeholders, helper text, and validation.
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Basic
        </Text>
        <Select
          label="Favorite dish"
          options={options}
          placeholder="Choose an option"
          value={value}
          onChange={(event): void => setValue(event.target.value)}
          helperText="Pick any option to see controlled value."
        />
        <Text variant="body-sm" className="text-text-secondary">
          Selected: {value || "none"}
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Error state
        </Text>
        <Select
          label="Required field"
          options={options}
          placeholder="Pick one"
          error="Selection is required"
          className="max-w-xs"
        />
      </Stack>
    </Stack>
  );
};

export default SelectPage;
