import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Overlay ("layer") stack for the whole app: hamburger menu, contact card,
 * about card and the language welcome modal.
 *
 * Android / mobile-browser rule implemented here: while an overlay is open the
 * FIRST back press must only close that overlay — never navigate the SPA and
 * never leave the site. The naive version (re-push the just-popped entry from a
 * popstate handler) is broken: the popped entry's URL is restored first, so the
 * router has already navigated a page back by the time we react.
 *
 * Correct approach — reserve a history entry when the overlay opens:
 *
 *   pushState({ ...state, ksLayer: token }, "")     // same URL, new entry
 *
 * A back press then pops *our own* entry: the URL never changes, the router sees
 * the same location, and we simply close the overlay. If the overlay is
 * dismissed by a tap (backdrop or a menu link) the reserved entry is released
 * with history.back(), guarded so that release is never mistaken for a user
 * back press on another overlay.
 */

type Layer = { close: () => void; token: string; seq: number };

type UiLayerContextValue = {
  registerLayer: (close: () => void) => () => void;
  layerCount: number;
};

const UiLayerContext = createContext<UiLayerContextValue | null>(null);

const canUseHistory = () => typeof window !== "undefined" && !!window.history?.pushState;

function nextStateWith(token: string): Record<string, unknown> {
  const current = (window.history.state ?? {}) as Record<string, unknown>;
  return { ...current, ksLayer: token };
}

export function UiLayerProvider({ children }: { children: ReactNode }) {
  const layers = useRef<Layer[]>([]);
  const seqCounter = useRef(0);
  // sequence number of the layer whose reserved entry we are releasing ourselves
  const pendingRelease = useRef(0);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [layerCount, setLayerCount] = useState(0);

  const registerLayer = useCallback((close: () => void) => {
    const token = `ks-layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const seq = (seqCounter.current += 1);
    layers.current = [...layers.current, { close, token, seq }];
    setLayerCount(layers.current.length);

    if (!canUseHistory()) return () => undefined;

    const hrefAtOpen = window.location.href;
    try {
      window.history.pushState(nextStateWith(token), "");
    } catch {
      // sandboxed frame / quota — the overlay still works, back just navigates
      return () => undefined;
    }

    return () => {
      layers.current = layers.current.filter((layer) => layer.token !== token);
      setLayerCount(layers.current.length);
      // Release the reserved entry only while it is still the current entry and
      // the app has not navigated in the meantime (e.g. a menu link was used).
      const stillCurrent = (window.history.state as Record<string, unknown> | null)?.ksLayer === token;
      if (stillCurrent && window.location.href === hrefAtOpen) {
        // Remember WHICH layer is releasing, so the popstate we cause cannot be
        // mistaken for a user back press on an overlay opened afterwards (jsdom
        // and some embedded webviews never report a back() at all).
        pendingRelease.current = seq;
        if (releaseTimer.current) clearTimeout(releaseTimer.current);
        releaseTimer.current = setTimeout(() => {
          pendingRelease.current = 0;
        }, 250);
        try {
          window.history.back();
        } catch {
          pendingRelease.current = 0;
        }
      }
    };
  }, []);

  useEffect(
    () => () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    },
    [],
  );

  // A back press with an open overlay belongs to that overlay: close the
  // topmost one. The URL does not change (we reserved the entry ourselves), so
  // the router stays put.
  useEffect(() => {
    const onPopState = () => {
      const stack = layers.current;
      const top = stack[stack.length - 1];
      if (pendingRelease.current > 0) {
        // A release we started ourselves. It only counts as "our" pop while the
        // layer that released is newer than anything still open; an overlay
        // registered afterwards must keep its own back behaviour.
        const ours = !top || pendingRelease.current > top.seq;
        pendingRelease.current = 0;
        if (ours) return;
      }
      if (!top) return; // no overlay open -> let the router handle back
      top.close();
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  const value = useMemo(() => ({ registerLayer, layerCount }), [registerLayer, layerCount]);

  return <UiLayerContext.Provider value={value}>{children}</UiLayerContext.Provider>;
}

/**
 * Mark an overlay as a back-handling layer while it is open.
 *
 * Both the context and the close callback are read through refs on purpose: the
 * context value changes whenever the layer count changes, and parents pass
 * inline callbacks — re-running the registration would push a fresh history
 * entry per render and (worse) release the previous one. The overlay must
 * register exactly once per open/close cycle.
 */
export function useUiLayer(open: boolean, onClose: () => void) {
  const ctx = useContext(UiLayerContext);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const register = ctxRef.current?.registerLayer;
    if (!open || !register) return;
    return register(() => closeRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
