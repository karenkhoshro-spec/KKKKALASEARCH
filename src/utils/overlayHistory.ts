import { useEffect, useRef } from "react";

/**
 * Android/mobile back-gesture support for glass overlays.
 *
 * When an overlay opens we push a lightweight history entry. If the user
 * presses hardware/gesture BACK, the resulting `popstate` ONLY closes the
 * overlay — the SPA stays on the current page (it never exits the site).
 * If the overlay is closed via the UI instead, we silently consume the
 * pushed entry so the history stack stays balanced.
 */
export function useOverlayBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const token = `ks_${Date.now().toString(36)}`;
    let closedByPop = false;

    try {
      window.history.pushState({ ksOverlay: token }, "");
    } catch {
      return;
    }

    const handlePop = () => {
      closedByPop = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("popstate", handlePop);
      // Closed via UI (X button / backdrop / link): consume our pushed entry
      // so the next back gesture doesn't unexpectedly skip a page.
      if (!closedByPop) {
        const st = window.history.state as { ksOverlay?: string } | null;
        if (st && st.ksOverlay === token) {
          try {
            window.history.back();
          } catch {
            /* ignore */
          }
        }
      }
    };
  }, [open]);
}
