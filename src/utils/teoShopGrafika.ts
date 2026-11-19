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
export type Uklad = 'stempel' | 'fala' | 'box';
export interface FormatDruku { w: number; h: number }
export interface TekstyDruku { napis: string; podpis: string }

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
export function rysujNadruk(c: CanvasRenderingContext2D, uklad: Uklad, f: FormatDruku, t: TekstyDruku, czysc = true) {
    const { w: W, h: H } = f;
    // NIE zerujemy transformacji: podgląd rysuje ten sam układ na mniejszym płótnie przez `setTransform(skala…)`,
    // a reset kazałby mu rysować w skali 4500 px — i cały nadruk lądował poza kadrem.
    // `czysc: false` dla podglądu sklepowego — tam nadruk siada NA ciemnym tle i czyszczenie zjadłoby je pod spodem.
    c.save(); if (czysc) c.clearRect(0, 0, W, H);   // przezroczyste tło pod DTG / winyl
    const sx = W / 2, maxSzer = W * 0.82;

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
        const y0 = H * 0.46 - ((ls.length - 1) * px * 1.08) / 2;
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
export function rysujPodglad(c: CanvasRenderingContext2D, uklad: Uklad, f: FormatDruku, t: TekstyDruku) {
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
    rysujNadruk(c, uklad, f, t, false);   // bez czyszczenia — nadruk siada na ciemnej karcie
    c.restore();
    c.restore();
}
export async function zbudujPodglad(uklad: Uklad, f: FormatDruku, t: TekstyDruku): Promise<Blob> {
    const p = document.createElement('canvas'); p.width = PODGLAD.w; p.height = PODGLAD.h;
    const c = p.getContext('2d');
    if (!c) throw new Error('Przeglądarka nie dała płótna 2D — podglądu nie da się złożyć.');
    rysujPodglad(c, uklad, f, t);
    const blob = await new Promise<Blob | null>((r) => p.toBlob(r, 'image/png'));
    if (!blob) throw new Error('Nie udało się zapisać podglądu jako PNG.');
    return blob;
}

/** Składa plik produkcyjny i oddaje PNG z przezroczystym tłem. */
export async function zbudujNadruk(uklad: Uklad, f: FormatDruku, t: TekstyDruku): Promise<Blob> {
    const p = document.createElement('canvas'); p.width = f.w; p.height = f.h;
    const c = p.getContext('2d');
    if (!c) throw new Error('Przeglądarka nie dała płótna 2D — pliku nie da się złożyć.');
    rysujNadruk(c, uklad, f, t);
    const blob = await new Promise<Blob | null>((r) => p.toBlob(r, 'image/png'));
    if (!blob) throw new Error('Nie udało się zapisać pliku jako PNG.');
    return blob;
}
