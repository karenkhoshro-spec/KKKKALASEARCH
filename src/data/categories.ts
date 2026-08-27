import type { Category } from "../types";

// Implementation 10: 15 categories as required, including Others with sub-items
// Preserves existing functionality, no fake products
// Icons are emojis for simplicity, can be replaced with real images later
export const categories: Category[] = [
  {
    id: "shopping-basket",
    name: { fa: "سبد خرید", en: "Shopping Basket", ar: "سلة التسوق" },
    icon: "🛒",
  },
  {
    id: "picnic-basket",
    name: { fa: "سبد پیکنیک", en: "Picnic Basket", ar: "سلة النزهة" },
    icon: "🧺",
  },
  {
    id: "stool",
    name: { fa: "چهار پایه", en: "Stool", ar: "مقعد" },
    icon: "🪑",
  },
  {
    id: "powder-sponge-holder",
    name: { fa: "جا پودری/اسکاجی", en: "Powder/Sponge Holder", ar: "حامل المسحوق والإسفنج" },
    icon: "🧽",
  },
  {
    id: "fruit-veg-basket",
    name: { fa: "سبد میوه و سبزی", en: "Fruit & Veg Basket", ar: "سلة الفواكه والخضروات" },
    icon: "🍎",
  },
  {
    id: "colander-bowl",
    name: { fa: "آبکش و سبد و کاسه", en: "Colander & Bowl & Basket", ar: "مصفاة وسلة ووعاء" },
    icon: "🥣",
  },
  {
    id: "freezer",
    name: { fa: "فریزری", en: "Freezer Containers", ar: "أواني الفريزر" },
    icon: "❄️",
  },
  {
    id: "soap-holder",
    name: { fa: "جاصابونی", en: "Soap Holder", ar: "حامل الصابون" },
    icon: "🧼",
  },
  {
    id: "spice-holder",
    name: { fa: "جا ادویه", en: "Spice Holder", ar: "حامل التوابل" },
    icon: "🌶️",
  },
  {
    id: "pitcher-glass",
    name: { fa: "پارچ و لیوان", en: "Pitcher & Glass", ar: "إبريق وكأس" },
    icon: "🍶",
  },
  {
    id: "juicer",
    name: { fa: "آبمیوه گیری", en: "Juicer", ar: "عصارة" },
    icon: "🍊",
  },
  {
    id: "ice-holder",
    name: { fa: "جا یخی", en: "Ice Holder", ar: "حامل الثلج" },
    icon: "🧊",
  },
  {
    id: "bucket",
    name: { fa: "سطل", en: "Bucket", ar: "دلو" },
    icon: "🪣",
  },
  {
    id: "basin-tub",
    name: { fa: "لگن و وان", en: "Basin & Tub", ar: "حوض وطشت" },
    icon: "🛁",
  },
  {
    id: "others",
    name: { fa: "سایر", en: "Others", ar: "أخرى" },
    icon: "📦",
  },
];

// Sub-categories inside Others (not independent main categories)
export const othersSubCategories = [
  { id: "butter-holder", name: { fa: "جا کره‌ای", en: "Butter Holder", ar: "حامل الزبدة" } },
  { id: "spoon-holder", name: { fa: "جا قاشقی", en: "Spoon Holder", ar: "حامل الملاعق" } },
  { id: "flower-pot", name: { fa: "گلدان", en: "Flower Pot", ar: "أصيص" } },
] as const;
