/**
 * ===================== INTEGRATION CONFIG =====================
 * These values are intentionally left empty/placeholder because no real
 * backend or confirmed destination has been provided for this project yet.
 * Fill them in when the real services are ready — the app is already wired
 * to use them everywhere they are needed.
 * ================================================================
 */

/**
 * Base URL of the Ashkan Plastic storefront.
 * When set, product pages will build a link automatically as
 * `${ASHKAN_BASE_URL}/<product-slug>` unless a product defines its own
 * `ashkanProductUrl` override.
 * Leave empty ("") until a verified, real domain is provided — the UI
 * will simply hide the link instead of showing a broken/fake one.
 */
export const ASHKAN_BASE_URL = "";

/**
 * Endpoint that should receive the generated order PDF / order payload so it
 * reaches the seller (e.g. a serverless function, WhatsApp Business API,
 * email relay, or Telegram bot webhook). This project ships a ready-to-use
 * service wrapper (see `src/utils/sellerDelivery.ts`) that will POST to this
 * URL. Until a real endpoint is configured, the app will NOT claim the order
 * was sent — it only generates and offers the PDF for manual download/send.
 */
export const SELLER_DELIVERY_ENDPOINT = "";

/** Seller contact number shown to the customer for manual follow-up. */
export const SELLER_CONTACT_PHONE = "";

/** Public, non-secret runtime configuration. Secrets must stay server-side. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL ?? "";
export const DATA_PROVIDER_MODE = import.meta.env.VITE_DATA_PROVIDER_MODE ?? "local-csv";
