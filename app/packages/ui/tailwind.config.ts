import { createTailwindConfig } from "./src/theme/tailwindUtils";

const config = createTailwindConfig({
  content: ["./src/**/*.{ts,tsx}"],
});

export default config;
