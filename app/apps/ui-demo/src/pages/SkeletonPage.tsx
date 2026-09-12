import { Skeleton, Stack, Text } from "@restorio/ui";
import type { SkeletonAnimation, SkeletonVariant } from "@restorio/ui";
import type { ReactElement } from "react";

const variants: SkeletonVariant[] = ["text", "circular", "rectangular"];
const animations: SkeletonAnimation[] = ["pulse", "wave", "none"];

const SkeletonPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Skeleton
        </Text>
        <Text className="text-text-secondary">
          Placeholder skeletons for loading states across shapes and animations.
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Variants
        </Text>
        <Stack direction="row" spacing="md" wrap>
          {variants.map((variant) => (
            <Stack
              key={variant}
              spacing="sm"
              align="center"
              className="p-4 border border-border-default rounded-lg min-w-[180px]"
            >
              <Skeleton
                variant={variant}
                width={variant === "circular" ? 64 : 200}
                height={variant === "text" ? undefined : 64}
              />
              <Text variant="body-sm" className="text-text-secondary">
                {variant}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Animations
        </Text>
        <Stack direction="row" spacing="md" wrap>
          {animations.map((animation) => (
            <Stack
              key={animation}
              spacing="sm"
              align="center"
              className="p-4 border border-border-default rounded-lg min-w-[180px]"
            >
              <Skeleton variant="rectangular" width={200} height={64} animation={animation} />
              <Text variant="body-sm" className="text-text-secondary">
                {animation}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SkeletonPage;
