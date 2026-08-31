import { generateOrderPdf, downloadBlob, type OrderPdfData } from "./pdf";
import type { StoredOrder } from "./ordersApi";

export function orderPdfLabels(t: (key: string, vars?: Record<string, string>) => string): OrderPdfData["labels"] {
  return {
    title: t("checkout.title"),
    orderNumber: t("checkout.orderNumber"),
    date: t("checkout.date"),
    customer: t("checkout.fullName"),
    phone: t("checkout.phone"),
    email: t("checkout.email"),
    notes: t("checkout.notes"),
    product: t("cart.product"),
    variation: t("product.variation"),
    quantity: t("cart.quantity"),
    price: t("cart.price"),
    lineTotal: t("cart.total"),
    total: t("cart.total"),
  };
}

export function storedOrderToPdfData(
  order: StoredOrder,
  dir: "rtl" | "ltr",
  currencyLabel: string,
  labels: OrderPdfData["labels"],
): OrderPdfData {
  const address = [order.customer.province, order.customer.city, order.customer.address, order.customer.postalCode]
    .filter(Boolean)
    .join("، ");
  return {
    orderNumber: order.orderNumber,
    date: order.createdAt,
    customerName: order.customer.name,
    phone: order.customer.phone,
    email: order.customer.email || undefined,
    address: address || undefined,
    notes: order.customer.notes || undefined,
    items: order.items.map((item) => ({
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
) {
  const blob = await generateOrderPdf(storedOrderToPdfData(order, dir, currencyLabel, labels));
  const filename = order.document?.filename || `${order.orderNumber}.pdf`;
  downloadBlob(blob, filename);
  return blob;
}

export async function viewStoredOrderPdf(
  order: StoredOrder,
  dir: "rtl" | "ltr",
  currencyLabel: string,
  labels: OrderPdfData["labels"],
) {
  const blob = await generateOrderPdf(storedOrderToPdfData(order, dir, currencyLabel, labels));
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return blob;
}
