import { Button, Dropdown, Stack, Text } from "@restorio/ui";
import type { DropdownPlacement } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const placements: DropdownPlacement[] = [
  "bottom-start",
  "bottom-center",
  "bottom-end",
  "top-start",
  "top-center",
  "top-end",
];

const DropdownPage = (): ReactElement => {
  const [isControlledOpen, setIsControlledOpen] = useState(false);

  const menu = (label: string): ReactElement => {
    return (
      <div className="py-2">
        <button type="button" className="w-full text-left px-4 py-2 hover:bg-surface-secondary">
          View {label}
        </button>
        <button type="button" className="w-full text-left px-4 py-2 hover:bg-surface-secondary">
          Edit {label}
        </button>
        <button
          type="button"
          className="w-full text-left px-4 py-2 text-status-danger-text hover:bg-status-danger-background"
        >
          Delete {label}
        </button>
      </div>
    );
  };

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Dropdown
        </Text>
        <Text className="text-text-secondary">Context menus with placement control and optional external state.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Placements
        </Text>
        <Stack direction="row" spacing="md" wrap>
          {placements.map((placement) => (
            <Dropdown key={placement} trigger={<Button variant="secondary">{placement}</Button>} placement={placement}>
              {menu(placement)}
            </Dropdown>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Controlled
        </Text>
        <Stack direction="row" spacing="sm" align="center" wrap>
          <Dropdown
            trigger={<Button variant="primary">Toggle programmatically</Button>}
            isOpen={isControlledOpen}
            onOpenChange={setIsControlledOpen}
          >
            {menu("controlled menu")}
          </Dropdown>
          <Button variant="secondary" onClick={(): void => setIsControlledOpen(false)} disabled={!isControlledOpen}>
            Close
          </Button>
          <Text variant="body-sm" className="text-text-secondary">
            Open: {isControlledOpen ? "yes" : "no"}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default DropdownPage;
