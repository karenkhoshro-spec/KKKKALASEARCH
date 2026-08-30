import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface OrderPdfItem {
  name: string;
  variation?: string;
  sku?: string;
  quantity: number;
  packQuantity?: number;
  spec?: string;
  price?: number;
}

export interface OrderPdfData {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
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
    email?: string;
    address?: string;
    notes: string;
    product: string;
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

/**
 * Renders a printable, real invoice document to an offscreen node and
 * rasterizes it into a genuine multi-page-safe PDF file using html2canvas +
 * jsPDF. This guarantees correct Persian/Arabic text rendering (browsers
 * render the shaping correctly; jsPDF's native text API does not).
 */
export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const container = document.createElement("div");
  container.setAttribute("dir", data.dir);
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = "780px";
  container.style.padding = "36px";
  container.style.background = "#ffffff";
  container.style.color = "#161022";
  container.style.fontFamily = "'Vazirmatn', 'Inter', sans-serif";

  const rows = data.items
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f9f6ff" : "#ffffff"};">
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;font-weight:bold;">${idx + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;">
          <div style="font-weight:bold;color:#1e1b4b;">${item.name}</div>
          ${item.spec ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${item.spec}</div>` : ""}
        </td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;">
          <div>${item.variation ?? "-"}</div>
          ${item.sku ? `<div style="font-size:11px;color:#7c3aed;font-family:monospace;margin-top:2px;">${item.sku}</div>` : ""}
        </td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;font-weight:bold;">
          ${item.quantity}
          ${item.packQuantity ? `<div style="font-size:10px;color:#64748b;">(بسته: ${item.packQuantity})</div>` : ""}
        </td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;">${formatPrice(item.price, data.currencyLabel)}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;font-weight:bold;color:#7c3aed;">
          ${formatPrice(item.price === undefined ? undefined : item.price * item.quantity, data.currencyLabel)}
        </td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:24px;font-weight:900;letter-spacing:1px;color:#6d28d9;">KALASEARCH</div>
        <div style="font-size:13px;color:#6b6180;font-weight:600;margin-top:3px;">${data.labels.title}</div>
      </div>
      <div style="text-align:${data.dir === "rtl" ? "left" : "right"};font-size:13px;color:#40364f;">
        <div><b>${data.labels.orderNumber}:</b> <span style="font-family:monospace;font-weight:bold;color:#7c3aed;">${data.orderNumber}</span></div>
        <div style="margin-top:4px;"><b>${data.labels.date}:</b> ${data.date}</div>
      </div>
    </div>
    <div style="display:flex;gap:18px;margin-bottom:20px;font-size:13px;">
      <div style="flex:1;background:#f7f4ff;border:1px solid #e4defa;border-radius:12px;padding:14px 16px;">
        <div><b>${data.labels.customer}:</b> ${data.customerName}</div>
        <div style="margin-top:6px;"><b>${data.labels.phone}:</b> <span dir="ltr">${data.phone}</span></div>
        ${data.email ? `<div style="margin-top:6px;"><b>ایمیل:</b> <span dir="ltr">${data.email}</span></div>` : ""}
      </div>
      ${
        data.address || data.notes
          ? `<div style="flex:1;background:#f7f4ff;border:1px solid #e4defa;border-radius:12px;padding:14px 16px;">
              ${data.address ? `<div><b>آدرس:</b> ${data.address}</div>` : ""}
              ${data.notes ? `<div style="margin-top:${data.address ? "6px" : "0"};"><b>${data.labels.notes}:</b> ${data.notes}</div>` : ""}
            </div>`
          : ""
      }
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#7c3aed;color:#fff;">
          <th style="padding:10px 8px;border:1px solid #7c3aed;width:35px;">#</th>
          <th style="padding:10px 12px;border:1px solid #7c3aed;">${data.labels.product}</th>
          <th style="padding:10px 12px;border:1px solid #7c3aed;">${data.labels.variation} / شناسه</th>
          <th style="padding:10px 8px;border:1px solid #7c3aed;width:70px;">${data.labels.quantity}</th>
          <th style="padding:10px 12px;border:1px solid #7c3aed;">${data.labels.price}</th>
          <th style="padding:10px 12px;border:1px solid #7c3aed;">${data.labels.lineTotal}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:18px;">
      <div style="background:linear-gradient(90deg, #ea580c, #7c3aed);color:#fff;border-radius:12px;padding:14px 24px;font-size:15px;font-weight:800;box-shadow:0 4px 12px rgba(124,58,237,0.25);">
        ${data.labels.total}: ${data.total.toLocaleString("en-US")} ${data.currencyLabel}
      </div>
    </div>
    <div style="margin-top:28px;font-size:11px;color:#928aab;text-align:center;">
      کالاسرچ · درگاه هوشمند جستجو و انتخاب کالا · ${data.date}
    </div>
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
