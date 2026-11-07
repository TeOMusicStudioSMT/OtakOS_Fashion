/**
 * 🌀 Kompozycja 360° — strefy nadruku rysowane na Canvas 2D (przód: plakat / herb, plecy: opowieść, rękawy: pasy).
 * Motyw z Pracowni Katedry (tło wycinane kolorem rogu) dostaje aureolę alchemiczną, krąg run, gwiazdozbiór
 * i typografię. Wszystko deterministyczne z id motywu (ten sam motyw = ta sama konstelacja). Pliki: PNG z przezroczystością.
 */
export interface TekstKolekcji { tytul?: string; podtytul?: string; zywiol?: string; opowiesc?: string; cytat?: string; edycja?: string; blok?: string; sentencja?: string }
export interface Paleta { tusz: string; zloto: string; akcent: string; cien: string }

const RUNY = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
const JASNE = ['bialy', 'piaskowy'];
export const paleta = (kolor: string): Paleta => JASNE.includes(kolor)
  ? { tusz: '#1a1a22', zloto: '#8a5a12', akcent: '#0f766e', cien: 'rgba(0,0,0,0.18)' }
  : { tusz: '#f4ead5', zloto: '#d9a441', akcent: '#34d399', cien: 'rgba(245,158,11,0.28)' };

