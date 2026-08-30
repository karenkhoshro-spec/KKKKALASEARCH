// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../src/App";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function flush(ms = 0) {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

const clickLink = async (root: ParentNode, selector: string) => {
  const link = root.querySelector(selector) as HTMLAnchorElement | null;
  if (!link) throw new Error(`missing element: ${selector}`);
  await act(async () => {
    link.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await flush();
};

describe("KalaSearch UI smoke (DOM runtime)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("kala-search-lang", "fa");
    localStorage.setItem("kala-search-theme", "light");
    window.history.replaceState({ usr: null, key: "smoke", idx: 0 }, "", "/");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => { root.render(<App />); });
    await flush();
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    host.remove();
  });

  it("renders the homepage: search hero, 9 category tiles, no quick-access shortcut cards", () => {
    const input = host.querySelector("input");
    expect(input?.getAttribute("placeholder")).toBe("دنبال چه کالایی می‌گردید؟");
    expect(host.querySelectorAll("a.ks-category-tile").length).toBe(9);
    expect(host.textContent).not.toContain("سایر دسته‌بندی‌ها");
    // No misleading backend wording on any screen
    expect(host.textContent).not.toContain("سرویس ارسال به فروشنده هنوز به بک‌اند متصل نشده");
  });

  it("keeps the main animated atom logo in the header but not an extra rotating mark in the menu", async () => {
    expect(host.querySelectorAll(".animate-spin-slow").length).toBeGreaterThanOrEqual(1); // main logo orbit
    const menuButton = [...host.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "منو");
    expect(menuButton).toBeTruthy();
    await act(async () => { menuButton!.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
    await flush();
    const aside = document.querySelector("aside");
    expect(aside).toBeTruthy();
    // rotating marks inside the menu: only the one inside the brand Logo (atom), no extra sparkle
    const spinningInMenu = aside!.querySelectorAll(".animate-spin-slow").length;
    expect(spinningInMenu).toBeLessThanOrEqual(1);
    expect(aside!.textContent).toContain("درباره ما");
    expect(aside!.textContent).toContain("سایر");
    expect(aside!.textContent).toContain("محصولات");
  });

  it("navigates home → category → product and shows the fixed image box + no stray numbers under the price", async () => {
    await clickLink(host, 'a[href="/category/other"]');
    expect(window.location.pathname).toBe("/category/other");
    // three spotlight crystal cards in one unified group for the required categories
    const firstSpotlight = host.querySelector(".ks-spotlight-card");
    const spotlight = firstSpotlight?.closest("section");
    expect(spotlight?.querySelectorAll(".ks-spotlight-card").length).toBe(3);
    expect(spotlight?.textContent).toContain("جا پودری/اسکاجی");
    expect(spotlight?.textContent).toContain("آبکش و سبد و کاسه");
    expect(spotlight?.textContent).toContain("جاصابونی");

    await act(async () => {
      firstSpotlight!.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(window.location.pathname).toBe("/category/other");
    const productLink = host.querySelector('a[href^="/product/"]') as HTMLAnchorElement;
    expect(productLink).toBeTruthy();
    await act(async () => {
      productLink.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await flush();
    expect(window.location.pathname).toMatch(/^\/product\//);
    // Product image must be eager + high priority for instant paint
    const img = host.querySelector(".product-media img");
    if (img) {
      expect(img.getAttribute("loading")).toBe("eager");
      expect(img.getAttribute("decoding")).toBe("async");
    }
    // No standalone bare number rendered as a floating description paragraph
    const paras = [...host.querySelectorAll("p")].map((p) => (p.textContent ?? "").trim());
    expect(paras.some((text) => /^\d+$/.test(text))).toBe(false);
  });

  it("search stays in the search overlay and shows results + related category chip", async () => {
    const input = host.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    await act(async () => { setter.call(input, "زنبیل"); input.dispatchEvent(new window.Event("input", { bubbles: true })); });
    const form = input.closest("form")!;
    await act(async () => { form.requestSubmit(); });
    await flush();
    expect(window.location.pathname).toBe("/search");
    expect(window.location.search).toBe("?q=%D8%B2%D9%86%D8%A8%DB%8C%D9%84");
    expect(host.textContent).toContain("جستجو:");
    expect(host.textContent).toContain("زنبیل");
    expect(host.textContent).toContain("دسته مرتبط");
  });

  it("checkout requires the address before an order can be confirmed", async () => {
    // add a product to the cart first: category → open product → select → add
    await clickLink(host, 'a[href="/category/zanbil"]');
    const productLink = host.querySelector('a[href^="/product/"]') as HTMLAnchorElement;
    await act(async () => {
      productLink.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    await flush();
    const colorHeading = [...host.querySelectorAll("h3")].find((h) => h.textContent?.trim() === "رنگ");
    const colorButton = colorHeading?.parentElement?.querySelector("button");
    if (colorButton) await act(async () => { colorButton.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
    const increase = host.querySelector('button[aria-label="increase"]');
    await act(async () => { increase!.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
    const addButton = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("افزودن به سبد خرید"));
    expect(addButton).toBeTruthy();
    await act(async () => { addButton!.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
    await flush();
    await clickLink(host, 'a[href="/cart"]');
    const checkoutButton = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("تأیید و ثبت سفارش"));
    await act(async () => { checkoutButton!.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
    await flush();
    expect(window.location.pathname).toBe("/checkout");

    const byId = (id: string) => host.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | null;
    const setVal = async (id: string, value: string) => {
      const el = byId(id)!;
      expect(el).toBeTruthy();
      const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
      await act(async () => { setter.call(el, value); el.dispatchEvent(new window.Event("input", { bubbles: true })); });
    };

    // fill everything except the address, then try to confirm
    await setVal("checkout-first-name", "آزمون");
    await setVal("checkout-last-name", "کاربر");
    await setVal("checkout-phone", "9121234567");
    const submit = [...host.querySelectorAll("button")].find((b) => b.textContent?.includes("ثبت نهایی سفارش")) as HTMLButtonElement;
    await act(async () => { submit.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })); });
    await flush();
    expect(host.textContent).toContain("لطفاً آدرس را وارد کنید.");
    expect(host.textContent).not.toContain("سفارش شما ثبت شد!"); // blocked without address

    // optional notes may stay empty; with a valid address the block clears and
    // the confirmation proceeds (PDF rasterisation itself needs a real canvas).
    await setVal("checkout-address", "تهران، خیابان آزمون، پلاکه ۱");
    await act(async () => { submit.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })); });
    await flush(50);
    expect(host.textContent).not.toContain("لطفاً آدرس را وارد کنید.");
  });
});
