import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface OrderPdfItem {
  name: string;
  variation?: string;
  quantity: number;
  packQuantity?: number;
  price: number;
  // Optional fields for future Excel sync - no fake data
  quantityInPack?: number;
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
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total: number;
  currencyLabel: string;
  dir: "rtl" | "ltr";
  labels: {
    title: string;
    brand: string;
    orderNumber: string;
    date: string;
    status: string;
    customer: string;
    phone: string;
    address: string;
    notes: string;
    product: string;
    variation: string;
    quantity: string;
    packQuantity: string;
    price: string;
    lineTotal: string;
    subtotal: string;
    discount: string;
    shipping: string;
    total: string;
  };
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

/**
 * Enhanced PDF generation - Implementation 14
 * Includes:
 * - Brand KalaSearch + Logo (text-based, using real Logo component style)
 * - Customer: name, phone, address, notes
 * - Order: number, date, status
 * - Products: name, quantity, packQuantity, unit price, total
 * - Totals: subtotal, discount, shipping, final total
 * Uses html2canvas for Persian/Arabic RTL support
 */
export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const container = document.createElement("div");
  container.setAttribute("dir", data.dir);
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = "800px";
  container.style.padding = "32px";
  container.style.background = "#ffffff";
  container.style.color = "#161022";
  container.style.fontFamily = "'Vazirmatn', 'Inter', sans-serif";
  container.style.lineHeight = "1.6";

  const subtotal = data.subtotal ?? data.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discount = data.discount ?? 0;
  const shipping = data.shipping ?? 0;

  const rows = data.items
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#f7f4ff" : "#ffffff"};">
        <td style="padding:10px 8px;border:1px solid #e4defa;text-align:center;">${idx + 1}</td>
        <td style="padding:10px 12px;border:1px solid #e4defa;max-width:280px;word-break:break-word;">${item.name}${item.variation ? `<br/><small style="color:#6b6180;">${item.variation}</small>` : ""}</td>
        <td style="padding:10px 8px;border:1px solid #e4defa;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border:1px solid #e4defa;text-align:center;">${item.packQuantity != null ? item.packQuantity : "-"}</td>
        <td style="padding:10px 8px;border:1px solid #e4defa;text-align:center;">${formatNumber(item.price)}</td>
        <td style="padding:10px 8px;border:1px solid #e4defa;text-align:center;font-weight:700;">${formatNumber(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  // Logo: Use text-based KalaSearch brand with styling matching real Logo component
  // No fake image - uses real brand identity
  const logoHtml = `
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:36px;height:36px;border-radius:50%;background:radial-gradient(circle, #a855f7, #7c3aed);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px;">K</div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#6d28d9;letter-spacing:-0.5px;">KALA SEARCH</div>
        <div style="font-size:11px;color:#6b6180;letter-spacing:1px;">کالا سرچ</div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div style="border-bottom:3px solid #8b5cf6;padding-bottom:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;">
        ${logoHtml}
        <div style="text-align:${data.dir === "rtl" ? "left" : "right"};font-size:13px;color:#40364f;min-width:200px;">
          <div style="font-size:14px;font-weight:700;color:#161022;margin-bottom:8px;">${data.labels.title}</div>
          <div style="margin-bottom:4px;"><b>${data.labels.orderNumber}:</b> ${data.orderNumber}</div>
          <div style="margin-bottom:4px;"><b>${data.labels.date}:</b> ${data.date}</div>
          ${data.status ? `<div style="margin-bottom:4px;"><b>${data.labels.status}:</b> ${data.status}</div>` : ""}
        </div>
      </div>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:20px;font-size:13px;flex-wrap:wrap;">
      <div style="flex:1;min-width:280px;background:#f7f4ff;border-radius:12px;padding:16px;border:1px solid #e4defa;">
        <div style="font-weight:700;color:#6d28d9;margin-bottom:10px;font-size:14px;">${data.labels.customer}</div>
        <div style="margin-bottom:6px;"><b>${data.labels.customer}:</b> ${data.customerName}</div>
        <div style="margin-bottom:6px;"><b>${data.labels.phone}:</b> ${data.phone}</div>
        ${data.address ? `<div style="margin-top:8px;"><b>${data.labels.address}:</b><br/><span style="color:#40364f;">${data.address}</span></div>` : ""}
      </div>
      ${
        data.notes
          ? `<div style="flex:1;min-width:280px;background:#f7f4ff;border-radius:12px;padding:16px;border:1px solid #e4defa;">
              <div style="font-weight:700;color:#6d28d9;margin-bottom:10px;font-size:14px;">${data.labels.notes}</div>
              <div style="color:#40364f;white-space:pre-wrap;">${data.notes}</div>
            </div>`
          : ""
      }
    </div>

    <div style="margin-bottom:8px;font-weight:700;color:#161022;font-size:14px;">${data.labels.product} - ${data.items.length} ${data.dir === "rtl" ? "قلم" : "items"}</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
      <thead>
        <tr style="background:#8b5cf6;color:#fff;">
          <th style="padding:10px 8px;border:1px solid #8b5cf6;width:40px;">#</th>
          <th style="padding:10px 12px;border:1px solid #8b5cf6;text-align:start;">${data.labels.product}</th>
          <th style="padding:10px 8px;border:1px solid #8b5cf6;width:60px;">${data.labels.quantity}</th>
          <th style="padding:10px 8px;border:1px solid #8b5cf6;width:80px;">${data.labels.packQuantity}</th>
          <th style="padding:10px 8px;border:1px solid #8b5cf6;width:90px;">${data.labels.price}</th>
          <th style="padding:10px 8px;border:1px solid #8b5cf6;width:100px;">${data.labels.lineTotal}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div style="min-width:260px;background:#faf8ff;border:1px solid #e4defa;border-radius:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e4defa;">
          <span style="color:#6b6180;">${data.labels.subtotal}</span>
          <span style="font-weight:600;">${formatNumber(subtotal)} ${data.currencyLabel}</span>
        </div>
        ${
          discount > 0
            ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e4defa;color:#e11d48;">
                <span>${data.labels.discount}</span>
                <span style="font-weight:600;">- ${formatNumber(discount)} ${data.currencyLabel}</span>
              </div>`
            : ""
        }
        ${
          shipping > 0
            ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #e4defa;">
                <span>${data.labels.shipping}</span>
                <span style="font-weight:600;">${formatNumber(shipping)} ${data.currencyLabel}</span>
              </div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;padding:10px 0 0 0;font-size:15px;font-weight:800;">
          <span style="color:#161022;">${data.labels.total}</span>
          <span style="color:#6d28d9;">${formatNumber(data.total)} ${data.currencyLabel}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e4defa;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#928aab;">
      <div>KalaSearch · ${data.labels.brand} · ${data.date}</div>
      <div>${data.orderNumber}</div>
    </div>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
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
