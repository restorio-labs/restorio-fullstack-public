import { Button, Stack, Text } from "@restorio/ui";
import type { ButtonSize, ButtonVariant } from "@restorio/ui";
import type { ReactElement } from "react";

const variants: ButtonVariant[] = ["primary", "secondary", "danger", "teal", "warm"];
const sizes: ButtonSize[] = ["sm", "md", "lg"];

const ButtonPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Button
        </Text>
        <Text className="text-text-secondary">Variants, sizes, disabled, and full-width configurations.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Variants
        </Text>
        <Stack direction="row" spacing="sm" wrap>
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Button>
          ))}
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Sizes
        </Text>
        <Stack direction="row" spacing="sm" wrap>
          {sizes.map((size) => (
            <Button key={size} size={size}>
              {size.toUpperCase()}
            </Button>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Full width
        </Text>
        <Button fullWidth size="lg">
          Expand to container
        </Button>
      </Stack>
    </Stack>
  );
};

export default ButtonPage;
