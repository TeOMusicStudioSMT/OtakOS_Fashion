/**
 * 🛍🖨 Grafika TeO ShoP — pliki produkcyjne rysowane na płótnie przeglądarki.
 *
 * Trzy układy pod trzy linie: `stempel` (Shaumbra Originals), `fala` (0.00G Sessions — typografia
 * z falą dźwiękową) i `box` (Box Editions). Tło ZAWSZE przezroczyste — pod DTG i winyl die-cut.
 *
 * Nadruk jest w jasnym tuszu (biel + złoto Katedry), czyli pod CIEMNE tkaniny. Na jasnej koszulce
 * zniknie — to świadomy wybór jednej wersji na produkt, nie przeoczenie; wersja pod jasne tkaniny
 * to zamiana dwóch kolorów w `TUSZ`.
 */
import { rysujPlik, barwaZId, type Rysunek } from './bestsellery';

export type Uklad = 'stempel' | 'fala' | 'box';
export interface FormatDruku { w: number; h: number }
export interface TekstyDruku { napis: string; podpis: string }

/**
 * 🐾 Postać (albo duet) z Pracowni nad typografią. Rysunek przychodzi już wycięty z tła
 * (`wytnijTlo`), więc kładzie się na tkaninie tak samo jak litery.
 */
function motywWPasie(c: CanvasRenderingContext2D, m: HTMLCanvasElement, W: number, y0: number, y1: number) {
    const pole = { w: W * 0.74, h: y1 - y0 };
    const s = Math.min(pole.w / m.width, pole.h / m.height);
    c.save(); (c as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    c.drawImage(m, W / 2 - (m.width * s) / 2, y1 - m.height * s, m.width * s, m.height * s);
    c.restore();
}

/** Składa jedną albo dwie postacie w jeden rysunek — duet staje obok siebie, równo na dolnej linii. */
export function zlozPostacie(obrazy: HTMLCanvasElement[]): HTMLCanvasElement | null {
    const lista = obrazy.filter((o) => o && o.width > 0 && o.height > 0);
    if (!lista.length) return null;
    if (lista.length === 1) return lista[0];
    const H = Math.max(...lista.map((o) => o.height));
    const skale = lista.map((o) => H / o.height);
    const przerwa = H * 0.04;
    const W = lista.reduce((s, o, i) => s + o.width * skale[i], 0) + przerwa * (lista.length - 1);
    const c = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H);
    const g = c.getContext('2d')!;
    (g as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    let x = 0;
    lista.forEach((o, i) => { const w = o.width * skale[i]; g.drawImage(o, x, 0, w, H); x += w + przerwa; });
    return c;
}

export const TUSZ = { glowny: '#f4efe4', zloto: '#e6c47c', cien: 'rgba(230,180,90,0.55)' };
const SZERYF = '"Cinzel", "Cormorant Garamond", Georgia, serif';
const PROSTY = '"Syne", "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
const MONO = '"JetBrains Mono", "Consolas", monospace';

function napis(c: CanvasRenderingContext2D, t: string, x: number, y: number, font: string, kolor: string, odstep = 0) {
    c.font = font; c.fillStyle = kolor; c.textAlign = 'center'; c.textBaseline = 'middle';
    (c as unknown as { letterSpacing: string }).letterSpacing = `${odstep}px`;
    c.fillText(t, x, y);
    (c as unknown as { letterSpacing: string }).letterSpacing = '0px';
}
/** Łamie napis na linie mieszczące się w `maxSzer` — przy stopniu pisma dobranym do liczby linii. */
function linie(c: CanvasRenderingContext2D, t: string, maxSzer: number, font: (px: number) => string, px: number): { linie: string[]; px: number } {
    for (let p = px; p > px * 0.42; p -= Math.max(2, Math.round(px * 0.03))) {
        c.font = font(p);
        const slowa = t.split(/\s+/).filter(Boolean); const out: string[] = []; let l = '';
        for (const s of slowa) { const n = l ? `${l} ${s}` : s; if (c.measureText(n).width > maxSzer && l) { out.push(l); l = s; } else l = n; }
        if (l) out.push(l);
        if (out.length <= 3 && out.every((x) => { c.font = font(p); return c.measureText(x).width <= maxSzer; })) return { linie: out, px: p };
    }
    return { linie: [t], px: Math.round(px * 0.42) };
}

/** Fala dźwiękowa 0.00G — deterministyczna, liczona z napisu, żeby każdy produkt miał swoją. */
function fala(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, wys: number, ziarno: string) {
    let s = 0; for (let i = 0; i < ziarno.length; i++) s = (s * 31 + ziarno.charCodeAt(i)) >>> 0;
    const losuj = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const slupkow = 64, szer = (x1 - x0) / (slupkow * 1.8);
    for (let i = 0; i < slupkow; i++) {
        const t = i / (slupkow - 1), obwiednia = Math.sin(Math.PI * t) ** 0.7;
        const h = wys * (0.18 + 0.82 * losuj()) * obwiednia;
        c.fillStyle = i % 4 === 0 ? TUSZ.zloto : TUSZ.glowny;
        c.globalAlpha = 0.55 + 0.45 * obwiednia;
        c.fillRect(x0 + t * (x1 - x0) - szer / 2, y - h / 2, szer, h);
    }
    c.globalAlpha = 1;
}

/** Rysuje gotowy plik produkcyjny. Czysta funkcja — ten sam produkt daje zawsze ten sam obraz. */
export function rysujNadruk(c: CanvasRenderingContext2D, uklad: Uklad, f: FormatDruku, t: TekstyDruku, czysc = true, motyw: HTMLCanvasElement | null = null) {
    const { w: W, h: H } = f;
    // NIE zerujemy transformacji: podgląd rysuje ten sam układ na mniejszym płótnie przez `setTransform(skala…)`,
    // a reset kazałby mu rysować w skali 4500 px — i cały nadruk lądował poza kadrem.
    // `czysc: false` dla podglądu sklepowego — tam nadruk siada NA ciemnym tle i czyszczenie zjadłoby je pod spodem.
    c.save(); if (czysc) c.clearRect(0, 0, W, H);   // przezroczyste tło pod DTG / winyl
    const sx = W / 2, maxSzer = W * 0.82;
    // Postać stoi NAD napisem; przy „stempel” typografia schodzi niżej, żeby nie wchodzić jej na nogi.
    if (motyw) motywWPasie(c, motyw, W, H * (uklad === 'stempel' ? 0.07 : 0.03), H * (uklad === 'stempel' ? 0.40 : 0.26));
    const srodekStempla = motyw ? 0.58 : 0.46;

    if (uklad === 'fala') {
        const naglowek = Math.round(W * 0.028);
        napis(c, '0.00G SESSIONS', sx, H * 0.3, `700 ${naglowek}px ${PROSTY}`, TUSZ.zloto, naglowek * 0.42);
        const { linie: ls, px } = linie(c, t.napis.toUpperCase(), maxSzer, (p) => `800 ${p}px ${PROSTY}`, Math.round(W * 0.13));
        ls.forEach((l, i) => napis(c, l, sx, H * 0.4 + i * px * 1.12, `800 ${px}px ${PROSTY}`, TUSZ.glowny, px * 0.02));
        const yFali = H * 0.4 + ls.length * px * 1.12 + H * 0.035;
        fala(c, W * 0.14, W * 0.86, yFali, H * 0.07, t.napis);
        const pod = Math.round(W * 0.026);
        if (t.podpis) napis(c, t.podpis.toUpperCase(), sx, yFali + H * 0.075, `500 ${pod}px ${MONO}`, TUSZ.zloto, pod * 0.3);
    } else if (uklad === 'box') {
        const mala = Math.round(W * 0.026);
        napis(c, 'TEOFON STUDIO · JUKEBOX 0.00G', sx, H * 0.29, `500 ${mala}px ${MONO}`, TUSZ.zloto, mala * 0.34);
        const { linie: ls, px } = linie(c, t.napis.toUpperCase(), maxSzer, (p) => `900 ${p}px ${PROSTY}`, Math.round(W * 0.17));
        c.save(); c.shadowColor = TUSZ.cien; c.shadowBlur = Math.round(W * 0.02);
        ls.forEach((l, i) => napis(c, l, sx, H * 0.4 + i * px * 1.1, `900 ${px}px ${PROSTY}`, TUSZ.glowny, px * 0.04));
        c.restore();
        const y = H * 0.4 + ls.length * px * 1.1 + H * 0.03;
        c.fillStyle = TUSZ.zloto; c.fillRect(sx - maxSzer * 0.2, y, maxSzer * 0.4, Math.max(2, Math.round(H / 900)));
        const pod = Math.round(W * 0.023);
        if (t.podpis) napis(c, t.podpis.toUpperCase(), sx, y + H * 0.035, `500 ${pod}px ${MONO}`, TUSZ.glowny, pod * 0.26);
        napis(c, '0.00G', sx, y + H * 0.085, `300 ${Math.round(W * 0.07)}px ${PROSTY}`, TUSZ.zloto, W * 0.004);
    } else {
        const { linie: ls, px } = linie(c, t.napis, maxSzer, (p) => `700 ${p}px ${SZERYF}`, Math.round(W * 0.155));
        const y0 = H * srodekStempla - ((ls.length - 1) * px * 1.08) / 2;
        ls.forEach((l, i) => napis(c, l, sx, y0 + i * px * 1.08, `700 ${px}px ${SZERYF}`, TUSZ.glowny, px * 0.015));
        const y = y0 + ls.length * px * 1.08 + H * 0.012;
        c.fillStyle = TUSZ.zloto; c.fillRect(sx - maxSzer * 0.16, y, maxSzer * 0.32, Math.max(2, Math.round(H / 1000)));
        const pod = Math.round(W * 0.025);
        if (t.podpis) napis(c, t.podpis.toUpperCase(), sx, y + H * 0.035, `500 ${pod}px ${MONO}`, TUSZ.zloto, pod * 0.36);
    }
    c.restore();
}

export const PODGLAD = { w: 1200, h: 1440 };

/**
 * 🏬 Podgląd sklepowy — to, co widzi kupujący w Shopify.
 *
 * Plik produkcyjny jest jasnym tuszem na PRZEZROCZYSTOŚCI, więc na białej karcie produktu byłby
 * niewidzialny. Podgląd kładzie więc nadruk na ciemnej karcie — tak, jak wygląda na tkaninie —
 * i dopasowuje go do stałego kadru 1200×1440, żeby siatka sklepu była równa niezależnie od tego,
 * czy produkt jest koszulką 4500×5400, naklejką 3000×3000 czy plakatem 5400×7200.
 */
export function rysujPodglad(c: CanvasRenderingContext2D, uklad: Uklad, f: FormatDruku, t: TekstyDruku, motyw: HTMLCanvasElement | null = null) {
    const { w: W, h: H } = PODGLAD;
    c.save(); c.clearRect(0, 0, W, H);
    // Tło PŁASKIE, nie gradientowe — i to nie jest oszczędzanie na wyglądzie. Gładki gradient na
    // 1200×1440 robił PNG o wadze 1,48 MB (31 MB na całą kolekcję w repozytorium portalu i wolna
    // siatka sklepu). Płaska płyta z ramką waży ułamek tego, a tekst zostaje tak samo ostry.
    c.fillStyle = '#0d0e12'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(230,196,124,0.28)'; c.lineWidth = 3;
    c.strokeRect(28.5, 28.5, W - 57, H - 57);

    const s = Math.min((W * 0.88) / f.w, (H * 0.88) / f.h);
    c.save();
    c.translate((W - f.w * s) / 2, (H - f.h * s) / 2);
    c.scale(s, s);
    rysujNadruk(c, uklad, f, t, false, motyw);   // bez czyszczenia — nadruk siada na ciemnej karcie
    c.restore();
    c.restore();
}
export async function zbudujPodglad(uklad: Uklad, f: FormatDruku, t: TekstyDruku, motyw: HTMLCanvasElement | null = null): Promise<Blob> {
    const p = document.createElement('canvas'); p.width = PODGLAD.w; p.height = PODGLAD.h;
    const c = p.getContext('2d');
    if (!c) throw new Error('Przeglądarka nie dała płótna 2D — podglądu nie da się złożyć.');
    rysujPodglad(c, uklad, f, t, motyw);
    return doJpeg(p, 'podglądu');
}

/** Składa plik produkcyjny i oddaje PNG z przezroczystym tłem. */
export async function zbudujNadruk(uklad: Uklad, f: FormatDruku, t: TekstyDruku, motyw: HTMLCanvasElement | null = null): Promise<Blob> {
    const p = document.createElement('canvas'); p.width = f.w; p.height = f.h;
    const c = p.getContext('2d');
    if (!c) throw new Error('Przeglądarka nie dała płótna 2D — pliku nie da się złożyć.');
    rysujNadruk(c, uklad, f, t, true, motyw);
    return doPng(p, 'pliku');
}

async function doPng(p: HTMLCanvasElement, co: string): Promise<Blob> {
    const blob = await new Promise<Blob | null>((r) => p.toBlob(r, 'image/png'));
    if (!blob) throw new Error(`Nie udało się zapisać ${co} jako PNG.`);
    return blob;
}
/**
 * Podgląd sklepowy = JPEG. Ciemna mgławica AOP (gładka poświata + setki gwiazd) w PNG waży
 * 1,6 MB na kartę — 48 MB na kolekcję w repozytorium portalu. PNG zostaje przy plikach do druku.
 */
async function doJpeg(p: HTMLCanvasElement, co: string, jakosc = 0.9): Promise<Blob> {
    const blob = await new Promise<Blob | null>((r) => p.toBlob(r, 'image/jpeg', jakosc));
    if (!blob) throw new Error(`Nie udało się zapisać ${co} jako JPEG.`);
    return blob;
}

// ══════════════ 🌌 ALL-OVER PRINT ══════════════
//
// Panele AOP rysuje `rysujPlik` z bestsellerów Printful — ten sam kod, który od 2026-11-07 robi
// kurtki i plecaki, tylko z barwą wybranej kolorystyki. Tło jest PEŁNE i ciemne: Printful szyje
// AOP z BIAŁEJ belki, więc przezroczysty piksel wychodzi z szwalni jako biała plama.

export interface PanelDruku { placement: string; nazwa: string; w: number; h: number; rysunek: string }

/** Jeden panel (przód / tył / rękaw) w jednej kolorystyce. */
export function rysujPanelAop(panel: PanelDruku, motyw: HTMLCanvasElement, t: TekstyDruku, nota: string, kolorystyka: string): HTMLCanvasElement {
    return rysujPlik(
        panel.rysunek as Rysunek, panel.w, panel.h, motyw,
        { tytul: t.napis, podtytul: t.podpis, opowiesc: nota, cytat: t.podpis },
        t.napis, `${t.napis}-${kolorystyka}-${panel.placement}`, barwaZId(kolorystyka),
    );
}
export async function zbudujPanelAop(panel: PanelDruku, motyw: HTMLCanvasElement, t: TekstyDruku, nota: string, kolorystyka: string): Promise<Blob> {
    return doPng(rysujPanelAop(panel, motyw, t, nota, kolorystyka), `panelu ${panel.nazwa}`);
}

/** Podgląd sklepowy produktu AOP: panel przodu wpasowany w stały kadr 1200×1440 ze złotą ramką. */
export function rysujPodgladAop(c: CanvasRenderingContext2D, panel: PanelDruku, motyw: HTMLCanvasElement, t: TekstyDruku, nota: string, kolorystyka: string) {
    const { w: W, h: H } = PODGLAD;
    const mini = { ...panel, w: Math.round(panel.w / 6), h: Math.round(panel.h / 6) };   // ten sam układ, 1/6 rozdzielczości
    const p = rysujPanelAop(mini, motyw, t, nota, kolorystyka);
    c.save(); c.clearRect(0, 0, W, H);
    c.fillStyle = '#0d0e12'; c.fillRect(0, 0, W, H);
    const s = Math.min((W * 0.88) / p.width, (H * 0.88) / p.height);
    (c as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
    c.drawImage(p, (W - p.width * s) / 2, (H - p.height * s) / 2, p.width * s, p.height * s);
    c.strokeStyle = 'rgba(230,196,124,0.28)'; c.lineWidth = 3;
    c.strokeRect(28.5, 28.5, W - 57, H - 57);
    c.restore();
}
export async function zbudujPodgladAop(panel: PanelDruku, motyw: HTMLCanvasElement, t: TekstyDruku, nota: string, kolorystyka: string): Promise<Blob> {
    const p = document.createElement('canvas'); p.width = PODGLAD.w; p.height = PODGLAD.h;
    const c = p.getContext('2d');
    if (!c) throw new Error('Przeglądarka nie dała płótna 2D — podglądu nie da się złożyć.');
    rysujPodgladAop(c, panel, motyw, t, nota, kolorystyka);
    return doJpeg(p, 'podglądu AOP');
}
