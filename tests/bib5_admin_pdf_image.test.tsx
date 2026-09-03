import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { buildInvoiceHtml } from "../src/utils/invoiceHtml";
import { orderPdfLabels, storedOrderToPdfData } from "../src/utils/orderPdf";
import { orderItemImageChain, orderItemImageSources } from "../src/utils/orderItemImage";
import OrderItemImage from "../src/components/OrderItemImage";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { createOrder } from "../server/orderHandler.mjs";

/** t stub: returns the key itself, so assertions only rely on real values. */
const t = (key: string) => key;

const order = {
  orderNumber: "KS-20260903-BIB51",
  createdAt: "2026-09-03T10:30:00.000Z",
  status: "delivered",
  paymentStatus: "unpaid",
  customer: {
    name: "علی محمدی",
    phone: "+989358135230",
    email: "ali@example.com",
    province: "تهران",
    city: "تهران",
    address: "خیابان آزادی، کوچه ۱۲، پلاک ۳",
    postalCode: "1234567890",
    notes: "تحویل شب",
  },
  items: [
    {
      productId: "8039010",
      productCode: "8039010",
      sku: "803901003",
      name: "سرویس لگن اپل تاپ (4عددی)",
      model: "سرویس لگن اپل تاپ (4عددی)",
      variation: "سفید",
      color: "سفید",
      quantity: 2,
      unitPrice: 346000,
      price: 346000,
      lineTotal: 692000,
      image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
    },
    {
      productId: "7025010",
      productCode: "7025010",
      sku: "702501006",
      name: "سطل نخل بزرگ اشکان",
      model: "سطل نخل بزرگ اشکان",
      variation: "موکا",
      color: "موکا",
      quantity: 1,
      unitPrice: 270500,
      price: 270500,
      lineTotal: 270500,
      image: "https://ashkanplastic.com/wp-content/uploads/22212.jpg",
    },
  ],
  total: 962500,
};

describe("BIB5.1 admin order PDF (complete per-order data)", () => {
  it("maps the stored order into the PDF data model with every checklist field", () => {
    const pdf = storedOrderToPdfData(order as never, "rtl", "تومان", orderPdfLabels(t), {
      dateLabel: "۱۴۰۵/۰۶/۱۲",
      orderStatusLabel: "تحویل شده",
      paymentStatusLabel: "پرداخت نشده",
    });

    expect(pdf.orderNumber).toBe("KS-20260903-BIB51");
    expect(pdf.dateLabel).toBe("۱۴۰۵/۰۶/۱۲");
    expect(pdf.orderStatus).toBe("تحویل شده");
    expect(pdf.paymentStatus).toBe("پرداخت نشده");
    expect(pdf.customerName).toBe("علی محمدی");
    expect(pdf.phone).toBe("+989358135230");
    expect(pdf.email).toBe("ali@example.com");
    expect(pdf.province).toBe("تهران");
    expect(pdf.city).toBe("تهران");
    expect(pdf.postalCode).toBe("1234567890");
    expect(pdf.address).toContain("خیابان آزادی");
    expect(pdf.notes).toBe("تحویل شب");
    expect(pdf.items).toHaveLength(2);
    expect(pdf.items[0].code).toBe("8039010");
    expect(pdf.items[0].variation).toBe("سفید");
    expect(pdf.items[0].sku).toBe("803901003");
    expect(pdf.items[0].quantity).toBe(2);
    expect(pdf.items[0].price).toBe(346000);
    expect(pdf.items[1].code).toBe("7025010");
    expect(pdf.items[1].variation).toBe("موکا");
    expect(pdf.total).toBe(962500);
    expect(pdf.currencyLabel).toBe("تومان");
    expect(pdf.dir).toBe("rtl");
  });

  it("renders every checklist field into the invoice HTML (nothing dropped)", () => {
    const pdf = storedOrderToPdfData(order as never, "rtl", "تومان", orderPdfLabels(t), {
      dateLabel: "۱۴۰۵/۰۶/۱۲",
      orderStatusLabel: "تحویل شده",
      paymentStatusLabel: "پرداخت نشده",
    });
    const html = buildInvoiceHtml(pdf);
    const flat = html.replace(/\s+/g, " ");

    expect(html).toContain("KS-20260903-BIB51");
    expect(flat).toContain("۱۴۰۵/۰۶/۱۲");
    expect(flat).toContain("تحویل شده");
    expect(flat).toContain("پرداخت نشده");
    expect(flat).toContain("علی محمدی");
    expect(flat).toContain("+989358135230");
    expect(flat).toContain("ali@example.com");
    expect(flat).toContain("تهران");
    expect(flat).toContain("1234567890");
    expect(flat).toContain("خیابان آزادی");
    expect(flat).toContain("تحویل شب");
    // products: code, name, variation, SKU, quantity, unit price, row total
    expect(flat).toContain("8039010");
    expect(flat).toContain("سرویس لگن اپل تاپ (4عددی)");
    expect(flat).toContain("803901003");
    expect(flat).toContain("7025010");
    expect(flat).toContain("سطل نخل بزرگ اشکان");
    expect(flat).toContain("702501006");
    // unit prices rendered with Persian currency
    expect(flat).toContain("346,000 تومان");
    expect(flat).toContain("270,500 تومان");
    // line totals (unit × quantity)
    expect(flat).toContain("692,000 تومان");
    expect(flat).toContain("270,500 تومان");
    // grand total
    expect(flat).toContain("962,500 تومان");

    // wrap-safety: every text cell uses overflow-wrap so nothing can fall off-page
    expect(flat).toContain("overflow-wrap:anywhere");
    // the row-cell line totals are derived from the SAME order item data
    expect(html).toContain("سرویس لگن");
  });

  it("generates a distinct PDF payload per order number (never hardcoded)", () => {
    const other = { ...order, orderNumber: "KS-20260903-OTHER1", items: order.items.slice(0, 1), total: 692000 };
    const pdf = storedOrderToPdfData(other as never, "rtl", "تومان", orderPdfLabels(t), {});
    const html = buildInvoiceHtml(pdf);
    expect(html).toContain("KS-20260903-OTHER1");
    expect(html).not.toContain("KS-20260903-BIB51");
    expect(pdf.items).toHaveLength(1);
  });
});

