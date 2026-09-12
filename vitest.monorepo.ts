import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export const monorepoResolveAliases = {
  "@restorio/types": resolve(repoRoot, "app/packages/types/src"),
  "@restorio/ui": resolve(repoRoot, "app/packages/ui/src"),
  "@restorio/api-client": resolve(repoRoot, "app/packages/api-client/src"),
  "@restorio/auth": resolve(repoRoot, "app/packages/auth/src"),
  "@restorio/utils": resolve(repoRoot, "app/packages/utils/src"),
  "@utils": resolve(repoRoot, "app/packages/ui/src/utils/index.ts"),
  "@components": resolve(repoRoot, "app/packages/ui/src/components"),
  react: resolve(repoRoot, "node_modules/react"),
  "react-dom": resolve(repoRoot, "node_modules/react-dom"),
};
