import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface OrderPdfItem {
  name: string;
  variation?: string;
  colorName?: string;
  sku?: string;
  quantity: number;
  packQuantity?: number;
  /** Only ever a verified price from the inventory data — never invented. */
  price?: number;
  technicalSpec?: string;
  url?: string;
}

export interface OrderPdfCustomer {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface OrderPdfData {
  orderNumber: string;
  date: string;
  time?: string;
  customer: OrderPdfCustomer;
  items: OrderPdfItem[];
  total: number;
  currencyLabel: string;
  dir: "rtl" | "ltr";
  labels: {
    title: string;
    orderNumber: string;
    date: string;
    time: string;
    customer: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    product: string;
    variation: string;
    color: string;
    sku: string;
    quantity: string;
    packQuantity: string;
    price: string;
    spec: string;
    lineTotal: string;
    total: string;
    priceUnknown: string;
    footerNote: string;
  };
}

const formatNumber = (n: number) => n.toLocaleString("en-US");

function escapeHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PURPLE_DARK = "#4c1d95";
const PURPLE = "#6d28d9";
const PURPLE_TINT = "#f4effc";
const ORANGE = "#ea580c";
const GREEN = "#15803d";
const INK = "#221733";
const MUTED = "#6c5f85";
const LINE = "#e4defa";

/** KalaSearch brand mark rendered as plain inline SVG (no external asset). */
function logoMark(color: string): string {
  return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="1.6" fill="${color}" stroke="none"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.3"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(120 12 12)"/>
  </svg>`;
}

function metaRow(label: string, value: string): string {
  return `<div style="display:flex;gap:6px;align-items:baseline;padding:2.5px 0;"><span style="color:${MUTED};font-weight:700;white-space:nowrap;">${escapeHtml(label)}:</span><span dir="auto" style="color:${INK};font-weight:700;overflow-wrap:anywhere;">${escapeHtml(value)}</span></div>`;
}

function buildItemRows(data: OrderPdfData): string {
  return data.items
    .map((item, idx) => {
      const priceVerified = item.price !== undefined && Number.isFinite(item.price) && item.price > 0;
      const priceText = priceVerified
        ? `<b>${formatNumber(item.price as number)}</b> ${escapeHtml(data.currencyLabel)}`
        : `<span style="color:${ORANGE};font-weight:800;">${escapeHtml(data.labels.priceUnknown)}</span>`;
      const lineText = priceVerified
        ? `<b>${formatNumber((item.price as number) * item.quantity)}</b>`
        : escapeHtml(data.labels.priceUnknown);
      const extras: string[] = [];
      if (item.variation) extras.push(`${escapeHtml(data.labels.variation)}: ${escapeHtml(item.variation)}`);
      if (item.colorName) extras.push(`${escapeHtml(data.labels.color)}: <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#7c3aed;margin-inline-end:4px;"></span>${escapeHtml(item.colorName)}`);
      if (item.sku) extras.push(`${escapeHtml(data.labels.sku)}: <span dir="ltr">${escapeHtml(item.sku)}</span>`);
      if (item.packQuantity !== undefined) extras.push(`${escapeHtml(data.labels.packQuantity)}: <b dir="ltr">${formatNumber(item.packQuantity)}</b>`);
      if (item.technicalSpec) extras.push(`${escapeHtml(data.labels.spec)}: ${escapeHtml(item.technicalSpec)}`);
      if (item.url) extras.push(`<span dir="ltr" style="color:${MUTED};font-size:10px;">${escapeHtml(item.url)}</span>`);
      return `
      <tr style="background:${idx % 2 === 0 ? PURPLE_TINT : "#ffffff"};">
        <td style="padding:8px 10px;border:1px solid ${LINE};text-align:center;color:${MUTED};font-weight:800;width:26px;">${idx + 1}</td>
        <td style="padding:8px 10px;border:1px solid ${LINE};">
          <div style="font-weight:800;color:${INK};font-size:12.5px;">${escapeHtml(item.name)}</div>
          ${extras.length ? `<div style="margin-top:3px;font-size:10.5px;color:${MUTED};display:flex;flex-wrap:wrap;gap:4px 14px;">${extras.map((e) => `<span dir="auto">${e}</span>`).join("")}</div>` : ""}
        </td>
        <td style="padding:8px 10px;border:1px solid ${LINE};text-align:center;font-weight:800;" dir="ltr">${item.quantity}</td>
        <td style="padding:8px 10px;border:1px solid ${LINE};text-align:center;font-size:11.5px;font-weight:700;" dir="auto">${priceText}</td>
        <td style="padding:8px 10px;border:1px solid ${LINE};text-align:center;font-size:11.5px;font-weight:700;" dir="auto">${lineText}</td>
      </tr>`;
    })
    .join("");
}