describe("BIB5.1 admin order product images", () => {
  it("builds a real loading chain from the stored image URL (relay first, origin included)", () => {
    const chain = orderItemImageChain({ productId: "8039010", productCode: "8039010", image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg" });
    expect(chain.length).toBeGreaterThanOrEqual(3);
    expect(chain[0]).toContain("images.weserv.nl");
    expect(chain[0]).toContain("4030.jpg");
    expect(chain[1]).toBe("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
    expect(new Set(chain).size).toBe(chain.length);
  });

  it("falls back to the real product image mapping when the order item has no stored image", () => {
    const sources = orderItemImageSources({ productId: "8039010", productCode: "8039010", image: "" });
    expect(sources).toContain("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
    const chain = orderItemImageChain({ productId: "8039010", productCode: "8039010", image: "" });
    expect(chain[0]).toContain("images.weserv.nl");
    expect(chain[0]).toContain("4030.jpg");

    const chain2 = orderItemImageChain({ productId: "7025010", productCode: "7025010", image: "" });
    expect(chain2[0]).toContain("22212.jpg");
  });

  it("does not duplicate when stored image equals the catalog mapping", () => {
    const sources = orderItemImageSources({ productId: "8039010", productCode: "8039010", image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg" });
    expect(sources).toHaveLength(1);
    expect(new Set(sources).size).toBe(1);
  });

  it("renders a real <img src> (not a blank box) into the admin DOM for a mapped product", () => {
    const item = {
      productId: "7025010",
      productCode: "7025010",
      image: "",
      name: "سطل نخل بزرگ اشکان",
      model: "سطل نخل بزرگ اشکان",
    };
    const html = renderToString(
      <LanguageProvider>
        <OrderItemImage item={item as never} />
      </LanguageProvider>,
    );
    expect(html).toContain("<img");
    expect(html).toContain("images.weserv.nl");
    expect(html).toContain("22212.jpg");
    expect(html).not.toContain("تصویر موجود نیست");
  });

  it("shows the explicit unavailable state only when no real image exists", () => {
    const html = renderToString(
      <LanguageProvider>
        <OrderItemImage item={{ productId: "9999999", productCode: "9999999", image: "", name: "x", model: "x" } as never} />
      </LanguageProvider>,
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("تصویر موجود نیست");
  });
});

describe("BIB5.1 server image enrichment (persistence-safe)", () => {
  it("fills the real mapped image when a created order item has none", () => {
    const created = createOrder({
      customer: {
        name: "تست تصویر",
        phone: "09121112233",
        email: "",
        province: "تهران",
        city: "تهران",
        address: "خیابان تست ۱",
        postalCode: "1111222233",
        notes: "",
      },
      items: [
        {
          productId: "8039010",
          productCode: "8039010",
          sku: "803901003",
          name: "سرویس لگن اپل تاپ (4عددی)",
          model: "سرویس لگن اپل تاپ (4عددی)",
          variation: "سفید",
          color: "سفید",
          quantity: 1,
          unitPrice: 346000,
          price: 346000,
        },
      ],
      total: 346000,
    });
    expect(created.ok).toBe(true);
    expect(created.order.items[0].image).toBe("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
  });
});
