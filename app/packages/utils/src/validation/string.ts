export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