/** Imię z opisu Pracowni („Mini-TeOgochi „Bliznota”: …” → Bliznota). */
export const imieZOpisu = (opis: string) => (/[„"]([^"”]{2,30})[”"]/.exec(opis)?.[1] ?? opis.split(/[:,.]/)[0]).trim().slice(0, 30);

export function losowe(ziarno: string) {
  let h = 2166136261;
  for (const c of ziarno) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
export const plotno = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export async function wczytajMotyw(id: string): Promise<HTMLImageElement> {
  // onload, nie img.decode(): decode() w karcie w tle potrafi czekać bez końca
  const img = new Image();
  await new Promise<void>((ok, nie) => { img.onload = () => ok(); img.onerror = () => nie(new Error('obraz motywu nie przyszedł')); img.src = `/api/nadruki/motyw/${encodeURIComponent(id)}`; });
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
export function tekstSrodek(g: CanvasRenderingContext2D, t: string, x: number, y: number, font: string, kolor: string, odstep = 0, maxW = Infinity) {
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
export function zawin(g: CanvasRenderingContext2D, t: string, szer: number): string[] {
  const linie: string[] = []; let l = '';
  for (const s of t.split(/\s+/)) { const pr = l ? `${l} ${s}` : s; if (g.measureText(pr).width > szer && l) { linie.push(l); l = s; } else l = pr; }
  if (l) linie.push(l);
  return linie;
}

/** Aureola 0.00G: kręgi, krąg run, heksagram, gwiazdozbiór i poświata — tło, z którego „wychodzi” postać. */
export function aureola(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, pal: Paleta, los: () => number) {
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

export function postac(g: CanvasRenderingContext2D, m: HTMLCanvasElement, cx: number, cy: number, maxW: number, maxH: number) {
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
  tekstSrodek(g, '0.00G STYLE  //  KATEDRA OTAKOS', S / 2, S * 0.975, `500 ${S * 0.018}px "JetBrains Mono", monospace`, pal.tusz, S * 0.006);
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

/** Etykieta żywiołu na karcie lore — w języku napisów (ustawia Kolekcja360). */
const ETYKIETA_ZYWIOLU: Record<string, string> = { pl: 'ŻYWIOŁ', en: 'ELEMENT', de: 'ELEMENT', es: 'ELEMENTO', fr: 'ÉLÉMENT', it: 'ELEMENTO', ja: '属性', uk: 'СТИХІЯ' };
let jezykNapisow = 'pl';
export function ustawJezykNapisow(j: string) { jezykNapisow = ETYKIETA_ZYWIOLU[j] ? j : 'pl'; }

/** PLECY — Opowieść: pieczęć przy karku, wielka postać w aureoli, karta lore (tytuł, żywioł, opowieść, cytat, edycja). */
export function plecy(m: HTMLCanvasElement, t: TekstKolekcji, pal: Paleta, ziarno: string, W = 4096, H = 5120): HTMLCanvasElement {
  const c = plotno(W, H), g = c.getContext('2d')!, los = losowe(`${ziarno}-plecy`);
  tekstSrodek(g, '✦  TEOSTORY.STUDIO  ✦', W / 2, H * 0.03, `600 ${W * 0.022}px Cinzel, Georgia, serif`, pal.zloto, W * 0.008);
  g.strokeStyle = pal.zloto; g.lineWidth = W * 0.002; g.beginPath(); g.moveTo(W * 0.3, H * 0.05); g.lineTo(W * 0.7, H * 0.05); g.stroke();
  aureola(g, W / 2, H * 0.34, W * 0.36, pal, los);
  postac(g, m, W / 2, H * 0.34, W * 0.6, H * 0.5);
  tekstSrodek(g, (t.tytul || '').toUpperCase(), W / 2, H * 0.655, `900 ${W * 0.1}px Cinzel, Georgia, serif`, pal.tusz, W * 0.012, W * 0.9);
  const pod = [t.podtytul, t.zywiol && `${ETYKIETA_ZYWIOLU[jezykNapisow]}: ${t.zywiol.toUpperCase()}`].filter(Boolean).join('   ·   ');
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
  tekstSrodek(g, strona === 'l' ? '0.00G STYLE  //  OTAKOS' : `${(t.tytul || 'TEOSTORY').toUpperCase()}  //  0.00G`, 0, 0, `800 ${W * 0.16}px Cinzel, Georgia, serif`, pal.tusz, W * 0.03);
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

// ═══════════════════ 🧵 HAFT NICIĄ & NASZYWKI CHENILLE (styl „haft”) ═══════════════════
const KREM = '#f3ead6', CZERN = '#141414';

/** Sylwetka (alfa) rozlana o r px — obrys filcu/konturu: kopie sylwetki w 24 kierunkach. */
export function rozlej(src: HTMLCanvasElement, r: number, kolor: string): HTMLCanvasElement {
  const c = plotno(src.width + r * 2, src.height + r * 2), g = c.getContext('2d')!;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.drawImage(src, r + Math.cos(a) * r, r + Math.sin(a) * r); }
  g.drawImage(src, r, r);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = kolor; g.fillRect(0, 0, c.width, c.height);
  return c;
}
/** Ukośny ścieg nici na tym, co już narysowane (tylko w obrębie kształtu). */
function scieg(g: CanvasRenderingContext2D, w: number, h: number, krok: number, alfa = 0.1) {
  g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alfa; g.strokeStyle = '#000'; g.lineWidth = Math.max(1, krok * 0.25);
  g.beginPath(); for (let x = -h; x < w; x += krok) { g.moveTo(x, 0); g.lineTo(x + h, h); } g.stroke();
  g.globalAlpha = alfa * 0.8; g.strokeStyle = '#fff'; g.beginPath(); for (let x = -h + krok / 2; x < w; x += krok) { g.moveTo(x, 0); g.lineTo(x + h, h); } g.stroke();
  g.restore();
}
/** Zbiera warstwy naszywki: cień (wypukłość) → filc kremowy → czarny kontur → treść ze ściegiem. */
function zszyj(tresc: HTMLCanvasElement, S: number, filc = KREM): HTMLCanvasElement {
  const rf = Math.round(S * 0.035), rk = Math.round(S * 0.01);
  const kontur = rozlej(tresc, rk, CZERN), felt = rozlej(kontur, rf, filc);
  const c = plotno(felt.width + S * 0.04, felt.height + S * 0.04), g = c.getContext('2d')!;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = S * 0.025; g.shadowOffsetX = S * 0.008; g.shadowOffsetY = S * 0.014;
  g.drawImage(felt, 0, 0); g.restore();
  // brzeg filcu przeszyty (przerywany ścieg wzdłuż obrysu)
  const fg = felt.getContext('2d')!; scieg(fg, felt.width, felt.height, S * 0.012, 0.06);
  g.drawImage(felt, 0, 0);
  const t = plotno(tresc.width, tresc.height), tg = t.getContext('2d')!; tg.drawImage(tresc, 0, 0); scieg(tg, t.width, t.height, S * 0.008, 0.12);
  g.drawImage(kontur, rf, rf); g.drawImage(t, rf + rk, rf + rk);
  return c;
}
/** Postać → naszywka: plamy barwne (posteryzacja), twarda alfa, czarny kontur, kremowy filc, ścieg, cień. */
export function naszywkaPostaci(m: HTMLCanvasElement, S = 2400): HTMLCanvasElement {
  const s = Math.min((S * 0.86) / m.width, (S * 0.86) / m.height);
  const p = plotno(Math.round(m.width * s), Math.round(m.height * s)), g = p.getContext('2d')!;
  g.imageSmoothingQuality = 'high'; g.drawImage(m, 0, 0, p.width, p.height);
  const d = g.getImageData(0, 0, p.width, p.height), px = d.data, krok = 56;
  for (let i = 0; i < px.length; i += 4) {
    for (let k = 0; k < 3; k++) px[i + k] = Math.min(255, Math.round(px[i + k] / krok) * krok);
    px[i + 3] = px[i + 3] > 120 ? 255 : 0;
  }
  g.putImageData(d, 0, 0);
  return zszyj(p, S);
}
/** Napis blokowy Varsity (Graduate) w podwójnej haftowanej ramce. `pion` = do góry nogami w bok (plecy). */
export function naszywkaBlok(tekst: string, pal: Paleta, S = 2400, pion = false): HTMLCanvasElement {
  const t = (tekst || '0.00G').toUpperCase();
  const tmp = plotno(10, 10).getContext('2d')!; tmp.font = `${S * 0.2}px Graduate, Cinzel, serif`;
  const szer = Math.min(S * 2.2, tmp.measureText(t).width + S * 0.16), wys = S * 0.34;
  const c = plotno(Math.round(szer), Math.round(wys)), g = c.getContext('2d')!;
  g.fillStyle = pal.zloto === '#d9a441' ? '#7a1f1f' : '#1b2340'; g.fillRect(0, 0, szer, wys);   // tło łaty
  g.strokeStyle = KREM; g.lineWidth = S * 0.012; g.strokeRect(S * 0.02, S * 0.02, szer - S * 0.04, wys - S * 0.04);
  g.lineWidth = S * 0.005; g.strokeRect(S * 0.045, S * 0.045, szer - S * 0.09, wys - S * 0.09);
  g.font = `${S * 0.2}px Graduate, Cinzel, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = S * 0.03; g.strokeStyle = CZERN; g.strokeText(t, szer / 2, wys / 2 + S * 0.01);
  g.fillStyle = KREM; g.fillText(t, szer / 2, wys / 2 + S * 0.01);
  const z = zszyj(c, S, KREM);
  if (!pion) return z;
  const r = plotno(z.height, z.width), rg = r.getContext('2d')!;
  rg.translate(0, r.height); rg.rotate(-Math.PI / 2); rg.drawImage(z, 0, 0);
  return r;
}
/** Haft kaligraficzny (Great Vibes): nić kremowa z cienkim konturem i cieniem — bez łaty, prosto na materiale. */
export function haftKursywa(tekst: string, S = 3000, kolorNici = KREM): HTMLCanvasElement {
  // najwyżej 2 linie: czcionka maleje, aż sentencja się zmieści (haft nie zjeżdża na ściągacz)
  const tmp = plotno(10, 10).getContext('2d')!;
  let roz = 0.12, font = '', linie: string[] = [];
  for (; roz >= 0.06; roz -= 0.01) { font = `${S * roz}px "Great Vibes", Georgia, serif`; tmp.font = font; linie = zawin(tmp, tekst || '', S * 0.95); if (linie.length <= 2) break; }
  linie = linie.slice(0, 2);
  const c = plotno(S, Math.round(S * roz * 1.2 * linie.length + S * 0.06)), g = c.getContext('2d')!;
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  linie.forEach((l, i) => {
    const y = S * (roz * 0.85) + i * S * roz * 1.2;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = S * 0.006; g.shadowOffsetY = S * 0.004;
    g.lineWidth = S * 0.006; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(l, S / 2, y); g.restore();
    g.fillStyle = kolorNici; g.fillText(l, S / 2, y);
  });
  scieg(g, c.width, c.height, S * 0.006, 0.12);
  return c;
}
/** Okrągła naszywka-symbol (np. „8 / ∞”, runa, żywioł) na rękaw. */
export function naszywkaSymbol(glowny: string, podpis: string, pal: Paleta, S = 1600): HTMLCanvasElement {
  const c = plotno(S, S), g = c.getContext('2d')!;
  g.fillStyle = KREM; g.beginPath(); g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = pal.zloto; g.lineWidth = S * 0.03; g.beginPath(); g.arc(S / 2, S / 2, S * 0.34, 0, Math.PI * 2); g.stroke();
  g.fillStyle = CZERN; g.font = `${S * 0.34}px Graduate, Cinzel, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(glowny, S / 2, S * 0.47);
  g.font = `${S * 0.08}px Graduate, Cinzel, serif`; g.fillText(podpis.toUpperCase().slice(0, 14), S / 2, S * 0.72);
  return zszyj(c, S, KREM);
}
/** Głowa postaci (górna część naszywki) — pierwsza naszywka na rękaw. */
export function naszywkaGlowy(m: HTMLCanvasElement, S = 1600): HTMLCanvasElement {
  const h = Math.round(m.height * 0.34), c = plotno(m.width, h);
  c.getContext('2d')!.drawImage(m, 0, 0, m.width, h, 0, 0, m.width, h);
  return naszywkaPostaci(c, S);
}
/** Plecy haftowane: pionowy blok z lewej, wielka naszywka postaci z prawej. */
export function plecyHaft(m: HTMLCanvasElement, t: TekstKolekcji, pal: Paleta, W = 4096, H = 4096): HTMLCanvasElement {
  const c = plotno(W, H), g = c.getContext('2d')!;
  const blok = naszywkaBlok(t.blok || t.tytul || '0.00G', pal, 2400, true);
  const sb = Math.min((W * 0.3) / blok.width, (H * 0.92) / blok.height);
  g.drawImage(blok, W * 0.04, (H - blok.height * sb) / 2, blok.width * sb, blok.height * sb);
  const n = naszywkaPostaci(m, 2400), sn = Math.min((W * 0.62) / n.width, (H * 0.95) / n.height);
  g.drawImage(n, W * 0.36 + (W * 0.62 - n.width * sn) / 2, (H - n.height * sn) / 2, n.width * sn, n.height * sn);
  return c;
}
