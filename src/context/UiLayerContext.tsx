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