function buildDocument(data: OrderPdfData): string {
  const c = data.customer;
  const alignEnd = data.dir === "rtl" ? "left" : "right";

  const header = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;background:linear-gradient(100deg, ${PURPLE_DARK} 0%, ${PURPLE} 78%);border-radius:16px;padding:16px 20px;color:#fff;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${logoMark("#ffffff")}
        <div>
          <div style="font-size:22px;font-weight:900;letter-spacing:-0.02em;">کالا سرچ</div>
          <div style="font-size:11px;opacity:0.85;font-weight:600;">KALA SEARCH · ${escapeHtml(data.labels.title)}</div>
        </div>
      </div>
      <div style="text-align:${alignEnd};font-size:12px;line-height:1.7;">
        <div><span style="opacity:0.85;">${escapeHtml(data.labels.orderNumber)}:</span> <b dir="ltr">${escapeHtml(data.orderNumber)}</b></div>
        <div><span style="opacity:0.85;">${escapeHtml(data.labels.date)}:</span> <b>${escapeHtml(data.date)}</b>${data.time ? ` · <span style="opacity:0.85;">${escapeHtml(data.labels.time)}:</span> <b dir="ltr">${escapeHtml(data.time)}</b>` : ""}</div>
      </div>
    </div>
    <div style="height:3px;border-radius:3px;margin-top:6px;background:linear-gradient(90deg, ${GREEN} 0%, ${ORANGE} 55%, ${PURPLE} 100%);opacity:0.85;"></div>`;

  const customerBox = `
    <div style="margin-top:14px;border:1px solid ${LINE};border-radius:14px;padding:12px 16px;background:${PURPLE_TINT};">
      <div style="font-size:12px;font-weight:900;color:${PURPLE};margin-bottom:6px;">${escapeHtml(data.labels.customer)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;font-size:12px;">
        ${metaRow(data.labels.firstName, c.firstName)}
        ${metaRow(data.labels.lastName, c.lastName)}
        <div style="display:flex;gap:6px;align-items:baseline;padding:2.5px 0;"><span style="color:${MUTED};font-weight:700;white-space:nowrap;">${escapeHtml(data.labels.phone)}:</span><span dir="ltr" style="color:${INK};font-weight:800;">${escapeHtml(c.phone)}</span></div>
        ${c.email ? metaRow(data.labels.email, c.email) : ""}
      </div>
      <div style="margin-top:4px;border-top:1px dashed ${LINE};padding-top:6px;">${metaRow(data.labels.address, c.address)}</div>
      ${c.notes ? `<div style="border-top:1px dashed ${LINE};padding-top:6px;">${metaRow(data.labels.notes, c.notes)}</div>` : ""}
    </div>`;

  const table = `
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:14px;">
      <thead>
        <tr style="background:${PURPLE};color:#fff;">
          <th style="padding:8px 10px;border:1px solid ${PURPLE};width:26px;">#</th>
          <th style="padding:8px 10px;border:1px solid ${PURPLE};text-align:${data.dir === "rtl" ? "right" : "left"};">${escapeHtml(data.labels.product)}</th>
          <th style="padding:8px 10px;border:1px solid ${PURPLE};width:64px;">${escapeHtml(data.labels.quantity)}</th>
          <th style="padding:8px 10px;border:1px solid ${PURPLE};width:120px;">${escapeHtml(data.labels.price)}</th>
          <th style="padding:8px 10px;border:1px solid ${PURPLE};width:110px;">${escapeHtml(data.labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>${buildItemRows(data)}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:12px;">
      <div style="background:${PURPLE_DARK};color:#fff;border-radius:12px;padding:10px 22px;font-size:15px;font-weight:800;">
        ${escapeHtml(data.labels.total)}: <span dir="ltr">${formatNumber(data.total)}</span> ${escapeHtml(data.currencyLabel)}
      </div>
    </div>`;

  const footer = `
    <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${LINE};padding-top:10px;font-size:10px;color:${MUTED};">
      <span>کالا سرچ · Kala Search</span>
      <span>${escapeHtml(data.labels.footerNote)} · ${escapeHtml(data.date)}</span>
    </div>`;

  return `${header}${customerBox}${table}${footer}`;
}

/**
 * Renders a clean, compact, professional order document offscreen and
 * rasterizes it into a paginated A4 PDF (html2canvas + jsPDF). Browser
 * shaping guarantees correct Persian/Arabic text rendering, and A4 slicing
 * keeps long orders page-safe. No debug/report content ever reaches here:
 * only verified customer + catalog data.
 */
export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const container = document.createElement("div");
  container.setAttribute("dir", data.dir);
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = "780px";
  container.style.padding = "28px";
  container.style.background = "#ffffff";
  container.style.color = INK;
  container.style.fontFamily = "'Vazirmatn', 'Inter', sans-serif";
  container.innerHTML = buildDocument(data);

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", logging: false });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const pxPerMm = canvas.width / pageWidthMm;
    const sliceHeightPx = Math.floor(pageHeightMm * pxPerMm);

    let offset = 0;
    let pageIndex = 0;
    while (offset < canvas.height) {
      const sliceHeight = Math.min(sliceHeightPx, canvas.height - offset);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      }
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, pageWidthMm, sliceHeight / pxPerMm);
      offset += sliceHeight;
      pageIndex++;
    }
    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
