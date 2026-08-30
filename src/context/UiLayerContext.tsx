import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useBlocker } from "react-router-dom";

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

  const closeTop = useCallback(() => {
    const top = layers.current[layers.current.length - 1];
    if (top) {
      top();
      return true;
    }
    return false;
  }, []);

  const blocker = useBlocker(({ historyAction }) => historyAction === "POP" && layerCount > 0);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    closeTop();
    blocker.reset();
  }, [blocker, closeTop]);

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
