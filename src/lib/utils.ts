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

export function getPostHierarchyRank(post: string): number {
  if (!post) return 999;
  const p = post.trim().toLowerCase();
  
  // Exact or direct matches
  if (p === "president") return 0;
  if (p === "general secretary" || p === "gen sec" || p === "general sec") return 1;
  if (p === "treasurer") return 2;
  if (p === "vice president" || p === "vp") return 3;
  if (p.includes("art")) return 4;
  if (p.includes("sport")) return 5;

  // Partial match checks
  if (p.includes("general") && p.includes("sec")) return 1;
  if (p.includes("presid") && !p.includes("vice")) return 0;
  if (p.includes("treasur")) return 2;
  if (p.includes("vice")) return 3;

  return 50;
}

export function sortPostsByHierarchy(posts: string[]): string[] {
  if (!Array.isArray(posts)) return [];
  return [...posts].sort((a, b) => {
    const rankA = getPostHierarchyRank(a);
    const rankB = getPostHierarchyRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return (a || "").localeCompare(b || "");
  });
}

export function sortCandidatesByHierarchy<T extends { post: string; name?: string }>(candidates: T[]): T[] {
  if (!Array.isArray(candidates)) return [];
  return [...candidates].sort((a, b) => {
    const rankA = getPostHierarchyRank(a.post);
    const rankB = getPostHierarchyRank(b.post);
    if (rankA !== rankB) return rankA - rankB;
    return (a.name || "").localeCompare(b.name || "");
  });
}

