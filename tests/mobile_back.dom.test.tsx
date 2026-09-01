// @vitest-environment jsdom
/**
 * Real DOM tests for the Android / mobile-browser back behaviour:
 * when an overlay (hamburger, contact, about, welcome modal) is open, the first
 * back press must close the overlay instead of leaving the site or changing route.
 * Also covers the in-app Back button history semantics used by BackButton.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { UiLayerProvider, useUiLayer } from "../src/context/UiLayerContext";
import { goBack } from "../src/utils/safeBack";

let host: HTMLElement;
let root: Root;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount(node: ReactNode) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(node));
}

function RouteWatcher({ onChange }: { onChange: (path: string) => void }) {
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(location.pathname);
  }, [location.pathname, onChange]);
  return null;
}

function OverlayProbe({ report }: { report: (event: string) => void }) {
  const [open, setOpen] = useState(true);
  useUiLayer(open, () => {
    setOpen(false);
    report("overlay-closed");
  });
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        open overlay
      </button>
      <span data-testid="state">{open ? "open" : "closed"}</span>
    </div>
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/products");
});

describe("mobile / android back handling", () => {
  it("closes the open overlay on popstate instead of navigating away", () => {
    const events: string[] = [];
    let routeChanged = false;

    mount(
      <MemoryRouter initialEntries={["/products"]}>
        <UiLayerProvider>
          <OverlayProbe report={(e) => events.push(e)} />
          <RouteWatcher onChange={() => (routeChanged = true)} />
        </UiLayerProvider>
      </MemoryRouter>,
    );

    expect(host.querySelector('[data-testid="state"]')?.textContent).toBe("open");

    // hardware back while an overlay is open
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(events).toContain("overlay-closed");
    expect(host.querySelector('[data-testid="state"]')?.textContent).toBe("closed");
    expect(routeChanged).toBe(false);
  });

  it("does not swallow popstate when no overlay is open", () => {
    const events: string[] = [];
    mount(
      <MemoryRouter initialEntries={["/products"]}>
        <UiLayerProvider>
          <div>plain page</div>
        </UiLayerProvider>
      </MemoryRouter>,
    );
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    // nothing registered a layer, so nothing may claim the back press
    expect(events).toEqual([]);
    expect(host.textContent).toContain("plain page");
  });

  it("re-registering after closing lets the next back press close it again", () => {
    const events: string[] = [];
    mount(
      <MemoryRouter initialEntries={["/products"]}>
        <UiLayerProvider>
          <OverlayProbe report={(e) => events.push(e)} />
        </UiLayerProvider>
      </MemoryRouter>,
    );
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(host.querySelector('[data-testid="state"]')?.textContent).toBe("closed");

    act(() => {
      host.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(host.querySelector('[data-testid="state"]')?.textContent).toBe("open");

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(host.querySelector('[data-testid="state"]')?.textContent).toBe("closed");
    expect(events.filter((e) => e === "overlay-closed")).toHaveLength(2);
  });
});

describe("safeBack history rules", () => {
  it("uses one history step when in-app depth exists", () => {
    const calls: unknown[] = [];
    const navigate = ((arg: unknown) => calls.push(arg)) as unknown as Parameters<typeof goBack>[0];
    window.history.replaceState({ idx: 3 }, "");
    goBack(navigate, "/");
    expect(calls).toEqual([-1]);
  });

  it("navigates to the fallback route when the page was opened directly", () => {
    const calls: unknown[] = [];
    const navigate = ((arg: unknown) => calls.push(arg)) as unknown as Parameters<typeof goBack>[0];
    window.history.replaceState({}, "");
    goBack(navigate, "/products");
    expect(calls).toEqual(["/products"]);

    calls.length = 0;
    window.history.replaceState({ idx: 0 }, "");
    goBack(navigate, "/products");
    expect(calls).toEqual(["/products"]);
  });
});
