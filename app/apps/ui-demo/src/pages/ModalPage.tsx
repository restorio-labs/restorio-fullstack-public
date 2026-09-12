import { Button, Modal, Stack, Text } from "@restorio/ui";
import type { ModalSize } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const sizes: ModalSize[] = ["sm", "md", "lg", "xl", "full"];

const ModalPage = (): ReactElement => {
  const [openSize, setOpenSize] = useState<ModalSize | null>(null);

  const close = (): void => setOpenSize(null);

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Modal
        </Text>
        <Text className="text-text-secondary">Dialog component with size options and overlay/escape handling.</Text>
      </Stack>
      <Stack direction="row" spacing="sm" wrap>
        {sizes.map((size) => (
          <Button key={size} onClick={(): void => setOpenSize(size)}>
            Open {size}
          </Button>
        ))}
      </Stack>
      <Modal
        isOpen={openSize !== null}
        size={openSize ?? "md"}
        onClose={close}
        title={`Modal size: ${openSize ?? "md"}`}
        closeOnOverlayClick
        closeOnEscape
      >
        <Stack spacing="md">
          <Text variant="body-lg">Use modals for critical flows and confirmations.</Text>
          <Stack direction="row" spacing="sm" justify="end">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Confirm</Button>
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ModalPage;
