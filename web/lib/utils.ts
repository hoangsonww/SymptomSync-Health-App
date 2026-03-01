import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const mergeClassNames = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export function cn(...inputs: ClassValue[]) {
  return mergeClassNames(...inputs);
}
