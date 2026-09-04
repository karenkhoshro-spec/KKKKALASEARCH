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
    /** Column title for the product-name column (defaults to `product`). */
    productName?: string;
    productCode?: string;
    variation: string;
    /** Column title for the color/variation column (defaults to `variation`). */
    colorLabel?: string;
    sku?: string;
    quantity: string;
    packQuantity?: string;
    /** "تعداد انتخابی" — the quantity the customer picked. */
    selectedQuantity?: string;
    /** "جمع کل تعداد کالا" — selected quantity × units per package. */
    totalQuantity?: string;
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

/** Brand block: the real Orderx logo when available, otherwise a clean
 *  black "Orderx" wordmark. Nothing else is printed around the brand. */
function brandBlock(logoDataUrl: string | undefined): string {
  const logo = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Orderx" style="height:46px;max-width:260px;object-fit:contain;display:inline-block;" />`
    : `<div style="font-size:26px;font-weight:900;letter-spacing:3px;color:#000000;line-height:1.15;">Orderx</div>`;
  return `<div style="text-align:center;">${logo}</div>`;
}

/**
 * Builds the printable proforma invoice HTML. Every text block wraps
 * (`overflow-wrap:anywhere`), rows grow vertically, and nothing depends on
 * absolute positions — so nothing can fall outside the page.
 *
 * @param data          order data
 * @param pageIndicator optional "page x / y" note (kept for compat)
 * @param brandLogo     optional data-URL of the Orderx logo; when omitted a
 *                      clean "Orderx" wordmark is printed instead.
 */
