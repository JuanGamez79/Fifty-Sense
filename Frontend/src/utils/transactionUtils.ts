import type { Category, FieldErrors } from "../types/transactions";

export const ICON_OPTIONS = [
  "🍽️","🛒","🏦","💳","🎬",
  "☕","📦","⛽","🏠","✈️",
  "🎮","💡","📚","❤️","🧾",
];

export function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

// Formatting 
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

// Validation 
export function validateDescription(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Description is required.";
  if (v.length < 2) return "Must be at least 2 characters.";
  if (v.length > 50) return "Must be 50 characters or fewer.";
  return undefined;
}

export function validateAmount(raw: string): string | undefined {
  const n = parseFloat(raw);
  if (!raw || isNaN(n)) return "Amount is required.";
  if (n <= 0) return "Amount must be greater than 0.";
  if (n >= 1_000_000) return "Amount must be less than 1,000,000.";
  return undefined;
}

export function validate(description: string, amount: string): FieldErrors {
  return {
    description: validateDescription(description),
    amount: validateAmount(amount),
  };
}

export function isValid(errors: FieldErrors): boolean {
  return !errors.description && !errors.amount;
}

// icon localStorage helper
export function getCategoryIcons(): Record<string, string> {
  try {
    const stored = localStorage.getItem("categoryIcons");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveCategoryIcon(categoryName: string, icon: string): void {
  const icons = getCategoryIcons();
  icons[categoryName] = icon;
  localStorage.setItem("categoryIcons", JSON.stringify(icons));
}

export function applyStoredIcons(categories: Category[]): Category[] {
  const icons = getCategoryIcons();
  return categories.map((cat) => ({
    ...cat,
    icon: icons[cat.category_name] || cat.icon || "💳",
  }));
}
