/**
 * KalaSearch — printable order-invoice HTML.
 *
 * Pure module (no DOM / no jsPDF dependency) so the layout can be unit-tested
 * in Node. The real rasterizer (pdf.ts) renders this with html2canvas and
 * slices it into multi-page A4.
 *
 * Layout rules:
 * - A4 @96dpi CSS pixel page: 794x1123, 30px margins.
 * - Every text block wraps (`overflow-wrap:anywhere`), rows grow vertically and
 *   nothing depends on absolute positions — nothing can fall outside a page.
 * - The caller slices pages at white gaps, so a row is never cut in half and
 *   long orders automatically become multi-page.
 */

export interface OrderPdfItem {
  code?: string;
  name: string;
  variation?: string;
  color?: string;
  sku?: string;
  quantity: number;
  packQuantity?: number;
  spec?: string;
  price?: number;
}

export interface OrderPdfData {
  orderNumber: string;
  date: string;
  /** Human-readable (localized) date — preferred over raw `date`. */
  dateLabel?: string;
  /** Localized order status text, e.g. "تحویل شده". */
  orderStatus?: string;
  /** Localized payment status text, e.g. "پرداخت نشده". */
  paymentStatus?: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  items: OrderPdfItem[];
  total: number;
  currencyLabel: string;
  dir: "rtl" | "ltr";
  labels: {
    title: string;
    orderNumber: string;
    date: string;
    orderStatus?: string;
    paymentStatus?: string;
    customer: string;
    phone: string;
    email?: string;
    address?: string;
    province?: string;
    city?: string;
    postalCode?: string;
    notes: string;
    product: string;
    productCode?: string;
    variation: string;
    sku?: string;
    quantity: string;
    packQuantity?: string;
    price: string;
    lineTotal: string;
    total: string;
    spec?: string;
  };
}

function formatPrice(p: number | undefined, currency: string) {
  if (p === undefined) return "استعلام / نامشخص";
  return `${p.toLocaleString("en-US")} ${currency}`;
}

function escapeHtml(value: string | undefined | null): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A4 @96dpi CSS pixels */
export const PDF_PAGE_W = 794;
export const PDF_PAGE_H = 1123;
export const PDF_MARGIN = 30;
export const PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2;

/**
 * Builds the printable proforma invoice HTML. Every text block wraps
 * (`overflow-wrap:anywhere`), rows grow vertically, and nothing depends on
 * absolute positions — so nothing can fall outside the page.
 */
