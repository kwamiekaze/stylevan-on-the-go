import * as THREE from 'three';
import { brand, palette } from '@/config/brand';

/** Small seeded PRNG so the marble looks identical on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export type LiverySpec = {
  width: number;
  height: number;
  seed: number;
  wordmarkY: number;
  taglineY: number;
  iconsY: number;
  wordmarkSize: number;
  /** Where the logo sits horizontally (0..1). */
  centerX?: number;
  /** Draw text mirrored so it reads correctly from the opposite side. */
  showPhone?: boolean;
};

function marbleBand(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = rng(seed);
  // wavy swoosh path across the lower body
  const top = h * 0.62;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, top + h * 0.05);
  ctx.bezierCurveTo(w * 0.22, top - h * 0.12, w * 0.4, top + h * 0.14, w * 0.62, top - h * 0.02);
  ctx.bezierCurveTo(w * 0.8, top - h * 0.14, w * 0.9, top + h * 0.06, w, top - h * 0.06);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.clip();
  const g = ctx.createLinearGradient(0, top - h * 0.15, w, h);
  g.addColorStop(0, palette.blush);
  g.addColorStop(0.5, '#f0cfd0');
  g.addColorStop(1, palette.blushDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // soft white clouds
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = top - 40 + r() * (h - top + 40), rad = 60 + r() * 200;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, 'rgba(255,255,255,.35)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // gold veins
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    let x = r() * w * 0.4, y = top + r() * (h - top);
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 4 + Math.floor(r() * 3);
    for (let s = 0; s < segs; s++) {
      const nx = x + 60 + r() * 220, ny = y + (r() - 0.5) * 150;
      ctx.bezierCurveTo(x + 40, y + (r() - 0.5) * 90, nx - 40, ny + (r() - 0.5) * 90, nx, ny);
      x = nx; y = ny;
    }
    ctx.strokeStyle = `rgba(195,154,98,${0.25 + r() * 0.5})`;
    ctx.lineWidth = 1 + r() * 3.5;
    ctx.stroke();
  }
  ctx.restore();
  // gold piping along the swoosh edge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, top + h * 0.05);
  ctx.bezierCurveTo(w * 0.22, top - h * 0.12, w * 0.4, top + h * 0.14, w * 0.62, top - h * 0.02);
  ctx.bezierCurveTo(w * 0.8, top - h * 0.14, w * 0.9, top + h * 0.06, w, top - h * 0.06);
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = h * 0.012;
  ctx.stroke();
  ctx.restore();
}

