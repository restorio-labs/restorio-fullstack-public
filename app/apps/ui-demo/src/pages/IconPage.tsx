import { Icon, Stack, Text } from "@restorio/ui";
import type { IconSize } from "@restorio/ui";
import type { ReactElement } from "react";

interface DemoIcon {
  label: string;
  element: ReactElement;
}

const icons: DemoIcon[] = [
  {
    label: "Check",
    element: <path d="M5 13l4 4L19 7" />,
  },
  {
    label: "Alert",
    element: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="1" />
      </>
    ),
  },
  {
    label: "Star",
    element: (
      <path d="m12 17-5.09 2.673 1.136-5.94-4.39-4.098 6.056-.782L12 3l2.288 5.853 6.056.782-4.39 4.098 1.136 5.94z" />
    ),
  },
  {
    label: "Arrow",
    element: <path d="m5 12 5 5L19 7" />,
  },
];

const sizes: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

const IconPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Icon
        </Text>
        <Text className="text-text-secondary">Render custom SVG paths with consistent sizing presets.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Sizes
        </Text>
        <Stack direction="row" spacing="lg" wrap>
          {sizes.map((size) => (
            <Stack key={size} spacing="sm" align="center" className="p-4 border border-border-default rounded-lg">
              <Icon size={size} viewBox="0 0 24 24">
                {icons[0].element}
              </Icon>
              <Text variant="body-sm" className="text-text-secondary">
                {size.toUpperCase()}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Library examples
        </Text>
        <Stack direction="row" spacing="md" wrap>
          {icons.map((icon) => (
            <Stack key={icon.label} spacing="sm" align="center" className="p-4 border border-border-default rounded-lg">
              <Icon size="lg" viewBox="0 0 24 24">
                {icon.element}
              </Icon>
              <Text variant="body-sm" className="text-text-secondary">
                {icon.label}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default IconPage;
