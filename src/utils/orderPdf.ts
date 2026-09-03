import { generateOrderPdf, downloadBlob, type OrderPdfData } from "./pdf";
import type { StoredOrder } from "./ordersApi";

export function orderPdfLabels(t: (key: string, vars?: Record<string, string>) => string): OrderPdfData["labels"] {
  return {
    title: t("checkout.title"),
    orderNumber: t("checkout.orderNumber"),
    date: t("checkout.date"),
    orderStatus: t("admin.status"),
    paymentStatus: t("checkout.paymentStatus"),
    customer: t("checkout.fullName"),
    phone: t("checkout.phone"),
    email: t("checkout.email"),
    province: t("checkout.province"),
    city: t("checkout.city"),
    address: t("checkout.address"),
    postalCode: t("checkout.postalCode"),
    notes: t("checkout.notes"),
    product: t("cart.product"),
    productCode: t("product.productCode"),
    variation: t("product.variation"),
    quantity: t("cart.quantity"),
    price: t("cart.price"),
    lineTotal: t("cart.total"),
    total: t("cart.total"),
  };
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
