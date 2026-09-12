/* eslint-disable no-console */
interface ViteEnv {
  readonly DEV?: boolean;
  readonly MODE?: string;
}

const isDevelopment = (): boolean => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    return true;
  }

  if (typeof import.meta !== "undefined" && "env" in import.meta) {
    const env = import.meta.env as ViteEnv;

    if (env.DEV === true) {
      return true;
    }

    if (env.MODE === "development") {
      return true;
    }
  }

  return false;
};

const debug = (...args: unknown[]): void => {
  if (isDevelopment()) {
    console.debug(...args);
  }
};

const info = (...args: unknown[]): void => {
  console.info(...args);
};

const warn = (...args: unknown[]): void => {
  console.warn(...args);
};

const error = (...args: unknown[]): void => {
  console.error(...args);
};

export const logger = {
  debug,
  info,
  warn,
  error,
};
