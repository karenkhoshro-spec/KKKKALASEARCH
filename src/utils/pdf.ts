import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface OrderPdfItem {
  name: string;
  productCode?: string;
  sku?: string;
  model?: string;
  variation?: string;
  color?: string;
  quantity: number;
  price: number;
}

export interface OrderPdfData {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  status?: string;
  items: OrderPdfItem[];
  total: number;
  currencyLabel: string;
  dir: "rtl" | "ltr";
  labels: {
    title: string;
    orderNumber: string;
    date: string;
    customer: string;
    phone: string;
    address: string;
    notes: string;
    status: string;
    product: string;
    productCode: string;
    sku: string;
    model: string;
    color: string;
    variation: string;
    quantity: string;
    price: string;
    lineTotal: string;
    total: string;
  };
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Renders a printable, real invoice document to an offscreen node and
 * rasterizes it into a genuine multi-page-safe PDF file using html2canvas +
 * jsPDF. This guarantees correct Persian/Arabic text rendering (browsers
 * render the shaping correctly; jsPDF's native text API does not).
 * The PDF is generated from the ORDER DATA of one specific order.
 */
export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const container = document.createElement("div");
  container.setAttribute("dir", data.dir);
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = "860px";
  container.style.padding = "36px";
  container.style.background = "#ffffff";
  container.style.color = "#161022";
  container.style.fontFamily = "'Vazirmatn', 'Inter', sans-serif";

  const rows = data.items
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f7f4ff" : "#ffffff"};">
        <td style="padding:9px 10px;border:1px solid #e4defa;text-align:center;">${idx + 1}</td>
        <td style="padding:9px 10px;border:1px solid #e4defa;">
          <div style="font-weight:700;">${esc(item.name)}</div>
          <div style="font-size:11px;color:#6b6180;direction:ltr;text-align:${data.dir === "rtl" ? "right" : "left"};">
            ${item.productCode ? `${esc(data.labels.productCode)}: ${esc(item.productCode)}` : ""}
            ${item.sku ? ` · SKU: ${esc(item.sku)}` : ""}
            ${item.model ? ` · ${esc(data.labels.model)}: ${esc(item.model)}` : ""}
          </div>
        </td>
        <td style="padding:9px 10px;border:1px solid #e4defa;font-size:12px;">
          ${
            item.variation || item.color
              ? `${item.variation ? esc(item.variation) : ""}${
                  item.color
                    ? ` <span style="display:inline-block;width:10px;height:10px;border-radius:99px;border:1px solid #cfc4e8;background:${esc(item.color)};vertical-align:middle;"></span>`
                    : ""
                }`
              : "-"
          }
        </td>
        <td style="padding:9px 10px;border:1px solid #e4defa;text-align:center;">${item.quantity}</td>
        <td style="padding:9px 10px;border:1px solid #e4defa;text-align:center;">${formatNumber(item.price)}</td>
        <td style="padding:9px 10px;border:1px solid #e4defa;text-align:center;font-weight:700;">${formatNumber(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <div style="border-bottom:3px solid #8b5cf6;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:24px;font-weight:800;color:#6d28d9;">KALA SEARCH</div>
        <div style="font-size:13px;color:#6b6180;">${esc(data.labels.title)}</div>
      </div>
      <div style="text-align:${data.dir === "rtl" ? "left" : "right"};font-size:13px;color:#40364f;">
        <div><b>${esc(data.labels.orderNumber)}:</b> ${esc(data.orderNumber)}</div>
        <div><b>${esc(data.labels.date)}:</b> ${esc(data.date)}</div>
        ${data.status ? `<div><b>${esc(data.labels.status)}:</b> ${esc(data.status)}</div>` : ""}
      </div>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:20px;font-size:13px;">
      <div style="flex:1;background:#f7f4ff;border-radius:12px;padding:12px 14px;">
        <div><b>${esc(data.labels.customer)}:</b> ${esc(data.customerName)}</div>
        <div style="margin-top:5px;direction:ltr;text-align:${data.dir === "rtl" ? "right" : "left"};"><b>${esc(data.labels.phone)}:</b> ${esc(data.phone)}</div>
      </div>
      <div style="flex:1.4;background:#f7f4ff;border-radius:12px;padding:12px 14px;">
        ${
          data.address
            ? `<div><b>${esc(data.labels.address)}:</b> ${esc(data.address)}</div>`
            : `<div style="color:#928aab;">${esc(data.labels.address)}: —</div>`
        }
        ${
          data.notes
            ? `<div style="margin-top:5px;"><b>${esc(data.labels.notes)}:</b> ${esc(data.notes)}</div>`
            : ""
        }
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#8b5cf6;color:#fff;">
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">#</th>
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">${esc(data.labels.product)}</th>
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">${esc(data.labels.variation)}</th>
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">${esc(data.labels.quantity)}</th>
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">${esc(data.labels.price)}</th>
          <th style="padding:9px 10px;border:1px solid #8b5cf6;">${esc(data.labels.lineTotal)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:18px;">
      <div style="background:#6d28d9;color:#fff;border-radius:12px;padding:14px 24px;font-size:16px;font-weight:700;">
        ${esc(data.labels.total)}: ${formatNumber(data.total)} ${esc(data.currencyLabel)}
      </div>
    </div>
    <div style="margin-top:28px;font-size:11px;color:#928aab;text-align:center;">Kala Search · ${esc(data.orderNumber)} · ${esc(data.date)}</div>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
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
