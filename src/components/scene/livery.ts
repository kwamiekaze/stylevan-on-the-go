import * as THREE from 'three';
import { brand, palette } from '@/config/brand';
import { rng as seeded } from './theme';
import { paintWaves } from './Body';

/** Small seeded PRNG so the marble looks identical on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export type LiverySpec = {
  kind: 'van' | 'trailer';
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

function marbleBand(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, topFrac = 0.62) {
  const r = rng(seed);
  // wavy swoosh path across the lower body
  const top = h * topFrac;
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

type Ctx = CanvasRenderingContext2D;

/** Draw text with manual letter spacing, centred on cx. Returns the drawn width. */
function spaced(ctx: Ctx, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text]; const ws = chars.map(ch => ctx.measureText(ch).width + spacing);
  const total = ws.reduce((a, b) => a + b, 0) - spacing;
  const align = ctx.textAlign; ctx.textAlign = 'left';
  let x = cx - total / 2; chars.forEach((ch, i) => { ctx.fillText(ch, x, y); x += ws[i]; });
  ctx.textAlign = align; return total;
}

/** Largest font size (px) at which spaced text fits maxW. */
function fit(ctx: Ctx, text: string, font: (px: number) => string, maxW: number, spacingEm: number) {
  ctx.font = font(100);
  const chars = [...text]; const w = chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacingEm * 100 * (chars.length - 1);
  return (100 * maxW) / w;
}

