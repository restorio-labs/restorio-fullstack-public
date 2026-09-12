import { createTailwindConfig } from "@restorio/ui/tailwind";
import type { Config } from "tailwindcss";

/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call */
const config: Config = createTailwindConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
});

export default config;
