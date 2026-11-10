import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_POST_ORDER = [
  "President",
  "General Secretary",
  "Treasurer",
  "Vice President",
  "Arts Secretary",
  "Sports Secretary",
];

export function sortPostsByHierarchy(posts: string[]): string[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => {
    const idxA = DEFAULT_POST_ORDER.indexOf(a);
    const idxB = DEFAULT_POST_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a || "").localeCompare(b || "");
  });
}

