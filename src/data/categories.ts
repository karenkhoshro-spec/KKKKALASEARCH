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
