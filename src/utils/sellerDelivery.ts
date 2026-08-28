import { SELLER_DELIVERY_ENDPOINT } from "../config";

export interface SellerDeliveryResult {
  sent: boolean;
  reason: "not_configured" | "network_error" | "success";
}

/**
 * Attempts to deliver the generated order PDF to the seller.
 *
 * IMPORTANT: This app never fakes a successful delivery. If
 * `SELLER_DELIVERY_ENDPOINT` has not been configured (see src/config.ts),
 * this function returns `{ sent: false, reason: "not_configured" }` and the
 * UI must be transparent with the customer/seller about that instead of
 * pretending the message was delivered.
 *
 * Once a real backend endpoint (serverless function, WhatsApp Business API
 * relay, Telegram bot webhook, email microservice, etc.) is available, set
 * SELLER_DELIVERY_ENDPOINT and this function will POST the PDF + order
 * metadata to it automatically — no other code changes required.
 */
export async function deliverOrderToSeller(pdfBlob: Blob, orderMeta: Record<string, unknown>): Promise<SellerDeliveryResult> {
  if (!SELLER_DELIVERY_ENDPOINT) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const formData = new FormData();
    formData.append("order", JSON.stringify(orderMeta));
    formData.append("file", pdfBlob, `order-${orderMeta.orderNumber ?? "unknown"}.pdf`);

    const res = await fetch(SELLER_DELIVERY_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return { sent: false, reason: "network_error" };
    return { sent: true, reason: "success" };
  } catch {
    return { sent: false, reason: "network_error" };
  }
}
