import type { NavigateFunction } from "react-router-dom";

/** Use real router history (idx). Never treat browser history.length as in-app depth. */
export function goBack(navigate: NavigateFunction, fallback = "/") {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === "number" && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
