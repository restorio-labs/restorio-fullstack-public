import { Loader, Stack, Text } from "@restorio/ui";
import type { LoaderSize } from "@restorio/ui";
import type { ReactElement } from "react";

const sizes: LoaderSize[] = ["sm", "md", "lg"];

const LoaderPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Loader
        </Text>
        <Text className="text-text-secondary">Indicate progress with spinning loader in multiple sizes.</Text>
      </Stack>
      <Stack direction="row" spacing="lg" wrap>
        {sizes.map((size) => (
          <Stack key={size} spacing="sm" align="center" className="p-4 border border-border-default rounded-lg">
            <Loader size={size} />
            <Text variant="body-sm" className="text-text-secondary">
              {size.toUpperCase()}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export default LoaderPage;
