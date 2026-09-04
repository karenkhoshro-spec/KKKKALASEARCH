import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Equal } from "lucide-react";
import { goBack } from "../utils/safeBack";
import OverlayHeader from "../components/OverlayHeader";
import "./Calculator.css";

type Operation = "+" | "-" | "×" | "÷";

function applyOperation(a: number, b: number, op: Operation): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const rounded = Math.round(n * 1e10) / 1e10;
  return String(rounded);
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState("");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Operation | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [memory, setMemory] = useState(0);
  const lastOpRef = useRef<Operation | null>(null);
  const lastValueRef = useRef<number | null>(null);

  const handleBack = () => goBack(navigate);

  const inputDigit = useCallback((digit: string) => {
    setDisplay((current) => {
      if (overwrite) return digit;
      const next = current.replace(/^0+(?=\d)/, "") + digit;
      return next.length > 14 ? current : next;
    });
    setOverwrite(false);
  }, [overwrite]);

  const inputDecimal = useCallback(() => {
    setDisplay((current) => {
      if (overwrite) return "0.";
      return current.includes(".") ? current : `${current}.`;
    });
    setOverwrite(false);
  }, [overwrite]);

  const setOperator = useCallback(
    (nextOp: Operation) => {
      const current = parseFloat(display);
      if (Number.isNaN(current)) return;
      if (acc === null) {
        setAcc(current);
        setHistory(`${formatNumber(current)} ${nextOp}`);
      } else if (op && !overwrite) {
        const result = applyOperation(acc, current, op);
        setAcc(Number.isFinite(result) ? result : null);
        setHistory(`${formatNumber(result)} ${nextOp}`);
        setDisplay(Number.isFinite(result) ? formatNumber(result) : "Error");
        lastOpRef.current = op;
        lastValueRef.current = current;
      } else {
        setHistory(`${formatNumber(acc)} ${nextOp}`);
      }
      setOp(nextOp);
      setOverwrite(true);
    },
    [acc, display, op, overwrite],
  );

  const equals = useCallback(() => {
    if (acc === null || op === null) return;
    const current = parseFloat(display);
    const result = applyOperation(acc, current, op);
    if (op === "÷" && current === 0) {
      setHistory(`${formatNumber(acc)} ÷ 0 =`);
      setDisplay("Error");
      setAcc(null);
      setOp(null);
      setOverwrite(true);
      return;
    }
    setHistory(`${formatNumber(acc)} ${op} ${formatNumber(current)} =`);
    setDisplay(Number.isFinite(result) ? formatNumber(result) : "Error");
    lastOpRef.current = op;
    lastValueRef.current = current;
    setAcc(null);
    setOp(null);
    setOverwrite(true);
  }, [acc, display, op]);

  const repeatEquals = useCallback(() => {
    if (lastOpRef.current !== null && lastValueRef.current !== null) {
      const current = parseFloat(display);
      const result = applyOperation(current, lastValueRef.current, lastOpRef.current);
      setHistory(`${formatNumber(current)} ${lastOpRef.current} ${formatNumber(lastValueRef.current)} =`);
      setDisplay(Number.isFinite(result) ? formatNumber(result) : "Error");
      setOverwrite(true);
    } else {
      equals();
    }
  }, [display, equals]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setHistory("");
    setAcc(null);
    setOp(null);
    setOverwrite(true);
    lastOpRef.current = null;
    lastValueRef.current = null;
  }, []);

  const backspace = useCallback(() => {
    setDisplay((current) => {
      if (overwrite) return "0";
      if (current.length <= 1 || current === "-0") return "0";
      const next = current.slice(0, -1);
      return next === "" || next === "-" ? "0" : next;
    });
    setOverwrite(false);
  }, [overwrite]);

  const percent = useCallback(() => {
    setDisplay((current) => {
      const value = parseFloat(current) / 100;
      setOverwrite(true);
      return formatNumber(value);
    });
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((current) => {
      if (current === "0") return current;
      return current.startsWith("-") ? current.slice(1) : `-${current}`;
    });
  }, []);

  const memoryOp = useCallback((kind: "M+" | "M-" | "MR" | "MC") => {
    if (kind === "MC") setMemory(0);
    else if (kind === "MR") {
      setDisplay(formatNumber(memory));
      setOverwrite(true);
    } else {
      const value = parseFloat(display);
      if (!Number.isNaN(value)) {
        setMemory((m) => (kind === "M+" ? m + value : m - value));
        setOverwrite(true);
      }
    }
  }, [display, memory]);

  // Desktop keyboard support (kept in one lightweight effect)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (/^[0-9]$/.test(key)) inputDigit(key);
      else if (key === "." || key === ",") inputDecimal();
      else if (key === "+") setOperator("+");
      else if (key === "-") setOperator("-");
      else if (key === "*" || key.toLowerCase() === "x") setOperator("×");
      else if (key === "/") { e.preventDefault(); setOperator("÷"); }
      else if (key === "Enter" || key === "=") { e.preventDefault(); if (lastOpRef.current && overwrite) repeatEquals(); else equals(); }
      else if (key === "Backspace") backspace();
      else if (key === "Escape" || key.toLowerCase() === "c") clearAll();
      else if (key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDecimal, setOperator, equals, repeatEquals, backspace, clearAll, percent, overwrite]);

  const key = (label: React.ReactNode, action: () => void, variant = "digit", wide = false, ariaLabel?: string) => (
    <button
      type="button"
      onClick={action}
      aria-label={ariaLabel}
      className={`ks-calc-key ks-calc-key--${variant} ${wide ? "col-span-2" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl px-3.5 py-4 sm:px-6">
      <OverlayHeader onBack={handleBack} backLabel="Back" />
      <div className="ks-calc-scene px-2 py-8 sm:px-6">
        <h2 className="relative z-[1] mb-6 text-center text-sm font-black uppercase tracking-[0.35em]" style={{ color: "rgba(165, 243, 252, 0.9)" }}>
          Calculator
        </h2>

        <div className="ks-calc-body">
          <div className="ks-calc-display" aria-live="polite">
            <div className="ks-calc-history">
              {history || "\u00A0"}
              {memory !== 0 ? <span className="ms-2 font-bold" style={{ color: "rgba(250, 204, 21, 0.8)" }}>M</span> : null}
            </div>
            <div className="ks-calc-value">{display}</div>
          </div>

          <div className="ks-calc-grid">
            {key("MC", () => memoryOp("MC"), "misc", false, "Memory clear")}
            {key("MR", () => memoryOp("MR"), "misc", false, "Memory recall")}
            {key("M-", () => memoryOp("M-"), "misc", false, "Memory subtract")}
            {key("M+", () => memoryOp("M+"), "misc", false, "Memory add")}

            {key("AC", clearAll, "ac", false, "All clear")}
            {key("Del", backspace, "misc", false, "Delete last digit")}
            {key("%", percent, "misc", false, "Percent")}
            {key("÷", () => setOperator("÷"), "op", false, "Divide")}

            {key("7", () => inputDigit("7"))}
            {key("8", () => inputDigit("8"))}
            {key("9", () => inputDigit("9"))}
            {key("×", () => setOperator("×"), "op", false, "Multiply")}

            {key("4", () => inputDigit("4"))}
            {key("5", () => inputDigit("5"))}
            {key("6", () => inputDigit("6"))}
            {key("-", () => setOperator("-"), "op", false, "Subtract")}

            {key("1", () => inputDigit("1"))}
            {key("2", () => inputDigit("2"))}
            {key("3", () => inputDigit("3"))}
            {key("+", () => setOperator("+"), "op", false, "Add")}

            {key("±", toggleSign, "misc", false, "Toggle sign")}
            {key("0", () => inputDigit("0"))}
            {key(".", inputDecimal, "digit", false, "Decimal point")}
            {key(<Equal size={17} aria-hidden="true" />, () => { if (lastOpRef.current && overwrite) repeatEquals(); else equals(); }, "equals", false, "Equals")}
          </div>
        </div>
      </div>
    </div>
  );
}
