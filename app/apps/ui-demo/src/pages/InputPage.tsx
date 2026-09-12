import { Input, Stack, Text } from "@restorio/ui";
import { useState, type ReactElement } from "react";

const InputPage = (): ReactElement => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Stack spacing="lg" className="max-w-5xl">
      <Stack spacing="sm">
        <Text variant="h2" weight="semibold">
          Input
        </Text>
        <Text className="text-text-secondary">Text inputs with labels, helper text, and error messaging.</Text>
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          Controlled
        </Text>
        <Input
          label="Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(event): void => setName(event.target.value)}
        />
      </Stack>
      <Stack spacing="md">
        <Text variant="h4" weight="semibold">
          States
        </Text>
        <Stack direction="row" spacing="md" wrap>
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event): void => setEmail(event.target.value)}
            helperText="We will never share your email."
          />
          <Input label="Disabled" placeholder="Disabled input" disabled className="max-w-xs" />
          <Input label="With error" placeholder="Invalid value" error="This field is required" className="max-w-xs" />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default InputPage;
