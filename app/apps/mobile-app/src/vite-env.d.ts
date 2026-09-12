/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MOBILE_ALLOW_DESKTOP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
