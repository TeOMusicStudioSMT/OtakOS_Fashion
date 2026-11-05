/**
 * 🌀 Kompozycja 360° — strefy nadruku rysowane na Canvas 2D (przód: plakat / herb, plecy: opowieść, rękawy: pasy).
 * Motyw z Pracowni Katedry (tło wycinane kolorem rogu) dostaje aureolę alchemiczną, krąg run, gwiazdozbiór
 * i typografię. Wszystko deterministyczne z id motywu (ten sam motyw = ta sama konstelacja). Pliki: PNG z przezroczystością.
 */
export interface TekstKolekcji { tytul?: string; podtytul?: string; zywiol?: string; opowiesc?: string; cytat?: string; edycja?: string }
export interface Paleta { tusz: string; zloto: string; akcent: string; cien: string }

const RUNY = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
const JASNE = ['bialy', 'piaskowy'];
export const paleta = (kolor: string): Paleta => JASNE.includes(kolor)
  ? { tusz: '#1a1a22', zloto: '#8a5a12', akcent: '#0f766e', cien: 'rgba(0,0,0,0.18)' }
  : { tusz: '#f4ead5', zloto: '#d9a441', akcent: '#34d399', cien: 'rgba(245,158,11,0.28)' };

/** Imię z opisu Pracowni („Mini-TeOgochi „Bliznota”: …” → Bliznota). */
export const imieZOpisu = (opis: string) => (/[„"]([^"”]{2,30})[”"]/.exec(opis)?.[1] ?? opis.split(/[:,.]/)[0]).trim().slice(0, 30);

function losowe(ziarno: string) {
  let h = 2166136261;
  for (const c of ziarno) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
const plotno = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export async function wczytajMotyw(id: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = `/api/nadruki/motyw/${encodeURIComponent(id)}`;
  await img.decode();
  return img;
}

/** Tło motywu → przezroczyste (kolor z rogu, miękka krawędź), przycięte do treści. */
export function wytnijTlo(img: HTMLImageElement, tolerancja = 46): HTMLCanvasElement {
  const c = plotno(img.naturalWidth, img.naturalHeight), g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const [r0, g0, b0] = [p[0], p[1], p[2]];
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let i = 0; i < p.length; i += 4) {
    const dl = Math.hypot(p[i] - r0, p[i + 1] - g0, p[i + 2] - b0);
    if (dl < tolerancja) p[i + 3] = 0; else if (dl < tolerancja * 1.6) p[i + 3] = Math.round(255 * (dl - tolerancja) / (tolerancja * 0.6));
    if (p[i + 3] > 20) { const k = i / 4, x = k % c.width, y = (k / c.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  g.putImageData(d, 0, 0);
  if (x1 <= x0 || y1 <= y0) return c;
  const out = plotno(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Napis na środku; `maxW` = zmniejsz czcionkę, aż się zmieści (nic nie ucina się na brzegu nadruku). */
function tekstSrodek(g: CanvasRenderingContext2D, t: string, x: number, y: number, font: string, kolor: string, odstep = 0, maxW = Infinity) {
  g.fillStyle = kolor; g.textAlign = 'center'; g.textBaseline = 'middle';
  (g as any).letterSpacing = `${odstep}px`;
  g.font = font;
  const m = /(\d+(?:\.\d+)?)px/.exec(font);
  for (let skala = 1; m && skala > 0.3 && g.measureText(t).width > maxW; skala -= 0.05) {
    g.font = font.replace(m[0], `${Number(m[1]) * skala}px`);
    (g as any).letterSpacing = `${odstep * skala}px`;
  }
  g.fillText(t, x, y);
  (g as any).letterSpacing = '0px';
}
function zawin(g: CanvasRenderingContext2D, t: string, szer: number): string[] {
  const linie: string[] = []; let l = '';
  for (const s of t.split(/\s+/)) { const pr = l ? `${l} ${s}` : s; if (g.measureText(pr).width > szer && l) { linie.push(l); l = s; } else l = pr; }
  if (l) linie.push(l);
  return linie;
}

/** Aureola 0.00G: kręgi, krąg run, heksagram, gwiazdozbiór i poświata — tło, z którego „wychodzi” postać. */
function aureola(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, pal: Paleta, los: () => number) {
  const grad = g.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.05);
  grad.addColorStop(0, pal.cien); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r * 1.05, 0, Math.PI * 2); g.fill();
  g.strokeStyle = pal.zloto; g.lineWidth = r * 0.012; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.004; g.beginPath(); g.arc(cx, cy, r * 0.9, 0, Math.PI * 2); g.stroke();
  g.globalAlpha = 0.5; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, Math.PI * 2); g.stroke();
  // krąg run między kręgami
  g.globalAlpha = 0.9; g.fillStyle = pal.zloto; g.font = `${Math.round(r * 0.06)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    g.save(); g.translate(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95); g.rotate(a + Math.PI / 2);
    g.fillText(RUNY[Math.floor(los() * RUNY.length)], 0, 0); g.restore();
  }
  // heksagram i linie konstrukcyjne
  g.globalAlpha = 0.35; g.lineWidth = r * 0.003;
  for (const obrot of [0, Math.PI]) {
    g.beginPath();
    for (let i = 0; i <= 3; i++) { const a = obrot - Math.PI / 2 + (i * 2 * Math.PI) / 3; const x = cx + Math.cos(a) * r * 0.9, y = cy + Math.sin(a) * r * 0.9; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  }
  g.beginPath(); g.moveTo(cx - r * 1.12, cy); g.lineTo(cx + r * 1.12, cy); g.moveTo(cx, cy - r * 1.12); g.lineTo(cx, cy + r * 1.12); g.stroke();
  // gwiazdozbiór w pierścieniu zewnętrznym
  g.globalAlpha = 0.8; g.fillStyle = pal.tusz; g.strokeStyle = pal.tusz; g.lineWidth = r * 0.0025;
  let poprz: [number, number] | null = null;
  for (let i = 0; i < 14; i++) {
    const a = los() * Math.PI * 2, d = r * (0.66 + los() * 0.22), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    g.beginPath(); g.arc(x, y, r * (0.006 + los() * 0.008), 0, Math.PI * 2); g.fill();
    if (poprz && los() > 0.45) { g.globalAlpha = 0.3; g.beginPath(); g.moveTo(...poprz); g.lineTo(x, y); g.stroke(); g.globalAlpha = 0.8; }
    poprz = [x, y];
  }
  g.globalAlpha = 1;
}

function postac(g: CanvasRenderingContext2D, m: HTMLCanvasElement, cx: number, cy: number, maxW: number, maxH: number) {
  const s = Math.min(maxW / m.width, maxH / m.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(m, cx - (m.width * s) / 2, cy - (m.height * s) / 2, m.width * s, m.height * s);
}

/** PRZÓD — Pełny Plakat: tytuł nad aureolą, postać wychodzi z portalu, podtytuł i frakcja pod spodem. */
export function przodPlakat(m: HTMLCanvasElement, t: TekstKolekcji, pal: Paleta, ziarno: string, S = 4096): HTMLCanvasElement {
  const c = plotno(S, S), g = c.getContext('2d')!, los = losowe(ziarno);
  aureola(g, S / 2, S * 0.53, S * 0.36, pal, los);
  postac(g, m, S / 2, S * 0.53, S * 0.6, S * 0.66);
  tekstSrodek(g, (t.tytul || '').toUpperCase(), S / 2, S * 0.09, `900 ${S * 0.09}px Cinzel, Georgia, serif`, pal.tusz, S * 0.012, S * 0.9);
  tekstSrodek(g, t.podtytul || '', S / 2, S * 0.925, `600 ${S * 0.034}px Cinzel, Georgia, serif`, pal.zloto, S * 0.004, S * 0.9);
  tekstSrodek(g, 'TETHERIA  //  OTAKOS  ·  0.00G', S / 2, S * 0.975, `500 ${S * 0.018}px "JetBrains Mono", monospace`, pal.tusz, S * 0.006);
  return c;
}

/** PRZÓD — Herb na Sercu: mały emblemat z imieniem (główna grafika idzie na plecy). */
export function przodHerb(m: HTMLCanvasElement, t: TekstKolekcji, pal: Paleta, ziarno: string, S = 1600): HTMLCanvasElement {
  const c = plotno(S, S), g = c.getContext('2d')!, los = losowe(ziarno);
  aureola(g, S / 2, S * 0.44, S * 0.36, pal, los);
  postac(g, m, S / 2, S * 0.44, S * 0.5, S * 0.58);
  tekstSrodek(g, (t.tytul || '').toUpperCase(), S / 2, S * 0.9, `900 ${S * 0.085}px Cinzel, Georgia, serif`, pal.tusz, S * 0.01, S * 0.92);
  return c;
}

/** PLECY — Opowieść: pieczęć przy karku, wielka postać w aureoli, karta lore (tytuł, żywioł, opowieść, cytat, edycja). */
export function plecy(m: HTMLCanvasElement, t: TekstKolekcji, pal: Paleta, ziarno: string, W = 4096, H = 5120): HTMLCanvasElement {
  const c = plotno(W, H), g = c.getContext('2d')!, los = losowe(`${ziarno}-plecy`);
  tekstSrodek(g, '✦  TEOSTORY.STUDIO  ✦', W / 2, H * 0.03, `600 ${W * 0.022}px Cinzel, Georgia, serif`, pal.zloto, W * 0.008);
  g.strokeStyle = pal.zloto; g.lineWidth = W * 0.002; g.beginPath(); g.moveTo(W * 0.3, H * 0.05); g.lineTo(W * 0.7, H * 0.05); g.stroke();
  aureola(g, W / 2, H * 0.34, W * 0.36, pal, los);
  postac(g, m, W / 2, H * 0.34, W * 0.6, H * 0.5);
  tekstSrodek(g, (t.tytul || '').toUpperCase(), W / 2, H * 0.655, `900 ${W * 0.1}px Cinzel, Georgia, serif`, pal.tusz, W * 0.012, W * 0.9);
  const pod = [t.podtytul, t.zywiol && `ŻYWIOŁ: ${t.zywiol.toUpperCase()}`].filter(Boolean).join('   ·   ');
  tekstSrodek(g, pod, W / 2, H * 0.71, `600 ${W * 0.03}px Cinzel, Georgia, serif`, pal.zloto, W * 0.004, W * 0.86);
  // karta opowieści (ramka 0.735–0.895), cytat i edycja pod nią — każde w swoim pasie
  g.strokeStyle = pal.zloto; g.globalAlpha = 0.7; g.lineWidth = W * 0.0018;
  g.strokeRect(W * 0.12, H * 0.735, W * 0.76, H * 0.16); g.globalAlpha = 1;
  g.font = `400 ${W * 0.027}px "Plus Jakarta Sans", Georgia, serif`; g.fillStyle = pal.tusz; g.textAlign = 'center'; g.textBaseline = 'middle';
  const linie = zawin(g, t.opowiesc || '', W * 0.68).slice(0, 5), krok = W * 0.036;
  const y0 = H * 0.815 - ((linie.length - 1) * krok) / 2;
  linie.forEach((l, i) => g.fillText(l, W / 2, y0 + i * krok));
  if (t.cytat) tekstSrodek(g, `„${t.cytat}”`, W / 2, H * 0.925, `italic 400 ${W * 0.026}px Georgia, serif`, pal.zloto, 0, W * 0.86);
  tekstSrodek(g, t.edycja || 'ARCHIVE // 0.00G', W / 2, H * 0.972, `500 ${W * 0.02}px "JetBrains Mono", monospace`, pal.tusz, W * 0.006, W * 0.86);
  return c;
}

/** RĘKAW — pionowy pas: emblemat żywiołu, kaskada run, frakcja pionowo, fala 432 Hz. */
export function rekaw(t: TekstKolekcji, pal: Paleta, ziarno: string, strona: 'l' | 'p', W = 1024, H = 4096): HTMLCanvasElement {
  const c = plotno(W, H), g = c.getContext('2d')!, los = losowe(`${ziarno}-${strona}`);
  g.strokeStyle = pal.zloto; g.lineWidth = W * 0.02; g.beginPath(); g.arc(W / 2, W * 0.55, W * 0.36, 0, Math.PI * 2); g.stroke();
  tekstSrodek(g, (t.zywiol || t.tytul || '0').slice(0, 1).toUpperCase(), W / 2, W * 0.57, `900 ${W * 0.4}px Cinzel, Georgia, serif`, pal.tusz);
  g.save(); g.translate(W * 0.36, H * 0.55); g.rotate(-Math.PI / 2);
  tekstSrodek(g, strona === 'l' ? 'TETHERIA  //  OTAKOS' : `${(t.tytul || 'TEOSTORY').toUpperCase()}  //  0.00G`, 0, 0, `800 ${W * 0.16}px Cinzel, Georgia, serif`, pal.tusz, W * 0.03);
  g.restore();
  g.fillStyle = pal.zloto; g.font = `${W * 0.11}px serif`; g.textAlign = 'center';
  for (let i = 0; i < 16; i++) g.fillText(RUNY[Math.floor(los() * RUNY.length)], W * 0.74, H * 0.26 + i * H * 0.042);
  // fala 432 Hz u dołu
  g.strokeStyle = pal.akcent; g.lineWidth = W * 0.012; g.beginPath();
  for (let y = 0; y <= H * 0.12; y += 4) { const x = W / 2 + Math.sin((y / (H * 0.12)) * Math.PI * 8) * W * 0.3; if (y) g.lineTo(x, H * 0.86 + y); else g.moveTo(x, H * 0.86 + y); }
  g.stroke();
  tekstSrodek(g, '432 Hz', W / 2, H * 0.995, `500 ${W * 0.09}px "JetBrains Mono", monospace`, pal.tusz);
  return c;
}

export const doPng = (c: HTMLCanvasElement) => new Promise<Blob>((ok, nie) => c.toBlob((b) => (b ? ok(b) : nie(new Error('Canvas nie oddał PNG.'))), 'image/png'));