export function buildInvoiceHtml(data: OrderPdfData, pageIndicator?: string, brandLogo?: string): string {
  const rtl = data.dir === "rtl";
  const align = rtl ? "right" : "left";
  const counterAlign = rtl ? "left" : "right";

  const productCol = data.labels.productName || data.labels.product || "محصول";
  const colorCol = data.labels.colorLabel || data.labels.variation || "رنگ";

  const rows = data.items
    .map(
      (item, idx) => {
        const pack = Number(item.packQuantity);
        const packShown = Number.isFinite(pack) && pack > 0;
        const qty = item.quantity;
        return `
      <tr style="background:${idx % 2 === 0 ? "#f9f6ff" : "#ffffff"};">
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;font-weight:bold;">${idx + 1}</td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:${align};overflow-wrap:anywhere;line-height:1.7;">
          <div style="font-weight:bold;color:#1e1b4b;">${escapeHtml(item.name)}</div>
          ${item.code ? `<div dir="ltr" style="text-align:${counterAlign};font-size:10.5px;color:#7c3aed;font-family:monospace;margin-top:2px;">${escapeHtml(data.labels.productCode || "کد")}: ${escapeHtml(item.code)}</div>` : ""}
          ${item.spec ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(item.spec)}</div>` : ""}
        </td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;overflow-wrap:anywhere;">
          <div style="color:#1e1b4b;">${item.variation || item.color ? escapeHtml(item.variation || item.color) : "-"}</div>
          ${item.sku ? `<div dir="ltr" style="font-size:11px;color:#7c3aed;font-family:monospace;margin-top:2px;">${escapeHtml(item.sku)}</div>` : ""}
        </td>
        <td style="padding:8px 6px;border:1px solid #e4defa;text-align:center;">
          <div style="font-weight:bold;color:#1e1b4b;">${qty}</div>
        </td>
        <td style="padding:8px 6px;border:1px solid #e4defa;text-align:center;">
          ${
            packShown
              ? `<div style="font-weight:bold;color:#6d28d9;">${pack}</div>
                 <div style="font-size:10px;color:#64748b;margin-top:2px;line-height:1.6;">${escapeHtml(data.labels.totalQuantity || "جمع کل تعداد کالا")}: ${qty * pack}</div>`
              : "<div style=\"color:#94a3b8;\">-</div>"
          }
        </td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;white-space:nowrap;">${formatPrice(item.price, data.currencyLabel)}</td>
        <td style="padding:8px 10px;border:1px solid #e4defa;text-align:center;font-weight:bold;color:#7c3aed;white-space:nowrap;">
          ${formatPrice(item.price === undefined ? undefined : item.price * qty, data.currencyLabel)}
        </td>
      </tr>`;
      },
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
  if (pageIndicator) {
    metaLines.push(`<div style="margin-top:3px;color:#928aab;">${escapeHtml(pageIndicator)}</div>`);
  }

  const customerLines: string[] = [];
  customerLines.push(`<div><b>${escapeHtml(data.labels.customer)}:</b> ${escapeHtml(data.customerName)}</div>`);
  customerLines.push(`<div><b>${escapeHtml(data.labels.phone)}:</b> <span dir="ltr">${escapeHtml(data.phone)}</span></div>`);
  if (data.email) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.email || "ایمیل")}:</b> <span dir="ltr">${escapeHtml(data.email)}</span></div>`);
  }
  // استان (province) was intentionally removed from the PDF output — the
  // checkout form no longer collects it and legacy values are never printed.
  if (data.city) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.city || "شهر")}:</b> ${escapeHtml(data.city)}</div>`);
  }
  if (data.address) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.address || "آدرس")}:</b> ${escapeHtml(data.address)}</div>`);
  }
  if (data.postalCode) {
    customerLines.push(`<div><b>${escapeHtml(data.labels.postalCode || "کد پستی")}:</b> <span dir="ltr">${escapeHtml(data.postalCode)}</span></div>`);
  }

  const orderBoxLines: string[] = [];
  orderBoxLines.push(
    `<div style="font-size:13px;"><b>${escapeHtml(data.labels.orderNumber)}:</b> <span dir="ltr" style="font-family:monospace;font-weight:bold;color:#7c3aed;">${escapeHtml(data.orderNumber)}</span></div>`,
  );
  orderBoxLines.push(...metaLines);

  return `
    <div style="border-bottom:2.5px solid #7c3aed;padding-bottom:13px;margin-bottom:14px;">
      ${brandBlock(brandLogo)}
    </div>
    <div style="display:flex;gap:12px;margin-bottom:14px;font-size:12px;flex-wrap:wrap;">
      <div style="flex:1.2;min-width:280px;background:#f7f4ff;border:1px solid #e4defa;border-radius:12px;padding:12px 14px;line-height:1.95;overflow-wrap:anywhere;text-align:${align};">
        <div style="font-weight:800;color:#5b21b6;margin-bottom:4px;">${escapeHtml(data.labels.customer)}</div>
        ${customerLines.join("")}
      </div>
      <div style="flex:1;min-width:230px;background:#faf7ff;border:1px solid #e9e2fb;border-radius:12px;padding:12px 14px;line-height:1.9;overflow-wrap:anywhere;text-align:${align};">
        ${orderBoxLines.join("")}
        ${
          data.notes
            ? `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #ddd6fe;"><b>${escapeHtml(data.labels.notes)}:</b> ${escapeHtml(data.notes)}</div>`
            : ""
        }
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">
      <colgroup>
        <col style="width:30px" />
        <col />
        <col style="width:14%" />
        <col style="width:9%" />
        <col style="width:13%" />
        <col style="width:14%" />
        <col style="width:14%" />
      </colgroup>
      <thead>
        <tr style="background:#7c3aed;color:#fff;">
          <th style="padding:8px;border:1px solid #7c3aed;">#</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(productCol)}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(colorCol)}</th>
          <th style="padding:8px;border:1px solid #7c3aed;">${escapeHtml(data.labels.quantity)}</th>
          <th style="padding:8px;border:1px solid #7c3aed;">${escapeHtml(data.labels.packQuantity || "تعداد در بسته")}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.price)}</th>
          <th style="padding:8px 10px;border:1px solid #7c3aed;">${escapeHtml(data.labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:linear-gradient(90deg,#f5efff,#ede4fe);">
          <td colspan="7" style="padding:0;border:1.5px solid #7c3aed;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;">
              <div style="font-size:14px;font-weight:900;color:#4c1d95;">${escapeHtml(data.labels.total)}</div>
              <div style="font-size:15px;font-weight:900;color:#7c3aed;white-space:nowrap;">${data.total.toLocaleString("en-US")} ${escapeHtml(data.currencyLabel)}</div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>`;
}