function icon(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = palette.wine;
  ctx.fillStyle = 'none';
  ctx.lineWidth = s * 0.07;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'SALON') { // scissors
    ctx.arc(-s * .22, s * .32, s * .16, 0, Math.PI * 2);
    ctx.moveTo(s * .38, s * .32); ctx.arc(s * .22, s * .32, s * .16, 0, Math.PI * 2);
    ctx.moveTo(-s * .12, s * .2); ctx.lineTo(s * .2, -s * .48);
    ctx.moveTo(s * .12, s * .2); ctx.lineTo(-s * .2, -s * .48);
  } else if (kind === 'BARBER') { // barber pole
    ctx.rect(-s * .16, -s * .4, s * .32, s * .8);
    ctx.moveTo(-s * .16, -s * .2); ctx.lineTo(s * .16, -s * .05);
    ctx.moveTo(-s * .16, s * .05); ctx.lineTo(s * .16, s * .2);
    ctx.moveTo(-s * .22, -s * .48); ctx.lineTo(s * .22, -s * .48);
    ctx.moveTo(-s * .22, s * .48); ctx.lineTo(s * .22, s * .48);
  } else if (kind === 'NAILS') { // polish bottle
    ctx.rect(-s * .2, -s * .02, s * .4, s * .5);
    ctx.moveTo(-s * .07, -s * .02); ctx.lineTo(-s * .07, -s * .46);
    ctx.lineTo(s * .07, -s * .46); ctx.lineTo(s * .07, -s * .02);
  } else { // lashes: eye with lashes
    ctx.moveTo(-s * .42, s * .05);
    ctx.quadraticCurveTo(0, s * .4, s * .42, s * .05);
    ctx.moveTo(-s * .3, s * .02); ctx.lineTo(-s * .4, -s * .22);
    ctx.moveTo(-s * .1, s * .1); ctx.lineTo(-s * .14, -s * .3);
    ctx.moveTo(s * .1, s * .1); ctx.lineTo(s * .14, -s * .3);
    ctx.moveTo(s * .3, s * .02); ctx.lineTo(s * .4, -s * .22);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draw the entire side panel: white body, marble swoosh, logo, service icons. */
export function drawLivery(canvas: HTMLCanvasElement, spec: LiverySpec) {
  const { width: w, height: h } = spec;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, palette.cream);
  bg.addColorStop(1, palette.ivory);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  marbleBand(ctx, w, h, spec.seed);

  const cx = w * (spec.centerX ?? 0.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.wine;
  const wm = h * spec.wordmarkSize;
  ctx.font = `600 ${wm}px "Cormorant Garamond", Georgia, serif`;
  // manual letter spacing
  const text = brand.wordmark;
  const spacing = wm * 0.08;
  const widths = [...text].map(ch => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, h * spec.wordmarkY); x += widths[i]; });
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(cx + total * 0.08, h * spec.taglineY);
  ctx.rotate(-0.055);
  ctx.font = `${wm * 1.02}px "Italianno", "Snell Roundhand", cursive`;
  ctx.fillText(brand.tagline, 0, 0);
  ctx.restore();

  // service icons row
  const n = brand.services.length;
  const rowW = Math.min(w * 0.8, total * 1.05);
  const isize = wm * 0.5;
  brand.services.forEach((label, i) => {
    const ix = cx - rowW / 2 + (rowW / (n - 1 || 1)) * i;
    icon(ctx, label, ix, h * spec.iconsY, isize);
    ctx.fillStyle = palette.wine;
    ctx.font = `600 ${wm * 0.17}px "Manrope", Arial, sans-serif`;
    ctx.fillText(label, ix, h * spec.iconsY + isize * 0.85);
  });
  // web / phone line
  const contact = [brand.phone, brand.website].filter(Boolean).join('   ·   ');
  if (spec.showPhone && contact) {
    ctx.fillStyle = palette.wine;
    ctx.font = `700 ${wm * 0.2}px "Manrope", Arial, sans-serif`;
    ctx.fillText(contact, cx, h * 0.93);
  }
}

/** Creates a CanvasTexture that redraws once web fonts finish loading. */
export function createLiveryTexture(spec: LiverySpec) {
  const canvas = document.createElement('canvas');
  drawLivery(canvas, spec);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const redraw = () => { drawLivery(canvas, spec); texture.needsUpdate = true; };
  if (typeof document !== 'undefined' && document.fonts) {
    Promise.all([
      document.fonts.load('600 80px "Cormorant Garamond"'),
      document.fonts.load('80px "Italianno"'),
      document.fonts.load('600 40px "Manrope"'),
    ]).then(redraw).catch(() => undefined);
  }
  return texture;
}

/** Interior wall sign: wordmark + tagline on transparent-looking cream, no marble. */
export function drawSign(canvas: HTMLCanvasElement, w = 1600, h = 380) {
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.goldBright;
  ctx.shadowColor = 'rgba(255,200,140,.9)';
  ctx.shadowBlur = 18;
  const wm = h * 0.42;
  ctx.font = `600 ${wm}px "Cormorant Garamond", Georgia, serif`;
  const text = brand.wordmark;
  const spacing = wm * 0.1;
  const widths = [...text].map(ch => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = w / 2 - total / 2;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, h * 0.36); x += widths[i]; });
  ctx.textAlign = 'center';
  ctx.font = `${wm * 1.05}px "Italianno", cursive`;
  ctx.fillText(brand.tagline, w / 2, h * 0.78);
}

export function createSignTexture() {
  const canvas = document.createElement('canvas');
  drawSign(canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const redraw = () => { drawSign(canvas); texture.needsUpdate = true; };
  if (typeof document !== 'undefined' && document.fonts) {
    Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'), document.fonts.load('80px "Italianno"')]).then(redraw).catch(() => undefined);
  }
  return texture;
}
