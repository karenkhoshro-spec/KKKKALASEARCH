import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type UiLayerContextValue = {
  registerLayer: (close: () => void) => () => void;
  layerCount: number;
};

const UiLayerContext = createContext<UiLayerContextValue | null>(null);

export function UiLayerProvider({ children }: { children: ReactNode }) {
  const layers = useRef<Array<() => void>>([]);
  const [layerCount, setLayerCount] = useState(0);

  const registerLayer = useCallback((close: () => void) => {
    layers.current = [...layers.current, close];
    setLayerCount(layers.current.length);
    return () => {
      layers.current = layers.current.filter((fn) => fn !== close);
      setLayerCount(layers.current.length);
    };
  }, []);

  // Android / browser hardware back: when an overlay (menu, contact, about,
  // welcome modal) is open, the first back press closes the topmost overlay
  // instead of navigating the SPA route or exiting the site. We restore the
  // just-popped history entry (pushState) so the router sees no route change.
  useEffect(() => {
    const onPopState = () => {
      const stack = layers.current;
      if (stack.length === 0) return; // no overlay open -> let the router handle back
      window.history.pushState(window.history.state, "");
      const close = stack[stack.length - 1];
      close();
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  const value = useMemo(() => ({ registerLayer, layerCount }), [registerLayer, layerCount]);

  return <UiLayerContext.Provider value={value}>{children}</UiLayerContext.Provider>;
}

export function useUiLayer(open: boolean, onClose: () => void) {
  const ctx = useContext(UiLayerContext);
  useEffect(() => {
    if (!open || !ctx) return;
    return ctx.registerLayer(onClose);
  }, [open, onClose, ctx]);
}
