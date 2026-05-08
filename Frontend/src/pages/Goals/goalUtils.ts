export function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function daysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
}

export function daysLeftLabel(days: number): { label: string; color: string } {
  if (days < 0)  return { label: "Overdue",           color: "#EF4444" };
  if (days <= 7) return { label: `${days} days left`, color: "#F59E0B" };
  return           { label: `${days} days left`,       color: "#3B82F6" };
}

export const GOAL_ICONS = ["✈️","💻","🏦","💪","🏠","🎓","🚗","💍","🌴","🎯","📱","🏋️"];

export function pickIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("vacat") || lower.includes("travel") || lower.includes("trip")) return "✈️";
  if (lower.includes("laptop") || lower.includes("computer") || lower.includes("tech")) return "💻";
  if (lower.includes("emergen") || lower.includes("fund") || lower.includes("saving")) return "🏦";
  if (lower.includes("fit") || lower.includes("health") || lower.includes("gym"))      return "💪";
  if (lower.includes("home") || lower.includes("house"))                                return "🏠";
  if (lower.includes("school") || lower.includes("edu") || lower.includes("college"))  return "🎓";
  if (lower.includes("car") || lower.includes("vehicle"))                               return "🚗";
  if (lower.includes("wed") || lower.includes("ring"))                                  return "💍";
  return "🎯";
}

export function pickColor(idx: number): { color: string; bg: string; ring: string } {
  const palette = [
    { color: "#A855F7", bg: "rgba(168,85,247,0.18)",  ring: "#A855F7" },
    { color: "#3B82F6", bg: "rgba(59,130,246,0.18)",  ring: "#3B82F6" },
    { color: "#10B981", bg: "rgba(16,185,129,0.18)",  ring: "#10B981" },
    { color: "#F59E0B", bg: "rgba(245,158,11,0.18)",  ring: "#F59E0B" },
    { color: "#EC4899", bg: "rgba(236,72,153,0.18)",  ring: "#EC4899" },
    { color: "#06B6D4", bg: "rgba(6,182,212,0.18)",   ring: "#06B6D4" },
  ];
  return palette[idx % palette.length];
}