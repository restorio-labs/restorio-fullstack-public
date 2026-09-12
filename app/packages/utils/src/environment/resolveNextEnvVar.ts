export const resolveNextEnvVar = (source: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const v = source[key];

    if (typeof v === "string" && v.length > 0) {
      return v;
    }
  }

  return undefined;
};
