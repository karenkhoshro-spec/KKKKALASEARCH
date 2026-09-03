import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  buildInvoiceHtml,
  PDF_PAGE_W,
  PDF_PAGE_H,
  PDF_MARGIN,
  PDF_CONTENT_W,
  type OrderPdfData,
} from "./invoiceHtml";

export type { OrderPdfData, OrderPdfItem } from "./invoiceHtml";

/** A4 @96dpi CSS pixels (content area used by the rasterizer). */
export const INVOICE_PAGE_W = PDF_PAGE_W;
export const INVOICE_PAGE_H = PDF_PAGE_H;

function renderToCanvas(html: string, dir: "rtl" | "ltr"): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.setAttribute("dir", dir);
  container.style.cssText = [
    "position:fixed",
    "top:-10000px",
    "left:-10000px",
    `width:${PDF_CONTENT_W}px`,
    "background:#ffffff",
    "color:#161022",
    "font-family:'Vazirmatn','Inter',sans-serif",
    "font-size:13px",
    "box-sizing:border-box",
    "overflow-wrap:break-word",
  ].join(";");
  container.innerHTML = html;
  document.body.appendChild(container);
  return html2canvas(container, { scale: 2, backgroundColor: "#ffffff", logging: false }).finally(() => {
    document.body.removeChild(container);
  });
}

/**
 * Finds the highest y (< limit) where the rendered row is ~uniformly white —
 * i.e. a safe gap between table rows / sections — so a row is never sliced.
 */
function findRowBoundary(canvas: HTMLCanvasElement, from: number, limit: number): number | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const samples = 40;
  const step = Math.max(1, Math.floor(canvas.width / samples));
  const isWhiteGap = (y: number): boolean => {
    const row = ctx.getImageData(0, y, canvas.width, 1).data;
    let uniform = 0;
    let checked = 0;
    for (let x = 0; x < row.length; x += step * 4) {
      checked += 1;
      if (row[x] > 243 && row[x + 1] > 243 && row[x + 2] > 243) uniform += 1;
    }
    return uniform / checked >= 0.92;
  };
  const coarse = 4; // scan every 4 canvas px (2 CSS px)
  for (let y = limit; y > from + 160; y -= coarse) {
    if (isWhiteGap(y)) return y;
  }
  return null;
}

function sliceCanvas(source: HTMLCanvasElement, y: number, h: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = Math.max(1, Math.round(h));
  const ctx = out.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, Math.round(y), source.width, Math.round(h), 0, 0, source.width, Math.round(h));
  }
  return out;
}

/**
 * Renders a genuine multi-page A4 PDF using html2canvas + jsPDF.
 * - Fixed A4 page size with margins: content can never overflow the page.
 * - Page breaks are computed at white gaps (never mid-row) and the document
 *   becomes multi-page automatically when content is tall.
 * - Persian/Arabic shaping is correct because the browser rasterizes the text.
 */
export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const printableH = PDF_PAGE_H - PDF_MARGIN * 2;
  const scale = 2;
  const usableCanvasH = printableH * scale; // canvas-space height per page

  const first = await renderToCanvas(buildInvoiceHtml(data), data.dir);
  const fullH = first.height;

  // Compute slices: first page full, then fill pages up to white-gap boundaries.
  const slices: Array<{ y: number; h: number }> = [];
  let cursor = 0;
  while (cursor < fullH) {
    const remaining = fullH - cursor;
    if (remaining <= usableCanvasH) {
      slices.push({ y: cursor, h: remaining });
      break;
    }
    const boundary = findRowBoundary(first, cursor, cursor + usableCanvasH);
    const sliceH = boundary ? boundary - cursor : usableCanvasH;
    slices.push({ y: cursor, h: sliceH });
    cursor += sliceH;
  }

  const pageCount = slices.length;
  const pdf = new jsPDF({ unit: "px", format: [PDF_PAGE_W, PDF_PAGE_H], compress: true });

  for (let i = 0; i < pageCount; i += 1) {
    if (i > 0) pdf.addPage([PDF_PAGE_W, PDF_PAGE_H], "portrait");
    const slice = slices[i];
    const sliceCanvasEl = sliceCanvas(first, slice.y, slice.h);
    const drawW = PDF_PAGE_W - PDF_MARGIN * 2;
    const drawH = (sliceCanvasEl.height / sliceCanvasEl.width) * drawW;
    pdf.addImage(sliceCanvasEl.toDataURL("image/png"), "PNG", PDF_MARGIN, PDF_MARGIN, drawW, drawH, undefined, "FAST");

    // Footer: page x / y (drawn by jsPDF so it repeats on every page).
    pdf.setFontSize(9);
    pdf.setTextColor(150, 143, 172);
    pdf.text(`${i + 1} / ${pageCount}`, PDF_PAGE_W / 2, PDF_PAGE_H - 14, { align: "center" });

    if (i > 0) {
      // Continuation pages: compact header strip with order number.
      pdf.setFontSize(10);
      pdf.setTextColor(109, 40, 217);
      pdf.text(`KALASEARCH · ${data.orderNumber}`, data.dir === "rtl" ? PDF_PAGE_W - PDF_MARGIN : PDF_MARGIN, PDF_MARGIN - 10, {
        align: data.dir === "rtl" ? "right" : "left",
      });
    }
  }

  return pdf.output("blob");
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
