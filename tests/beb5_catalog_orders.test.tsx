// @vitest-environment jsdom
/**
 * BEB5 — catalogue images, order hand-off and list performance contracts.
 *
 * These encode decisions the boss restated in BEB5:
 *  1. category + search cards never show a product photo; the real mapped image
 *     belongs to Product Details (and to cart / order lines);
 *  2. a stored order line keeps the REAL mapped image URL, so Admin can paint
 *     it — a bare CSV file name is resolved through the project's own mapping
 *     table and never invented;
 *  3. the customer's confirmation must not depend on PDF generation, otherwise a
 *     slow PDF looks like a lost order;
 *  4. long lists render in pages instead of 347 cards at once.
 */
import type { ReactNode } from "react";
import { readFileSync } from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ProductsPage from "../src/pages/ProductsPage";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";
import { AdminAuthProvider } from "../src/context/AdminAuthContext";
import ProductImage from "../src/components/ProductImage";
import { buildOrderItems } from "../src/utils/ordersApi";
import {
  fullImageChain,
  imageCandidatesToTry,
  resolveMappedImageUrl,
} from "../src/data/productImageResolver";
import type { CartItem } from "../src/types";

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

/** ProductImage reads the language context for its honest fallback label. */
const withLang = (node: ReactNode) => renderToString(<LanguageProvider>{node}</LanguageProvider>);

/** Same provider stack the app mounts, so pages render exactly as in the browser. */
function shell(node: ReactNode, at = "/") {
  return renderToString(
    <MemoryRouter initialEntries={[at]}>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AccountProvider>
              <WishlistProvider>
                <CartProvider>
                  <ListContextProvider>
                    <AdminAuthProvider>{node}</AdminAuthProvider>
                  </ListContextProvider>
                </CartProvider>
              </WishlistProvider>
            </AccountProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("BEB5 image mapping", () => {
  it("resolves a bare CSV file name to the real mapped Ashkan URL", () => {
    const resolved = resolveMappedImageUrl("4030.jpg");
    expect(resolved).toBe("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
  });

  it("returns nothing for an unmapped asset instead of fabricating one", () => {
    expect(resolveMappedImageUrl("definitely-not-a-real-asset-918273645.jpg")).toBeUndefined();
    expect(resolveMappedImageUrl("")).toBeUndefined();
    expect(resolveMappedImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(fullImageChain("definitely-not-a-real-asset-918273645.jpg")).toEqual([]);
  });

  it("keeps an already-absolute URL untouched", () => {
    const url = "https://ashkanplastic.com/wp-content/uploads/22212.jpg";
    expect(resolveMappedImageUrl(url)).toBe(url);
    expect(fullImageChain(url, 240)).toEqual([
      `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=240&output=webp&q=80&we`,
      url,
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=240&output=webp&q=80&we`,
    ]);
  });

  it("gives an unmapped product zero candidates, so no doomed request fires", () => {
    expect(imageCandidatesToTry("nothing-mapped-here.jpg", 640).candidates).toEqual([]);
  });
});

describe("BEB5 order hand-off", () => {
  it("stores the real mapped image URL on each order line", () => {
    const line: CartItem = {
      productId: "8039010",
      name: "سرویس لگن اپل تاپ 4 عددی سفید",
      image: "4030.jpg",
      price: 346000,
      quantity: 2,
      variation: { id: "803901003", name: "سفید", sku: "803901003", price: 346000, color: "سفید", colorHex: "#f8fafc" },
    };
    const [item] = buildOrderItems([line]);
    expect(item.image).toBe("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
    expect(item.productId).toBe("8039010");
    expect(item.sku).toBe("803901003");
    expect(item.color).toBe("سفید");
    expect(item.colorCode).toBe("#f8fafc");
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(346000);
    expect(item.lineTotal).toBe(692000);
    expect(item.availability).toBe("موجود");
  });

  it("renders order-line images through the resolver, not as a raw relative path", () => {
    // A bare "4030.jpg" in <img src> resolves against /admin/orders and shows a
    // broken icon — that was the visible half of the admin bug.
    const html = withLang(<ProductImage src="4030.jpg" alt="x" size={160} />);
    expect(html).toContain("images.weserv.nl");
    expect(html).not.toContain('src="4030.jpg"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it("shows the honest fallback instead of a placeholder when nothing is mapped", () => {
    const html = withLang(<ProductImage src="not-mapped-424242.jpg" alt="x" size={160} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("تصویر موجود نیست");
  });

  it("confirms the order before generating the PDF", () => {
    const checkout = read("src/pages/CheckoutPage.tsx");
    const submit = checkout.slice(checkout.indexOf("const handleSubmit"), checkout.indexOf("const handleBack"));
    expect(submit).toContain("createRemoteOrder");
    // persistence is awaited first, then the UI confirms and clears the cart
    expect(submit.indexOf("await createRemoteOrder")).toBeLessThan(submit.indexOf("clearCart()"));
    // documents are produced off the critical path
    expect(submit).toContain("void generateDocuments()");
    expect(submit).not.toContain("await generateOrderPdf");
    expect(checkout).toContain("generateDocuments");
    // and a failed PDF never claims success
    expect(checkout).toContain('setPdfState("failed")');
  });

  it("tells an unreachable orders API apart from an empty list", () => {
    const admin = read("src/pages/admin/AdminOrdersPage.tsx");
    expect(admin).toContain('t("admin.apiUnavailable")');
    expect(admin).toContain('error || t("admin.noOrders")');
  });
});

describe("BEB5 category and search cards", () => {
  it("never mount an <img> inside a no-image card", () => {
    const html = withLang(<ProductImage src="4030.jpg" alt="" size={160} />);
    expect(html).toContain("<img");
    const card = read("src/components/ProductCard.tsx");
    const noImageBranch = card.slice(card.indexOf("if (noImage)"), card.indexOf("export default memo(ProductCard)"));
    expect(noImageBranch).toContain("ks-product-card-icon");
    // BEB5 final: neither the product code nor the stock status may be rendered
    // by a card — on any surface.
    expect(noImageBranch).not.toContain("product.productCode");
    expect(noImageBranch).not.toContain("product.outOfStock");
    expect(noImageBranch).not.toContain("<img");
    const wholeCard = read("src/components/ProductCard.tsx");
    expect(wholeCard).not.toContain("product.outOfStock");
    expect(wholeCard).not.toContain("product.productCode");
  });

  it("renders no availability badge on the image-card surfaces either", () => {
    const html = shell(<ProductsPage />, "/products");
    expect(html).toContain("ks-product-card");
    expect(html).not.toContain("ناموجود");
    expect(html).not.toContain("موجود در انبار");
    expect(html).not.toContain("کد محصول");
  });

  it("keeps the product code and the availability status on Product Details", () => {
    const details = read("src/pages/ProductDetails.tsx");
    expect(details).toContain("product.productCode");
    expect(details).toContain("t(\"product.productCode\")");
    expect(details).toContain("product.outOfStock");
  });

  it("renders long lists in pages with an explicit counter", () => {
    const html = shell(<ProductsPage />, "/products");
    const cards = html.match(/ks-product-card/g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(24); // 347 products must not all mount
    expect(html).toContain("نمایش 24 از 347 کالا");
    expect(html).toContain("نمایش 24 مورد بیشتر");
  });
});
