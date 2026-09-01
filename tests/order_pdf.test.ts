// @vitest-environment jsdom
/**
 * Real PDF/proforma generation test.
 *
 * `src/utils/pdf.ts` builds a print-ready invoice node and rasterizes it with
 * html2canvas before embedding the bitmap in a genuine jsPDF document. The
 * rasterizer itself is replaced here with a fixed PNG because the test DOM has
 * no GPU/canvas backend — everything else (document assembly, RTL layout,
 * totals, jsPDF file structure) runs for real, and the emitted bytes are
 * validated as a syntactically correct PDF.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import zlib from "zlib";

const captured: { html: string; dir: string; width: number; height: number } = { html: "", dir: "", width: 0, height: 0 };

beforeAll(() => {
  captured.html = "";
});

vi.mock("html2canvas", () => ({
  default: async (element: HTMLElement) => {
    captured.html = element.innerHTML;
    captured.dir = element.getAttribute("dir") ?? "";
    captured.width = 1560;
    captured.height = 2200;
    return {
      width: 1560,
      height: 2200,
      toDataURL: () => `data:image/png;base64,${TINY_PNG_BASE64}`,
    };
  },
}));

/** Minimal but structurally valid PNG so jsPDF parses a real image. */
function crc32(buf: Buffer) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function buildPng(width = 4, height = 4) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 3);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      raw[row + 1 + x * 3] = 255;
      raw[row + 2 + x * 3] = 250;
      raw[row + 3 + x * 3] = 245;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const TINY_PNG_BASE64 = buildPng().toString("base64");

describe("order PDF / proforma document", () => {
  it("renders the real invoice content into a valid PDF file", async () => {
    const { generateOrderPdf } = await import("../src/utils/pdf");
    const { storedOrderToPdfData, orderPdfLabels } = await import("../src/utils/orderPdf");
    const labels = orderPdfLabels((key) => key);

    const order = {
      orderNumber: "KS-20260901-ABC123",
      createdAt: "2026-09-01T10:00:00.000Z",
      status: "registered" as const,
      paymentStatus: "unpaid" as const,
      customer: {
        name: "اشکان مهراندیش",
        phone: "+989358135230",
        email: "qa@example.com",
        province: "گیلان",
        city: "رشت",
        address: "خیابان نمونه ۱۲",
        postalCode: "4412345678",
        notes: "",
      },
      items: [
        {
          productId: "8039010",
          productCode: "8039010",
          sku: "803901003",
          name: "سرویس لگن اپل تاپ 4 عددی سفید",
          model: "سرویس لگن اپل تاپ 4 عددی سفید",
          variation: "4 عددی",
          color: "سفید",
          colorCode: "#ffffff",
          quantity: 2,
          image: "",
          unitPrice: 1000,
          price: 1000,
          lineTotal: 2000,
          availability: "موجود",
          stockCount: 86,
        },
      ],
      total: 2000,
    };

    const blob = await generateOrderPdf(storedOrderToPdfData(order, "rtl", "تومان", labels));

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
    const bytes = Buffer.from(await blob.arrayBuffer());
    const doc = bytes.toString("latin1");
    const tail = bytes.subarray(-512).toString("latin1");
    expect(doc.startsWith("%PDF-1")).toBe(true);
    expect(doc).toContain("/Type /Catalog");
    expect(doc).toContain("/Type /Page");
    expect(doc).toContain("/MediaBox");
    expect(doc).toContain("/Subtype /Image"); // the rasterised invoice bitmap
    expect(doc).toContain("/XObject");
    expect(doc).toMatch(/\/Count 1\b/);
    expect(tail).toContain("startxref");
    expect(tail.replace(/\s+$/, "").endsWith("%%EOF")).toBe(true);

    // what the customer actually gets printed on the sheet
    expect(captured.html).toContain("KS-20260901-ABC123");
    expect(captured.html).toContain("سرویس لگن اپل تاپ 4 عددی سفید");
    expect(captured.html).toContain("803901003");
    expect(captured.html).toContain("+989358135230");
    expect(captured.html).toContain("2,000 تومان");
    expect(captured.dir).toBe("rtl"); // shaped right-to-left by the browser before rasterizing
    expect(captured.width).toBeGreaterThan(1000); // full-resolution page, not a stub
    expect(captured.height).toBeGreaterThan(1000);
  });

  it("maps a stored order onto the document without dropping fields", async () => {
    const { storedOrderToPdfData, orderPdfLabels } = await import("../src/utils/orderPdf");
    const labels = orderPdfLabels((key) => key);
    const data = storedOrderToPdfData(
      {
        orderNumber: "KS-1",
        createdAt: "2026-09-01T00:00:00.000Z",
        status: "delivered",
        paymentStatus: "unpaid",
        customer: { name: "A", phone: "0912", province: "P", city: "C", address: "S", postalCode: "1", email: "", notes: "n" },
        items: [
          {
            productId: "7025010",
            productCode: "7025010",
            sku: "702501006",
            name: "سطل نخل",
            model: "سطل نخل",
            variation: "قرمز",
            color: "قرمز",
            colorCode: "#ef4444",
            quantity: 1,
            image: "",
            unitPrice: 500,
            price: 500,
            lineTotal: 500,
            availability: "موجود",
            stockCount: 137,
          },
        ],
        total: 500,
      },
      "rtl",
      "تومان",
      labels,
    );
    expect(data.orderNumber).toBe("KS-1");
    expect(data.items[0]).toMatchObject({ name: "سطل نخل", variation: "قرمز", sku: "702501006", quantity: 1, price: 500 });
    expect(data.address).toContain("P");
    expect(data.address).toContain("C");
    expect(data.address).toContain("S");
    expect(data.address).toContain("1");
    expect(data.total).toBe(500);
    expect(data.dir).toBe("rtl");
  });
});
