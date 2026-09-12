import { Stack, Text } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

const quickLinks = [
  { label: "Buttons", path: "/buttons" },
  { label: "Inputs", path: "/inputs" },
  { label: "Overlays", path: "/modal" },
  { label: "Feedback", path: "/loader" },
];

const OverviewPage = (): ReactElement => {
  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h1" weight="semibold">
          Restorio UI demo
        </Text>
        <Text variant="body-lg" className="text-text-secondary">
          Browse component examples from @restorio/ui. Use the sidebar to switch between dedicated pages.
        </Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h3" weight="semibold">
          Quick links
        </Text>
        <Stack direction="row" spacing="sm" wrap>
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-interactive-secondary text-text-primary hover:bg-interactive-secondaryHover transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </Stack>
      </Stack>
      <Stack spacing="sm">
        <Text variant="h3" weight="semibold">
          What is included
        </Text>
        <Text variant="body-md" className="text-text-secondary">
          Layout primitives, form controls, feedback indicators, overlays, navigation helpers, and cards are showcased
          with multiple states on their own pages.
        </Text>
      </Stack>
    </Stack>
  );
};

export default OverviewPage;
