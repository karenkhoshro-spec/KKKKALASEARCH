import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep production logs free of customer data; replace with Sentry/server logging later.
    if (import.meta.env.DEV) console.error("OrderX UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="flex min-h-screen items-center justify-center px-5 text-center" dir="rtl"><div className="glass max-w-md rounded-3xl p-8"><h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>خطایی رخ داد</h1><p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>لطفاً صفحه را دوباره بارگذاری کنید.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-2xl px-5 py-3 text-sm font-bold text-white" style={{ background: "var(--accent-1)" }}>بارگذاری دوباره</button></div></main>;
  }
}
