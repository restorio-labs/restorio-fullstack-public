import { Button, EmptyState, Icon, Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";

const EmptyStatePage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          EmptyState
        </Text>
        <Text className="text-text-secondary">Communicate zero-data states with optional iconography and actions.</Text>
      </Stack>
      <Stack direction="row" spacing="md" wrap>
        <EmptyState
          title="No orders yet"
          description="Orders will appear once customers start placing them."
          icon={
            <Icon size="lg" viewBox="0 0 24 24">
              <path d="M3 7h18M6 7v14h12V7" />
              <path d="m9 11 3 3 3-3" />
            </Icon>
          }
          action={<Button>Invite customers</Button>}
          className="border border-border-default rounded-lg bg-surface-primary"
        />
        <EmptyState
          title="No saved filters"
          description="Create filters to quickly revisit specific views."
          action={
            <Stack direction="row" spacing="sm" justify="center">
              <Button variant="secondary">Learn more</Button>
              <Button>Create filter</Button>
            </Stack>
          }
          className="border border-border-default rounded-lg bg-surface-primary"
        />
      </Stack>
    </Stack>
  );
};

export default EmptyStatePage;
