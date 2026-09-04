import { generateOrderPdf, downloadBlob, type OrderPdfData } from "./pdf";
import type { OrderItemPayload, StoredOrder } from "./ordersApi";
import { getProductById } from "../data/products";

export function orderPdfLabels(t: (key: string, vars?: Record<string, string>) => string): OrderPdfData["labels"] {
  // t() returns the key itself for unknown keys (e.g. unit-test stubs); only
  // use a real translated value when the dictionary actually has one.
  const pick = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };
  return {
    title: pick("checkout.title", "تکمیل سفارش"),
    orderNumber: pick("checkout.orderNumber", "شماره سفارش"),
    date: pick("checkout.date", "تاریخ سفارش"),
    orderStatus: pick("admin.status", "وضعیت"),
    paymentStatus: pick("checkout.paymentStatus", "وضعیت پرداخت"),
    customer: pick("checkout.fullName", "نام و نام خانوادگی"),
    phone: pick("checkout.phone", "شماره موبایل"),
    email: pick("checkout.email", "ایمیل"),
    province: pick("checkout.province", "استان"),
    city: pick("checkout.city", "شهر"),
    address: pick("checkout.address", "آدرس"),
    postalCode: pick("checkout.postalCode", "کد پستی"),
    notes: pick("checkout.notes", "توضیحات"),
    product: pick("cart.product", "محصول"),
    productName: pick("pdf.productName", "نام محصول"),
    productCode: pick("product.productCode", "کد محصول"),
    variation: pick("product.variation", "انتخاب گزینه"),
    colorLabel: pick("pdf.colorLabel", "رنگ"),
    quantity: pick("cart.quantity", "تعداد"),
    packQuantity: pick("pdf.perPackage", "تعداد در بسته"),
    selectedQuantity: pick("pdf.selectedQty", "تعداد انتخابی"),
    totalQuantity: pick("pdf.totalQty", "جمع کل تعداد کالا"),
    price: pick("cart.price", "قیمت واحد"),
    lineTotal: pick("pdf.lineTotalLabel", "جمع کل"),
    total: pick("checkout.grandTotal", "جمع کل"),
  };
}

/**
 * Package quantity for a stored order line: the stored snapshot wins; the
 * current catalog is only a fallback (product code → product → variation sku)
 * so historical orders still resolve when the backend does not persist it.
 */
export function resolveItemPackQuantity(item: OrderItemPayload): number | undefined {
  const stored = Number(item.packQuantity);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const product = getProductById(String(item.productId || item.productCode || ""));
  if (!product) return undefined;
  const variation = (product.variations ?? []).find((entry) => entry.sku === item.sku || entry.id === item.sku);
  const pack = variation?.packQuantity ?? product.packQuantity;
  return Number(pack) > 0 ? Number(pack) : undefined;
}

export interface StoredOrderPdfExtra {
  /** Human-readable localized date (e.g. Persian calendar). */
  dateLabel?: string;
  /** Localized order status text, e.g. t(`status.delivered`). */
  orderStatusLabel?: string;
  /** Localized payment status text, e.g. t(`payment.unpaid`). */
  paymentStatusLabel?: string;
}

export function storedOrderToPdfData(
  order: StoredOrder,
  dir: "rtl" | "ltr",
  currencyLabel: string,
  labels: OrderPdfData["labels"],
  extra?: StoredOrderPdfExtra,
): OrderPdfData {
  return {
    orderNumber: order.orderNumber,
    date: order.createdAt,
    dateLabel: extra?.dateLabel,
    orderStatus: extra?.orderStatusLabel,
    paymentStatus: extra?.paymentStatusLabel,
    customerName: order.customer.name,
    phone: order.customer.phone,
    email: order.customer.email || undefined,
    address: order.customer.address || undefined,
    province: order.customer.province || undefined,
    city: order.customer.city || undefined,
    postalCode: order.customer.postalCode || undefined,
    notes: order.customer.notes || undefined,
    items: order.items.map((item) => ({
      code: String(item.productCode || item.productId || ""),
      name: item.name || item.model,
      variation: item.variation || item.color,
      sku: item.sku,
      quantity: item.quantity,
      packQuantity: resolveItemPackQuantity(item),
      price: item.unitPrice ?? item.price,
    })),
    total: order.total,
    currencyLabel,
    dir,
    labels,
  };
}

export async function downloadStoredOrderPdf(
  order: StoredOrder,
  dir: "rtl" | "ltr",
  currencyLabel: string,
  labels: OrderPdfData["labels"],
  extra?: StoredOrderPdfExtra,
) {
  const blob = await generateOrderPdf(storedOrderToPdfData(order, dir, currencyLabel, labels, extra));
  const filename = order.document?.filename || `${order.orderNumber}.pdf`;
  downloadBlob(blob, filename);
  return blob;
}

export async function viewStoredOrderPdf(
  order: StoredOrder,
  dir: "rtl" | "ltr",
  currencyLabel: string,
  labels: OrderPdfData["labels"],
  extra?: StoredOrderPdfExtra,
) {
  const blob = await generateOrderPdf(storedOrderToPdfData(order, dir, currencyLabel, labels, extra));
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return blob;
}
