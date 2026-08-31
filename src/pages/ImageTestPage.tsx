/**
 * TEMPORARY diagnostic page (dev-only) — proves real image loading in the browser.
 * For each real product file it probes: ORIGINAL (direct, no-referrer) and both RELAY CDNs,
 * reporting live: load state, naturalWidth × naturalHeight, currentSrc and computed CSS.
 * Remove together with its /image-test route after visual verification.
 */
import { useEffect, useRef, useState } from "react";
import { imageRelayCandidates } from "../data/productImageResolver";

const UPLOADS = "https://ashkanplastic.com/wp-content/uploads/";
const FILES = [
  { name: "آبکش چلو 20", file: "930a.jpg" },
  { name: "لگن نیما 1", file: "1440-1.jpg" },
  { name: "جارو دستی دو برس (تصویر مشترک 4997010/4997011/4998010)", file: "4810.jpg" },
  { name: "سبد خرید کوچک سیب", file: "170-1-1.jpg" },
];
const CONTROL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#16a34a"/><circle cx="60" cy="52" r="26" fill="#bbf7d0"/><text x="60" y="102" font-size="15" text-anchor="middle" fill="#fff">CONTROL OK</text></svg>`
  );

type State = "pending" | "ok" | "error";

function Probe({ label, url }: { label: string; url: string }) {
  const [state, setState] = useState<State>("pending");
  const [dims, setDims] = useState<[number, number] | null>(null);
  const [cssInfo, setCssInfo] = useState("—");
  const ref = useRef<HTMLImageElement | null>(null);

  const report = () => {
    const el = ref.current;
    if (!el) return;
    setDims([el.naturalWidth, el.naturalHeight]);
    setState(el.naturalWidth > 0 ? "ok" : "error");
    const cs = getComputedStyle(el);
    setCssInfo(`opacity=${cs.opacity} · display=${cs.display} · visibility=${cs.visibility}`);
  };

  useEffect(() => {
    const el = ref.current;
    if (el?.complete) report(); // cached images may finish before onLoad attaches
  }, []);

  return (
    <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mb-2 font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
      <div style={{ background: "var(--input-bg)" }} className="mb-2 flex items-center justify-center rounded-lg p-2" >
        <img
          ref={ref}
          src={url}
          alt={label}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{ maxHeight: 130, width: "auto", maxWidth: "100%", objectFit: "contain" }}
          onLoad={report}
          onError={() => setState("error")}
        />
      </div>
      <div dir="ltr" className="break-all text-xs" style={{ color: "var(--text-muted)" }}>{url}</div>
      <div className="mt-1 text-xs font-bold" style={{ color: state === "ok" ? "#16a34a" : state === "error" ? "#dc2626" : "#ca8a04" }}>
        {state === "ok" && dims ? `✅ LOAD OK — naturalWidth=${dims[0]} naturalHeight=${dims[1]}` : state === "error" ? "❌ LOAD FAILED (onError)" : "⏳ pending…"}
      </div>
      {state === "ok" && <div dir="ltr" className="text-xs" style={{ color: "var(--text-muted)" }}>{cssInfo}</div>}
    </div>
  );
}

export default function ImageTestPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Image Loading Diagnostic</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        هر کاشی وضعیت واقعی لود در همین مرورگر را نشان می‌دهد. ORIGINAL = مستقیم از ashkanplastic.com ·
        RELAY-1/2 = همان فایل واقعی از طریق CDN رله. اگر ORIGINAL شکست خورد ولی RELAY سبز شد، مسیر نهایی نمایش همان رله است.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Probe label="CONTROL (data URI)" url={CONTROL} />
      </div>

      {FILES.map((f) => {
        const original = UPLOADS + f.file;
        const [relay1, relay2] = imageRelayCandidates(original);
        return (
          <section key={f.file} className="mb-6">
            <h2 className="mb-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{f.name}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Probe label="ORIGINAL (مستقیم)" url={original} />
              <Probe label="RELAY-1 (images.weserv.nl)" url={relay1} />
              <Probe label="RELAY-2 (wsrv.nl)" url={relay2} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
