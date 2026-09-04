/**
 * Renders the Orderx logo into public/orderx-logo.png:
 *   - Black "ORDERX" wordmark on a FULLY TRANSPARENT background (RGBA PNG;
 *     no white rectangle behind the logo in PDFs or on tinted surfaces)
 *   - Standard character spacing for ORDER, slightly tighter kerning before X
 *   - Stylized X: the two strokes are separated — a single left diagonal plus
 *     a right-pointing chevron (two bars meeting at an apex), so the right
 *     arm extends further, giving an arrow/chevron effect pointing right.
 *   - Safe-area padding on every side so no letter (especially the X) can be
 *     clipped by PDF object-fit or container edges.
 *
 * DEV UTILITY ONLY — the PNG is committed, so this script is not needed in
 * CI or production. To regenerate:
 *   npm i --no-save @napi-rs/canvas
 *   curl -s -o /tmp/ArchivoBlack-Regular.ttf \
 *     https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf
 *   node scripts/generate-orderx-logo.mjs
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";

const FONT_PATH = process.env.ORDERX_FONT || "/tmp/ArchivoBlack-Regular.ttf";
GlobalFonts.registerFromPath(FONT_PATH, "Archivo Black");

const W = 1000;
const H = 260;
const FONT_SIZE = 170;
const SAFE = 14; // transparent safe-area padding (px) on every side — prevents clipping
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// FULLY TRANSPARENT background — clearRect leaves alpha 0 everywhere.
ctx.clearRect(0, 0, W, H);

// ---- "ORDER" metrics (alphabetic baseline — glyph top = baseline - ascent) ----
ctx.font = `${FONT_SIZE}px "Archivo Black"`;
const text = "ORDER";
const m = ctx.measureText(text);
const capTop = m.actualBoundingBoxAscent; // ≈ 120 at 170px
// Vertical safe area: content box shrunk by SAFE on top and bottom.
const yTop = (H - capTop) / 2 + SAFE / 2; // glyph tops start here → content is centered
const baseline = yTop + capTop;
const yBot = yTop + capTop; // X sits on the baseline like the letters
const yMid = yTop + capTop / 2;

// ---- Stylized X (separated strokes, right-pointing chevron) ----
const X_W = capTop * 1.28; // apex extends further right than cap height
const GAP = 14; // slightly tighter kerning than standard letter spacing
const x0 = m.width + GAP;
const x1 = x0 + X_W;

// Center the whole wordmark horizontally, inside the SAFE side padding.
const totalW = m.width + GAP + X_W;
const shift = (W - totalW) / 2;

const T = 19; // stroke width ≈ Archivo Black stroke weight
ctx.strokeStyle = "#000000";
ctx.lineWidth = T;
ctx.lineCap = "round";
ctx.lineJoin = "round";
const strokeLine = (ax, ay, bx, by) => {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
};

// Left diagonal of the X (separate from the right half).
strokeLine(shift + x0 + 10, yTop + 10, shift + x0 + 70, yBot);
// Right half: chevron, two bars meeting at a right-pointing apex.
strokeLine(shift + x0 + 80, yTop + 10, shift + x1 - 10, yMid);
strokeLine(shift + x0 + 80, yBot, shift + x1 - 10, yMid);

// ---- "ORDER" text ----
ctx.fillStyle = "#000000";
ctx.textBaseline = "alphabetic";
ctx.fillText(text, shift, baseline);

const buf = canvas.toBuffer("image/png");
writeFileSync(new URL("../public/orderx-logo.png", import.meta.url), buf);
console.log(`wrote public/orderx-logo.png (${buf.length} bytes, ${canvas.width}x${canvas.height})`);

// ---- ASCII preview so the shape can be sanity-checked in a terminal ----
const cols = 200;
const rows = 52;
const small = createCanvas(cols, rows);
const sctx = small.getContext("2d");
sctx.drawImage(canvas, 0, 0, cols, rows);
const px = sctx.getImageData(0, 0, cols, rows).data;
for (let y = 0; y < rows; y += 1) {
  let line = "";
  for (let x = 0; x < cols; x += 1) {
    const i = (y * cols + x) * 4;
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    line += lum < 128 ? "#" : ".";
  }
  console.log(line);
}