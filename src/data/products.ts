import type { Product } from "../types";
import { ASHKAN_BASE_URL } from "../config";

function buildUrl(slug: string, override?: string) {
  if (override) return override;
  if (!ASHKAN_BASE_URL) return "";
  return `${ASHKAN_BASE_URL}/${slug}`;
}

export const products: Product[] = [
  {
    id: "p1",
    slug: "clear-storage-container-set",
    name: { fa: "ست ظروف نگهداری غذا شفاف ۵ تکه", en: "Clear Food Storage Container Set (5pcs)", ar: "طقم أواني حفظ الطعام الشفافة (5 قطع)" },
    description: {
      fa: "ست ۵ تکه ظروف نگهداری غذا از جنس پلاستیک درجه یک، مقاوم در برابر نشتی و مناسب برای یخچال و فریزر.",
      en: "A 5-piece set of premium food-grade storage containers, leak-proof and suitable for fridge and freezer use.",
      ar: "طقم من 5 قطع من أواني حفظ الطعام عالية الجودة، مقاومة للتسرب ومناسبة للثلاجة والفريزر.",
    },
    features: [
      { fa: "درب قفل‌شونده ضد نشتی", en: "Leak-proof locking lid", ar: "غطاء قفل مقاوم للتسرب" },
      { fa: "قابل استفاده در مایکروویو", en: "Microwave safe", ar: "آمن للاستخدام في الميكروويف" },
      { fa: "بدون BPA", en: "BPA-free material", ar: "خالٍ من مادة BPA" },
    ],
    categoryId: "freezer",
    price: 285000,
    oldPrice: 340000,
    image: "/images/product-storage-set.jpg",
    inStock: true,
    stockCount: 24,
    // Implementation 9: Ready for Excel - no fake data, only structure
    quantity: undefined,
    packQuantity: undefined,
    variations: [
      { id: "v1", name: { fa: "شفاف", en: "Clear", ar: "شفاف" } },
      { id: "v2", name: { fa: "آبی", en: "Blue", ar: "أزرق" }, color: "#60a5fa" },
    ],
    ashkanProductUrl: buildUrl("clear-storage-container-set"),
  },
  {
    id: "p2",
    slug: "color-storage-container-set",
    name: { fa: "ست ظروف نگهداری غذا رنگی ۷ تکه", en: "Colorful Food Storage Set (7pcs)", ar: "طقم أواني حفظ ملونة (7 قطع)" },
    description: {
      fa: "ست ۷ تکه با رنگ‌بندی شاد، مناسب برای سازماندهی یخچال و کابینت آشپزخانه.",
      en: "A 7-piece set with cheerful colors, perfect for organizing your fridge and kitchen cabinets.",
      ar: "طقم من 7 قطع بألوان مبهجة، مثالي لتنظيم الثلاجة وخزائن المطبخ.",
    },
    features: [
      { fa: "قابل شست‌وشو در ماشین ظرفشویی", en: "Dishwasher safe", ar: "آمن لغسالة الصحون" },
      { fa: "جنس بادوام و ضدضربه", en: "Durable, impact-resistant material", ar: "مادة متينة ومقاومة للصدمات" },
    ],
    categoryId: "freezer",
    price: 349000,
    image: "/images/product-storage-set.jpg",
    inStock: true,
    stockCount: 15,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("color-storage-container-set"),
  },
  {
    id: "p3",
    slug: "wheeled-laundry-basket",
    name: { fa: "سبد لباس چرخدار بزرگ", en: "Large Wheeled Laundry Basket", ar: "سلة غسيل كبيرة بعجلات" },
    description: {
      fa: "سبد لباس با ظرفیت بالا و چرخ‌های نرم برای جابجایی راحت در خانه.",
      en: "A high-capacity laundry basket with smooth wheels for easy movement around the house.",
      ar: "سلة غسيل عالية السعة مزودة بعجلات ناعمة للتنقل بسهولة في المنزل.",
    },
    features: [
      { fa: "ظرفیت ۴۰ لیتر", en: "40L capacity", ar: "سعة 40 لتر" },
      { fa: "دسته‌های ارگونومیک", en: "Ergonomic side handles", ar: "مقابض جانبية مريحة" },
    ],
    categoryId: "shopping-basket",
    price: 410000,
    image: "/images/product-laundry-basket.jpg",
    inStock: true,
    stockCount: 10,
    quantity: undefined,
    packQuantity: undefined,
    variations: [
      { id: "v1", name: { fa: "طوسی", en: "Grey", ar: "رمادي" }, color: "#94a3b8" },
      { id: "v2", name: { fa: "بنفش", en: "Purple", ar: "بنفسجي" }, color: "#a855f7" },
    ],
    ashkanProductUrl: buildUrl("wheeled-laundry-basket"),
  },
  {
    id: "p4",
    slug: "foldable-laundry-basket",
    name: { fa: "سبد لباس تاشو مسافرتی", en: "Foldable Travel Laundry Basket", ar: "سلة غسيل قابلة للطي" },
    description: {
      fa: "سبد لباس تاشو و سبک، مناسب برای فضاهای کوچک و مسافرت.",
      en: "A lightweight foldable basket, great for small spaces and travel.",
      ar: "سلة خفيفة وقابلة للطي، مثالية للمساحات الصغيرة والسفر.",
    },
    features: [
      { fa: "قابل جمع‌شدن در چند ثانیه", en: "Folds flat in seconds", ar: "تُطوى في ثوانٍ" },
      { fa: "وزن سبک", en: "Lightweight design", ar: "تصميم خفيف الوزن" },
    ],
    categoryId: "shopping-basket",
    price: 195000,
    image: "/images/product-laundry-basket.jpg",
    inStock: true,
    stockCount: 30,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("foldable-laundry-basket"),
  },
  {
    id: "p5",
    slug: "bucket-set-3pcs",
    name: { fa: "ست سطل رخت‌شویی ۳ سایز", en: "3-Size Laundry Bucket Set", ar: "طقم دلاء غسيل 3 مقاسات" },
    description: {
      fa: "سه سطل با اندازه‌های مختلف برای شست‌وشو، خیساندن و حمل آب.",
      en: "Three buckets in different sizes for washing, soaking, and carrying water.",
      ar: "ثلاثة دلاء بأحجام مختلفة للغسيل والنقع ونقل الماء.",
    },
    features: [
      { fa: "قابلیت تو در تو برای نگهداری آسان", en: "Stackable for easy storage", ar: "قابلة للتكديس لتخزين سهل" },
      { fa: "دسته فلزی مقاوم", en: "Sturdy metal handle", ar: "مقبض معدني متين" },
    ],
    categoryId: "bucket",
    price: 265000,
    image: "/images/product-bucket-set.jpg",
    inStock: true,
    stockCount: 18,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("bucket-set-3pcs"),
  },
  {
    id: "p6",
    slug: "bathroom-bucket-dipper",
    name: { fa: "سطل و دلو حمام", en: "Bathroom Bucket & Dipper Set", ar: "طقم دلو الحمام" },
    description: {
      fa: "ست سطل و دلو حمام با طراحی مقاوم و رنگ‌بندی متنوع.",
      en: "A bathroom bucket and dipper set with a durable design and various colors.",
      ar: "طقم دلو حمام بتصميم متين وألوان متنوعة.",
    },
    features: [
      { fa: "مقاوم در برابر آب داغ", en: "Hot water resistant", ar: "مقاوم للماء الساخن" },
      { fa: "سطح ضدلغزش", en: "Non-slip base", ar: "قاعدة مانعة للانزلاق" },
    ],
    categoryId: "bucket",
    price: 120000,
    image: "/images/product-bucket-set.jpg",
    inStock: false,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("bathroom-bucket-dipper"),
  },
  {
    id: "p7",
    slug: "kitchen-spice-organizer",
    name: { fa: "جا ادویه و ارگانایزر آشپزخانه", en: "Kitchen Spice Organizer Rack", ar: "منظم التوابل للمطبخ" },
    description: {
      fa: "قفسه چند طبقه برای نظم دادن به ادویه‌جات و وسایل کوچک آشپزخانه.",
      en: "A multi-tier rack to organize spices and small kitchen items.",
      ar: "رف متعدد الطبقات لتنظيم التوابل وأدوات المطبخ الصغيرة.",
    },
    features: [
      { fa: "طراحی فضا‌ساز", en: "Space-saving design", ar: "تصميم موفر للمساحة" },
      { fa: "قابل نصب روی دیوار یا کابینت", en: "Wall or cabinet mountable", ar: "قابل للتركيب على الحائط أو الخزانة" },
    ],
    categoryId: "spice-holder",
    price: 220000,
    image: "/images/product-kitchen-organizer.jpg",
    inStock: true,
    stockCount: 12,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("kitchen-spice-organizer"),
  },
  {
    id: "p8",
    slug: "rolling-spice-cart",
    name: { fa: "قفسه ادویه چرخدار ۳ طبقه", en: "3-Tier Rolling Spice Cart", ar: "عربة توابل متحركة 3 طبقات" },
    description: {
      fa: "قفسه چرخدار سه طبقه، مناسب برای آشپزخانه‌های کوچک و بزرگ.",
      en: "A 3-tier rolling cart, suitable for both small and large kitchens.",
      ar: "عربة متحركة من 3 طبقات، مناسبة للمطابخ الصغيرة والكبيرة.",
    },
    features: [
      { fa: "چرخ‌های قفل‌شونده", en: "Lockable wheels", ar: "عجلات قابلة للقفل" },
      { fa: "ظرفیت بالا", en: "High storage capacity", ar: "سعة تخزين عالية" },
    ],
    categoryId: "spice-holder",
    price: 490000,
    oldPrice: 560000,
    image: "/images/product-kitchen-organizer.jpg",
    inStock: true,
    stockCount: 6,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("rolling-spice-cart"),
  },
  {
    id: "p9",
    slug: "hanger-set-12pcs",
    name: { fa: "ست چوب لباسی ۱۲ عددی", en: "12-Piece Hanger Set", ar: "طقم شماعات 12 قطعة" },
    description: {
      fa: "ست ۱۲ عددی چوب لباسی مقاوم و ضد لغزش برای انواع لباس.",
      en: "A set of 12 durable, non-slip hangers suitable for all clothing types.",
      ar: "طقم من 12 شماعة متينة ومانعة للانزلاق تناسب جميع أنواع الملابس.",
    },
    features: [
      { fa: "سطح ضد لغزش مخملی", en: "Velvet non-slip surface", ar: "سطح مخملي مانع للانزلاق" },
      { fa: "طراحی نازک و فضا‌ساز", en: "Slim, space-saving design", ar: "تصميم رفيع موفر للمساحة" },
    ],
    categoryId: "others",
    price: 175000,
    image: "/images/product-hanger-set.jpg",
    inStock: true,
    stockCount: 40,
    quantity: undefined,
    packQuantity: undefined,
    variations: [
      { id: "v1", name: { fa: "مشکی", en: "Black", ar: "أسود" }, color: "#1f2937" },
      { id: "v2", name: { fa: "بژ", en: "Beige", ar: "بيج" }, color: "#d6c7a1" },
    ],
    ashkanProductUrl: buildUrl("hanger-set-12pcs"),
  },
  {
    id: "p10",
    slug: "coat-hanger-heavy-duty",
    name: { fa: "چوب لباسی مخصوص کت و پالتو", en: "Heavy-Duty Coat Hanger", ar: "شماعة معطف قوية" },
    description: {
      fa: "چوب لباسی تقویت‌شده مخصوص کت و پالتوهای سنگین.",
      en: "A reinforced hanger designed for heavy coats and jackets.",
      ar: "شماعة مقواة مصممة للمعاطف الثقيلة.",
    },
    features: [
      { fa: "تحمل وزن بالا", en: "High weight capacity", ar: "تحمل أوزان عالية" },
      { fa: "شانه عریض ضد چروک", en: "Wide anti-wrinkle shoulders", ar: "كتفان عريضان مانعان للتجعد" },
    ],
    categoryId: "others",
    price: 89000,
    image: "/images/product-hanger-set.jpg",
    inStock: true,
    stockCount: 50,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("coat-hanger-heavy-duty"),
  },
  {
    id: "p11",
    slug: "pedal-trash-bin-15l",
    name: { fa: "سطل زباله پدالی ۱۵ لیتری", en: "15L Pedal Trash Bin", ar: "سلة مهملات دواسة 15 لتر" },
    description: {
      fa: "سطل زباله پدالی با درب بی‌صدا و طراحی شیک برای آشپزخانه.",
      en: "A pedal trash bin with a silent-close lid and a sleek design for the kitchen.",
      ar: "سلة مهملات بدواسة وغطاء صامت وتصميم أنيق للمطبخ.",
    },
    features: [
      { fa: "مکانیزم درب بی‌صدا", en: "Silent-close lid mechanism", ar: "آلية إغلاق صامتة للغطاء" },
      { fa: "سطل داخلی قابل جداسازی", en: "Removable inner bucket", ar: "دلو داخلي قابل للفصل" },
    ],
    categoryId: "bucket",
    price: 310000,
    image: "/images/product-trash-bin.jpg",
    inStock: true,
    stockCount: 20,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("pedal-trash-bin-15l"),
  },
  {
    id: "p12",
    slug: "dual-compartment-trash-bin",
    name: { fa: "سطل زباله دو طبقه تفکیک زباله", en: "Dual-Compartment Recycling Bin", ar: "سلة مهملات مزدوجة لفرز النفايات" },
    description: {
      fa: "سطل زباله دو بخشی برای تفکیک زباله تر و خشک به‌طور همزمان.",
      en: "A two-compartment bin for separating wet and dry waste at the same time.",
      ar: "سلة مهملات ثنائية الحجرة لفصل النفايات الرطبة والجافة في آن واحد.",
    },
    features: [
      { fa: "دو محفظه مجزا", en: "Two separate compartments", ar: "حجرتان منفصلتان" },
      { fa: "مناسب برای بازیافت", en: "Great for recycling", ar: "مثالية لإعادة التدوير" },
    ],
    categoryId: "bucket",
    price: 385000,
    image: "/images/product-trash-bin.jpg",
    inStock: true,
    stockCount: 9,
    quantity: undefined,
    packQuantity: undefined,
    ashkanProductUrl: buildUrl("dual-compartment-trash-bin"),
  },
];

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function searchProducts(query: string, lang: "fa" | "en" | "ar") {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name[lang].toLowerCase().includes(q) ||
      p.name.fa.toLowerCase().includes(q) ||
      p.description[lang].toLowerCase().includes(q)
  );
}
