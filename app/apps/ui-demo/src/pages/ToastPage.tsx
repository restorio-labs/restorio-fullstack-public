import { Button, Stack, Text, useToast } from "@restorio/ui";
import type { ToastVariant } from "@restorio/ui";
import type { ReactElement } from "react";

const variants: ToastVariant[] = ["info", "success", "warning", "error"];

const ToastPage = (): ReactElement => {
  const { showToast } = useToast();

  const addToast = (variant: ToastVariant): void => {
    const title = `${variant.charAt(0).toUpperCase() + variant.slice(1)} toast`;
    const description = variant === "success" ? "Changes saved successfully." : "Detailed message for this toast.";

    showToast(variant, title, description);
  };

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Toast
        </Text>
        <Text className="text-text-secondary">
          Inline notifications with variant-based styling and dismiss controls.
        </Text>
      </Stack>
      <Stack direction="row" spacing="sm" wrap>
        {variants.map((variant) => (
          <Button key={variant} variant="secondary" onClick={(): void => addToast(variant)}>
            Show {variant}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
};

export default ToastPage;
