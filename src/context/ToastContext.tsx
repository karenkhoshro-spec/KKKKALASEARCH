import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  void dismiss; // toasts auto-dismiss; intentionally NO decorative × close button

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-strong animate-toast flex items-start gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-glow)]"
            style={{ color: "var(--text-primary)" }}
          >
            <span className="mt-0.5 shrink-0">
              {toast.type === "success" && <CheckCircle2 size={20} style={{ color: "var(--accent-1)" }} />}
              {toast.type === "info" && <Info size={20} style={{ color: "var(--accent-1)" }} />}
              {toast.type === "error" && <AlertTriangle size={20} style={{ color: "var(--danger)" }} />}
            </span>
            <p className="flex-1 text-sm leading-6">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
