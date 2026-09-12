import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with tailwind-merge to handle conflicts
 * Example: cn("bg-red-500", "bg-blue-500") -> "bg-blue-500"
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