export function buildInvoiceHtml(data: OrderPdfData, pageIndicator?: string): string {
  const rtl = data.dir === "rtl";
  const align = rtl ? "right" : "left";
  const counterAlign = rtl ? "left" : "right";

  const rows = data.items
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f9f6ff" : "#ffffff"};">
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;font-weight:bold;">${idx + 1}</td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:${align};overflow-wrap:anywhere;line-height:1.7;">
          <div style="font-weight:bold;color:#1e1b4b;">${escapeHtml(item.name)}</div>
          ${item.code ? `<div dir="ltr" style="text-align:${counterAlign};font-size:10.5px;color:#7c3aed;font-family:monospace;margin-top:2px;">${escapeHtml(data.labels.productCode || "کد")}: ${escapeHtml(item.code)}</div>` : ""}
          ${item.spec ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(item.spec)}</div>` : ""}
        </td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;overflow-wrap:anywhere;">
          <div>${item.variation ? escapeHtml(item.variation) : "-"}</div>
          ${item.sku ? `<div dir="ltr" style="font-size:11px;color:#7c3aed;font-family:monospace;margin-top:2px;">${escapeHtml(item.sku)}</div>` : ""}
        </td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;font-weight:bold;">
          ${item.quantity}
          ${item.packQuantity ? `<div style="font-size:10px;color:#64748b;">(بسته: ${item.packQuantity})</div>` : ""}
        </td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;white-space:nowrap;">${formatPrice(item.price, data.currencyLabel)}</td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;font-weight:bold;color:#7c3aed;white-space:nowrap;">
          ${formatPrice(item.price === undefined ? undefined : item.price * item.quantity, data.currencyLabel)}
        </td>
      </tr>`,
    )
    .join("");

  const metaLines: string[] = [];
  metaLines.push(
    `<div style="margin-top:3px;"><b>${escapeHtml(data.labels.date)}:</b> ${escapeHtml(data.dateLabel || data.date)}</div>`,
  );
  if (data.orderStatus) {
    metaLines.push(
      `<div style="margin-top:3px;"><b>${escapeHtml(data.labels.orderStatus || "وضعیت")}:</b> ${escapeHtml(data.orderStatus)}</div>`,
    );
  }
  if (data.paymentStatus) {
    metaLines.push(
      `<div style="margin-top:3px;"><b>${escapeHtml(data.labels.paymentStatus || "وضعیت پرداخت")}:</b> ${escapeHtml(data.paymentStatus)}</div>`,
    );
  }

  const customerLines: string[] = [];
  customerLines.push(`<div><b>${escapeHtml(data.labels.customer)}:</b> ${escapeHtml(data.customerName)}</div>`);
  customerLines.push(`<div><b>${escapeHtml(data.labels.phone)}:</b> <span dir="ltr">${escapeHtml(data.phone)}</span></div>`);
  if (data.email) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.email || "ایمیل")}:</b> <span dir="ltr">${escapeHtml(data.email)}</span></div>`);
  }
  if (data.province) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.province || "استان")}:</b> ${escapeHtml(data.province)}</div>`);
  }
  if (data.city) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.city || "شهر")}:</b> ${escapeHtml(data.city)}</div>`);
  }
  if (data.postalCode) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.postalCode || "کد پستی")}:</b> <span dir="ltr">${escapeHtml(data.postalCode)}</span></div>`);
  }
  if (data.address) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.address || "آدرس")}:</b> ${escapeHtml(data.address)}</div>`);
  }

  return `
    <div style="border-bottom:2.5px solid #7c3aed;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div style="text-align:${align};">
        <div style="font-size:22px;font-weight:900;letter-spacing:1px;color:#6d28d9;">KALASEARCH</div>
        <div style="font-size:12px;color:#6b6180;font-weight:600;margin-top:2px;">${escapeHtml(data.labels.title)}</div>
      </div>
      <div style="text-align:${counterAlign};font-size:12px;color:#40364f;">
        <div><b>${escapeHtml(data.labels.orderNumber)}:</b> <span dir="ltr" style="font-family:monospace;font-weight:bold;color:#7c3aed;">${escapeHtml(data.orderNumber)}</span></div>
        ${metaLines.join("")}
        ${pageIndicator ? `<div style="margin-top:3px;color:#928aab;">${escapeHtml(pageIndicator)}</div>` : ""}
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;font-size:12px;flex-wrap:wrap;">
      <div style="flex:1;min-width:300px;background:#f7f4ff;border:1px solid #e4defa;border-radius:12px;padding:12px 14px;line-height:1.9;overflow-wrap:anywhere;text-align:${align};">
        ${customerLines.join("")}
      </div>
      ${
        data.notes
          ? `<div style="flex:1;min-width:220px;background:#fdf8f2;border:1px solid #f3e3cd;border-radius:12px;padding:12px 14px;line-height:1.9;overflow-wrap:anywhere;text-align:${align};">
              <div><b>${escapeHtml(data.labels.notes)}:</b> ${escapeHtml(data.notes)}</div>
            </div>`
          : ""
      }
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">
      <colgroup>
        <col style="width:34px" />
        <col />
        <col style="width:21%" />
        <col style="width:58px" />
        <col style="width:17%" />
        <col style="width:17%" />
      </colgroup>
      <thead>
        <tr style="background:#7c3aed;color:#fff;">
          <th style="padding:8px;border:1px solid #7c3aed;">#</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.product)}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.variation)} / ${escapeHtml(data.labels.sku || "SKU")}</th>
          <th style="padding:8px;border:1px solid #7c3aed;">${escapeHtml(data.labels.quantity)}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.price)}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <div style="background:linear-gradient(90deg, #ea580c, #7c3aed);color:#fff;border-radius:12px;padding:12px 22px;font-size:14px;font-weight:800;">
        ${escapeHtml(data.labels.total)}: ${data.total.toLocaleString("en-US")} ${escapeHtml(data.currencyLabel)}
      </div>
    </div>
    <div style="margin-top:18px;font-size:10px;color:#928aab;text-align:center;">
      کالاسرچ · درگاه هوشمند جستجو و انتخاب کالا · ${escapeHtml(data.dateLabel || data.date)}
    </div>`;
}
