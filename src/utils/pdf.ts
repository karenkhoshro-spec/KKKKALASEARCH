import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface OrderPdfItem {
  name: string;
  variation?: string;
  quantity: number;
  price?: number;
}

export interface OrderPdfData {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
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
    notes: string;
    product: string;
    variation: string;
    quantity: string;
    price: string;
    lineTotal: string;
    total: string;
  };
}

function formatNumber(n: number | undefined) {
  return n === undefined ? "-" : n.toLocaleString("en-US");
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
      <tr style="background:${idx % 2 === 0 ? "#f7f4ff" : "#ffffff"};">
        <td style="padding:10px 12px;border:1px solid #e4defa;">${idx + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;">${item.name}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;">${item.variation ?? "-"}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;">${formatNumber(item.price)}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;text-align:center;">${formatNumber(item.price === undefined ? undefined : item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <div style="border-bottom:3px solid #8b5cf6;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:24px;font-weight:800;color:#6d28d9;">KALA SEARCH</div>
        <div style="font-size:13px;color:#6b6180;">${data.labels.title}</div>
      </div>
      <div style="text-align:${data.dir === "rtl" ? "left" : "right"};font-size:13px;color:#40364f;">
        <div><b>${data.labels.orderNumber}:</b> ${data.orderNumber}</div>
        <div><b>${data.labels.date}:</b> ${data.date}</div>
      </div>
    </div>
    <div style="display:flex;gap:24px;margin-bottom:20px;font-size:14px;">
      <div style="flex:1;background:#f7f4ff;border-radius:12px;padding:14px 16px;">
        <div><b>${data.labels.customer}:</b> ${data.customerName}</div>
        <div style="margin-top:6px;"><b>${data.labels.phone}:</b> ${data.phone}</div>
      </div>
      ${
        data.notes
          ? `<div style="flex:1;background:#f7f4ff;border-radius:12px;padding:14px 16px;">
              <div><b>${data.labels.notes}:</b></div>
              <div style="margin-top:6px;">${data.notes}</div>
            </div>`
          : ""
      }
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#8b5cf6;color:#fff;">
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">#</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">${data.labels.product}</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">${data.labels.variation}</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">${data.labels.quantity}</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">${data.labels.price}</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;">${data.labels.lineTotal}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:18px;">
      <div style="background:#6d28d9;color:#fff;border-radius:12px;padding:14px 24px;font-size:16px;font-weight:700;">
        ${data.labels.total}: ${formatNumber(data.total)} ${data.currencyLabel}
      </div>
    </div>
    <div style="margin-top:28px;font-size:11px;color:#928aab;text-align:center;">Kala Search · ${data.date}</div>
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
