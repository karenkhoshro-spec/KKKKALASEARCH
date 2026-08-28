import type { Category } from "../types";

export const categories: Category[] = [
  { id: "storage", name: { fa: "ظروف نگهداری", en: "Storage Containers", ar: "أواني الحفظ" }, icon: "📦" },
  { id: "laundry", name: { fa: "سبد و لوازم لباسشویی", en: "Laundry Baskets", ar: "سلال الغسيل" }, icon: "🧺" },
  { id: "bucket", name: { fa: "سطل و دلو", en: "Buckets", ar: "الدلاء" }, icon: "🪣" },
  { id: "kitchen", name: { fa: "لوازم آشپزخانه", en: "Kitchenware", ar: "أدوات المطبخ" }, icon: "🍽️" },
  { id: "hanger", name: { fa: "چوب لباسی و آویز", en: "Hangers", ar: "الشماعات" }, icon: "👕" },
  { id: "trash", name: { fa: "سطل زباله", en: "Trash Bins", ar: "سلال المهملات" }, icon: "🗑️" },
];