const SERIF = (px: number) => `700 ${px}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
const SCRIPT = (px: number) => `${px}px "Italianno", "Snell Roundhand", "Brush Script MT", cursive`;
const SANS = (px: number) => `800 ${px}px "Manrope", "Helvetica Neue", Arial, sans-serif`;

function serviceBlock(ctx: Ctx, kind: string, cx: number, cy: number, size: number) {
  icon(ctx, kind, cx, cy, size);
  ctx.fillStyle = palette.wine; ctx.textAlign = 'center'; ctx.font = SANS(size * .42);
  spaced(ctx, kind, cx, cy + size * .95, size * .07);
}

/** Draw the entire side panel: white body, marble swoosh, and a big legible logo lockup. */
export function drawLivery(canvas: HTMLCanvasElement, spec: LiverySpec) {
  const { width: w, height: h } = spec;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (spec.kind === 'van') { drawVanSide(ctx, w, h, spec.seed); return; }
  paintWaves(ctx, w, h, spec.seed, .8);
  ctx.fillStyle = palette.wine; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  const contact = [brand.phone, brand.website].filter(Boolean).join('   ·   ');

  if (spec.kind === 'van') {
    // rear panel is 1.8 m of the 4.3 m side; the wheel arch hides the lowest 22%, the door sits in the middle
    const pw = w * .4186, cx = pw / 2, maxW = pw * .74;
    ctx.font = SANS(h * .026); spaced(ctx, 'THE', cx, h * .1, h * .026 * .5);
    const words = brand.wordmark.replace(/^THE\s+/, '').split(' ');
    let y = h * .2; const px = Math.min(...words.map(t => fit(ctx, t, SERIF, maxW, .08)));
    ctx.font = SERIF(px); words.forEach(t => { y += px * .8; spaced(ctx, t, cx, y, px * .08); y += px * .06; });
    const tp = Math.min(px * .78, fit(ctx, brand.tagline, SCRIPT, maxW, 0));
    ctx.save(); ctx.translate(cx, y + h * .085); ctx.rotate(-.04); ctx.font = SCRIPT(tp); ctx.fillText(brand.tagline, 0, 0); ctx.restore();
    const ly = y + h * .13; ctx.strokeStyle = palette.gold; ctx.lineWidth = h * .004; ctx.beginPath(); ctx.moveTo(cx - maxW / 2, ly); ctx.lineTo(cx + maxW / 2, ly); ctx.stroke();
    const step = maxW / 3, sz = h * .03;
    brand.services.forEach((k, i) => serviceBlock(ctx, k, cx - maxW / 2 + step * i, ly + h * .055, sz));
    if (spec.showPhone && contact) { ctx.fillStyle = palette.wine; ctx.font = SANS(h * .022); spaced(ctx, contact, w * .627, h * .945, h * .022 * .12); }
  } else {
    // trailer: lockup on the centre (awning door), service icons on the two side strips
    const dw = w * .526, cx = w / 2, maxW = dw * .82;
    ctx.font = SANS(h * .034); spaced(ctx, 'THE', cx, h * .17, h * .034 * .5);
    const px = fit(ctx, 'STYLE VAN', SERIF, maxW, .07); ctx.font = SERIF(px); spaced(ctx, 'STYLE VAN', cx, h * .17 + px * .82, px * .07);
    ctx.save(); ctx.translate(cx + 10, h * .17 + px * .82 + h * .17); ctx.rotate(-.04); ctx.font = SCRIPT(px * .82); ctx.fillText(brand.tagline, 0, 0); ctx.restore();
    if (spec.showPhone && contact) { ctx.fillStyle = palette.wine; ctx.font = SANS(h * .03); spaced(ctx, contact, cx, h * .6, h * .03 * .14); }
    const sw = w * .237, sz = h * .075; const [a, b, c, d] = brand.services;
    serviceBlock(ctx, a, sw / 2, h * .22, sz); serviceBlock(ctx, b, sw / 2, h * .44, sz);
    serviceBlock(ctx, c, w - sw / 2, h * .22, sz); serviceBlock(ctx, d, w - sw / 2, h * .44, sz);
  }
}

const liveryCache = new Map<string, THREE.CanvasTexture>();
/** Shared per key so the reflection ghost and the real vehicle reuse one texture. */
export function getLivery(key: string, spec: LiverySpec) {
  let t = liveryCache.get(key);
  if (!t) { t = createLiveryTexture(spec); liveryCache.set(key, t); }
  return t;
}

let marbleTex: THREE.CanvasTexture | null = null;
/** Polished white marble with soft grey and gold veins. */
export function marbleTexture() {
  if (marbleTex) return marbleTex;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!; const r = seeded(17);
  g.fillStyle = '#f6f0ea'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512, rad = 40 + r() * 120; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(210,200,200,.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  for (let i = 0; i < 14; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { const nx = x + (r() - .3) * 130, ny = y + (r() - .5) * 130; g.quadraticCurveTo(x + 30, y + (r() - .5) * 60, nx, ny); x = nx; y = ny; } g.strokeStyle = i % 4 === 0 ? 'rgba(195,154,98,.55)' : 'rgba(140,130,140,.32)'; g.lineWidth = .8 + r() * 1.8; g.stroke(); }
  marbleTex = new THREE.CanvasTexture(c); marbleTex.colorSpace = THREE.SRGBColorSpace; marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping; marbleTex.anisotropy = 8;
  return marbleTex;
}

export function plateTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d')!;
  g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#4e2a35'; g.lineWidth = 5; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = '#4e2a35'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 46px "Manrope", Arial, sans-serif'; g.fillText('STYLE VAN', 128, 52);
  g.font = '30px "Italianno", cursive'; g.fillText(brand.tagline, 128, 96);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
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
      document.fonts.load('700 80px "Cormorant Garamond"'),
      document.fonts.load('80px "Italianno"'),
      document.fonts.load('800 40px "Manrope"'),
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


/** Rear doors: same lockup as the trailer, with all four services and the website. 950 x 1000 per door pair is 1900 x 1000. */
/** Rear barn doors. Two panels, each drawn at the real door aspect (about 0.46), each readable on its own. */
export function drawRear(canvas: HTMLCanvasElement) {
  const w = 1000, h = 1080; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  paintWaves(ctx, w, h, 5, .84);
  ctx.fillStyle = palette.wine; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // left door: stacked wordmark
  const L = 225, maxW = 350;
  ctx.font = SERIF(62); ctx.fillText('The', L, 240);
  const words = titleCase(brand.wordmark.replace(/^THE\s+/i, '')).split(' ');
  const px = Math.min(170, ...words.map(t => fit(ctx, t, SERIF, maxW, 0)));
  ctx.font = SERIF(px); words.forEach((t, i) => ctx.fillText(t, L, 240 + px * .95 * (i + 1)));
  const ly = 240 + px * .95 * words.length + 44;
  ctx.fillRect(L - 110, ly, 220, 3);
  ctx.font = SANS(25); spaced(ctx, brand.tagline.toUpperCase() + '.', L, ly + 58, 3.5);
  // right door: services with icons, then contact
  const R = 760;
  brand.services.forEach((k, i) => serviceBlock(ctx, k, R, 190 + i * 158, 74));
  ctx.fillStyle = palette.wine; ctx.font = SANS(26);
  const contact = [brand.phone, brand.website].filter(Boolean);
  contact.forEach((t, i) => spaced(ctx, t, R, 850 + i * 40, 2.5));
}

let rearTex: THREE.CanvasTexture | null = null;
export function rearTexture() {
  if (rearTex) return rearTex;
  const c = document.createElement('canvas'); drawRear(c);
  rearTex = new THREE.CanvasTexture(c); rearTex.colorSpace = THREE.SRGBColorSpace; rearTex.anisotropy = 8;
  const redraw = () => { drawRear(c); rearTex!.needsUpdate = true; };
  if (typeof document !== 'undefined' && document.fonts) Promise.all([document.fonts.load('700 80px "Cormorant Garamond"'), document.fonts.load('80px "Italianno"'), document.fonts.load('800 40px "Manrope"')]).then(redraw).catch(() => undefined);
  return rearTex;
}

/** Cab door decal so the swoosh carries on from the cargo box. */
export function cabTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 760;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, 760); bg.addColorStop(0, palette.ivory); bg.addColorStop(1, palette.ivory);
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 760);
  marbleBand(g, 1024, 760, 3, .5);
  g.fillStyle = palette.wine; g.textAlign = 'center'; g.font = SERIF(54); spaced(g, 'STYLE VAN', 512, 210, 4);
  g.font = SCRIPT(64); g.fillText(brand.tagline, 512, 290);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}


/* Van side, step van body. Texture spans x -2.85..2.55 and y 0.5..2.78 (metres). */
export const VAN_UV = { x0: -2.85, x1: 2.55, y0: .5, y1: 2.78 };
const titleCase = (t: string) => t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function drawVanSide(ctx: Ctx, w: number, h: number, seed: number) {
  const { x0, x1, y0, y1 } = VAN_UV; const X = (x: number) => ((x - x0) / (x1 - x0)) * w, Y = (y: number) => ((y1 - y) / (y1 - y0)) * h, M = (m: number) => (m / (y1 - y0)) * h;
  paintWaves(ctx, w, h, seed, .8);
  // sweeping ribbon toward the cab
  ctx.save(); const rg = ctx.createLinearGradient(X(1.4), h, X(2.55), 0); rg.addColorStop(0, '#e7bfb6'); rg.addColorStop(1, '#f6e1db');
  ctx.beginPath(); ctx.moveTo(X(1.42), h); ctx.bezierCurveTo(X(1.7), Y(1.4), X(1.9), Y(2.2), X(2.3), 0); ctx.lineTo(w, 0); ctx.lineTo(w, Y(2.1));
  ctx.bezierCurveTo(X(2.35), Y(1.6), X(2.1), Y(1.0), X(2.0), h); ctx.closePath(); ctx.fillStyle = rg; ctx.globalAlpha = .9; ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = palette.gold; ctx.lineWidth = Math.max(2, h * .004); ctx.beginPath(); ctx.moveTo(X(1.36), h); ctx.bezierCurveTo(X(1.64), Y(1.4), X(1.84), Y(2.2), X(2.24), 0); ctx.stroke();
  ctx.lineWidth = Math.max(1.2, h * .0022); ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(X(2.06), h); ctx.bezierCurveTo(X(2.16), Y(1.0), X(2.4), Y(1.6), w, Y(2.16)); ctx.stroke(); ctx.restore();
  // lockup between the side opening and the cab
  const bx = X(-.3), maxW = X(1.2) - bx;
  ctx.fillStyle = palette.wine; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = SERIF(M(.26)); ctx.fillText('The', bx + M(.02), Y(2.36));
  const name = titleCase(brand.wordmark.replace(/^THE\s+/i, ''));
  const px = Math.min(M(.5), fit(ctx, name, SERIF, maxW, .01)); ctx.font = SERIF(px);
  const nw = ctx.measureText(name).width; ctx.fillText(name, bx, Y(1.93));
  const tag = brand.tagline.toUpperCase() + '.';
  ctx.font = SANS(M(.075)); const tw = Math.min(nw, maxW);
  const sp = (tw - ctx.measureText(tag).width) / Math.max(1, tag.length - 1);
  let x = bx + M(.01); [...tag].forEach(ch => { ctx.fillText(ch, x, Y(1.66)); x += ctx.measureText(ch).width + Math.max(0, sp); });
  // side door panel: the four services, two on top and two below, gold hairlines sectioning them off.
  // The far side shows this panel mirrored toward the cab, so the grid stays clear of the cab door seam.
  const dy0 = .95, dy1 = 2.6, cy = (dy0 + dy1) / 2, colA = -1.46, colB = -.8, mid = (colA + colB) / 2;
  ctx.save(); ctx.strokeStyle = palette.gold; ctx.globalAlpha = .55; ctx.lineWidth = Math.max(2, h * .0035);
  ctx.beginPath(); ctx.moveTo(X(mid), Y(dy1 - .12)); ctx.lineTo(X(mid), Y(dy0 + .12)); ctx.moveTo(X(-1.6), Y(cy)); ctx.lineTo(X(-.5), Y(cy)); ctx.stroke(); ctx.restore();
  const topRow = dy0 + (dy1 - dy0) * .73, botRow = dy0 + (dy1 - dy0) * .27;
  const cells: [string, number, number][] = [[brand.services[0], colA, topRow], [brand.services[1], colB, topRow], [brand.services[2], colA, botRow], [brand.services[3], colB, botRow]];
  cells.forEach(([k, xx, yy]) => { ctx.fillStyle = palette.wine; serviceBlock(ctx, k, X(xx), Y(yy) - M(.07), M(.22)); });
  // services line with hairline dividers
  const items = [...brand.services]; ctx.font = SANS(M(.062));
  const gap = M(.16); const widths = items.map(t => ctx.measureText(t).width + t.length * M(.012));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let sx = bx + Math.max(0, (Math.min(maxW, nw) - total) / 2);
  items.forEach((t, i) => { spaced(ctx, t, sx + widths[i] / 2, Y(1.2), M(.012)); sx += widths[i];
    if (i < items.length - 1) { ctx.fillRect(sx + gap / 2 - 1, Y(1.2) - M(.075), Math.max(1.5, M(.006)), M(.09)); sx += gap; } });
}

/** Header above the windshield. Transparent background. */
export function frontHeaderTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const g = c.getContext('2d')!;
  const draw = () => {
    g.clearRect(0, 0, 1024, 300); g.fillStyle = palette.wine; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = SERIF(70); g.fillText('The', 330, 100);
    g.font = SERIF(150); g.fillText(titleCase(brand.wordmark.replace(/^THE\s+/i, '')), 540, 205);
    g.font = SANS(40); spaced(g, brand.tagline.toUpperCase() + '.', 540, 272, 9);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (typeof document !== 'undefined' && document.fonts) Promise.all([document.fonts.load('700 80px "Cormorant Garamond"'), document.fonts.load('800 40px "Manrope"')]).then(() => { draw(); t.needsUpdate = true; }).catch(() => undefined);
  return t;
}
