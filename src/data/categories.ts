import type { Category } from "../types";

const name = (fa: string): Category["name"] => ({ fa, en: fa, ar: fa });

/** Static primary nav — same 9 ids/names as csvSource, without parsing CSV on Home. */
export const categories: Category[] = [
  { id: "shopping-basket", name: name("سبد خرید"), icon: "shopping-basket", sortOrder: 1 },
  { id: "picnic-basket", name: name("سبد پیکنیک"), icon: "picnic-basket", sortOrder: 2 },
  { id: "stool", name: name("چهار پایه"), icon: "stool", sortOrder: 3 },
  { id: "zanbil", name: name("زنبیل"), icon: "zanbil", sortOrder: 4 },
  { id: "fruit-vegetable-basket", name: name("سبد میوه و سبزی"), icon: "fruit-vegetable-basket", sortOrder: 5 },
  { id: "basin-bathtub", name: name("لگن و وان"), icon: "basin-bathtub", sortOrder: 6 },
  { id: "pitcher-glass", name: name("پارچ و لیوان"), icon: "pitcher-glass", sortOrder: 7 },
  { id: "freezer", name: name("فریزری"), icon: "freezer", sortOrder: 8 },
  { id: "other", name: name("سایر"), icon: "other", sortOrder: 9 },
];

/**
 * Popular subcategories promoted from inside "سایر" so the two visible home
 * rows show more of what customers search for. Each entry maps to a route
 * (/category/other + subcategory id) handled by CategoryPage's subcategory
 * view — the data-driven mapping in csvSource.ts is untouched.
 */
export interface HomeSubcategoryEntry {
  id: string;
  nameFa: string;
}

export const promotedSubcategories: HomeSubcategoryEntry[] = [
  { id: "colander-bowl", nameFa: "آبکش و کاسه" },
  { id: "spice", nameFa: "جا ادویه" },
  { id: "organizer", nameFa: "سبد و نظم‌دهنده" },
  { id: "bucket", nameFa: "سطل" },
  { id: "powder-sponge-holder", nameFa: "جا پودری و اسکاجی" },
  { id: "kitchen-tools", nameFa: "لوازم آشپزخانه" },
];

/** Human label for a subcategory id (falls back to the id itself). */
export function promotedSubcategoryLabel(id: string): string | undefined {
  return promotedSubcategories.find((sub) => sub.id === id)?.nameFa;
}
