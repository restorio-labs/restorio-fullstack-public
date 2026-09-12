import { Stack, Text } from "@restorio/ui";
import type { TextVariant, TextWeight } from "@restorio/ui";
import type { ReactElement } from "react";

const variants: TextVariant[] = ["h1", "h2", "h3", "h4", "body-lg", "body-md", "body-sm", "caption"];
const weights: TextWeight[] = ["regular", "medium", "semibold", "bold"];

const TextPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Text
        </Text>
        <Text className="text-text-secondary">
          Typography variants and weights for headings, body copy, and captions.
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Variants
        </Text>
        <Stack spacing="sm">
          {variants.map((variant) => (
            <Text key={variant} variant={variant} weight="semibold">
              {variant.toUpperCase()} example
            </Text>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Weights
        </Text>
        <Stack spacing="sm">
          {weights.map((weight) => (
            <Text key={weight} variant="body-lg" weight={weight}>
              {weight} weight body text
            </Text>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TextPage;
