/**
 * 🧵 Kontrola jakości szwalni (QC, Suweren 2026-11-06: „żadna naszywka ani nadruk nie może wystawać poza materiał”).
 *
 * Makieta FLUX = ubranie na jasnym, jednolitym tle. Maska materiału: zalewanie od brzegu kadru pikseli bliskich barwie tła
 * (i płynnie przechodzących w siebie) — reszta to ubranie (z uchwytami torby). Potem STREFY BEZPIECZNE:
 *  · wszędzie: naszywka w całości na materiale, z marginesem (maska zerodowana o MARGINES szerokości kadru);
 *  · rękawy: najwyżej 60% przekroju rękawu w wierszu środka naszywki;
 *  · plecy kurtek i bluz (`tyl`, `tyl-dol`): w korpusie — szerokość z przekroju nad dolnym ściągaczem (rękawy poza),
 *    od góry pod karczkiem, od dołu nad ściągaczem;
 *  · torba: tylko korpus (wiersze, gdzie materiał jest szeroki) — nigdy uchwyty.
 * Naszywka, która nie mieści się, dostaje NAJBLIŻSZE miejsce i NAJWIĘKSZĄ skalę, przy których mieści się w całości.
 * Wszystko czyste (bez ffmpeg) poza `czytajObraz` — testowalne na sztucznych maskach.
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';
import { FFMPEG } from './marki';

const uruchom = promisify(execFile);

export type Pozycja = { x: number; y: number; w: number; rot?: number };
export interface Obraz { w: number; h: number; px: Uint8Array; kanaly: 3 | 4 }
export interface Maska { w: number; h: number; m: Uint8Array }   // 1 = materiał

/** Surowe piksele (rgb24 albo rgba) przeskalowane do szerokości `szer`. */
export async function czytajObraz(plik: string, szer: number, rgba = false): Promise<Obraz> {
    const { stdout: info } = await uruchom(FFMPEG, ['-i', plik], { maxBuffer: 4 * 1024 * 1024 }).catch((e) => ({ stdout: String(e.stderr ?? '') }));
    const m = /, (\d{2,5})x(\d{2,5})/.exec(String(info));
    if (!m) throw new Error(`ffmpeg nie odczytał ${plik}`);
    const w = szer, h = Math.max(1, Math.round((Number(m[2]) * szer) / Number(m[1])));
    const { stdout } = await uruchom(FFMPEG, ['-v', 'error', '-i', plik, '-vf', `scale=${w}:${h}:flags=area`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', rgba ? 'rgba' : 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
    const kanaly = rgba ? 4 : 3;
    if (stdout.length !== w * h * kanaly) throw new Error(`ffmpeg oddał ${stdout.length} B zamiast ${w * h * kanaly}`);
    return { w, h, px: new Uint8Array(stdout), kanaly };
}

/** Odległość barw z naciskiem na ODCIEŃ: tło FLUX jest chłodnoszare, a kremowy rękaw tylko trochę jaśniejszy, za to ciepły. */
const roznica = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) =>
    Math.hypot((r1 + g1 + b1 - r2 - g2 - b2) / 3, 3 * ((b1 - r1) - (b2 - r2)), 3 * ((g1 - (r1 + b1) / 2) - (g2 - (r2 + b2) / 2)));
const odl = (p: Uint8Array, i: number, r: number, g: number, b: number) => roznica(p[i], p[i + 1], p[i + 2], r, g, b);

/** Maska materiału: tło = zalane od brzegu (barwa bliska medianie brzegu, sąsiedzi płynnie), reszta = ubranie. */
export function maskaUbioru(o: Obraz, { tloMax = 22, krokMax = 6, dziuraMax = 9 } = {}): Maska {
    const { w, h, px, kanaly } = o;
    const brzeg: number[][] = [];
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = (y * w + x) * kanaly; brzeg.push([px[i], px[i + 1], px[i + 2]]); }
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = (y * w + x) * kanaly; brzeg.push([px[i], px[i + 1], px[i + 2]]); }
    const med = (k: number) => brzeg.map((c) => c[k]).sort((a, b) => a - b)[brzeg.length >> 1];
    const [r, g, b] = [med(0), med(1), med(2)];
    const tlo = new Uint8Array(w * h);
    const kolejka = new Int32Array(w * h); let gl = 0, ko = 0, dosiane = false;
    const wrzuc = (j: number) => { if (!tlo[j] && odl(px, j * kanaly, r, g, b) < tloMax) { tlo[j] = 1; kolejka[ko++] = j; } };
    for (let x = 0; x < w; x++) { wrzuc(x); wrzuc((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { wrzuc(y * w); wrzuc(y * w + w - 1); }
    while (gl < ko) {
        const j = kolejka[gl++], x = j % w, y = (j - x) / w, i = j * kanaly;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const n = ny * w + nx;
            if (tlo[n]) continue;
            const ni = n * kanaly;
            if (odl(px, ni, r, g, b) < tloMax && roznica(px[ni], px[ni + 1], px[ni + 2], px[i], px[i + 1], px[i + 2]) < krokMax) { tlo[n] = 1; kolejka[ko++] = n; }
        }
        // zamknięte „dziury” w barwie tła (prześwit między uchwytami torby) — też tło: dosiej je, gdy kolejka się skończy
        if (gl === ko && !dosiane) {
            dosiane = true;
            for (let j = 0; j < w * h; j++) if (!tlo[j] && odl(px, j * kanaly, r, g, b) < dziuraMax) { tlo[j] = 1; kolejka[ko++] = j; }
        }
    }
    const m = new Uint8Array(w * h);
    for (let j = 0; j < w * h; j++) m[j] = tlo[j] ? 0 : 1;
    return najwiekszaWyspa({ w, h, m });
}

/** Zostaw największy spójny kawałek materiału (okruchy cienia i szumu tła odpadają). */
export function najwiekszaWyspa(k: Maska): Maska {
    const { w, h, m } = k, et = new Int32Array(w * h), stos = new Int32Array(w * h);
    let nr = 0, najNr = 0, najIle = 0;
    for (let s = 0; s < w * h; s++) {
        if (!m[s] || et[s]) continue;
        nr++; let ile = 0, sp = 0; stos[sp++] = s; et[s] = nr;
        while (sp) {
            const j = stos[--sp], x = j % w; ile++;
            for (const n of [j - w, j + w, x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1]) if (n >= 0 && n < w * h && m[n] && !et[n]) { et[n] = nr; stos[sp++] = n; }
        }
        if (ile > najIle) { najIle = ile; najNr = nr; }
    }
    const out = new Uint8Array(w * h);
    for (let j = 0; j < w * h; j++) out[j] = et[j] === najNr ? 1 : 0;
    return { w, h, m: out };
}

/** Erozja kwadratem promienia r (separowalnie: najpierw wiersze, potem kolumny). */
export function erozja(k: Maska, r: number): Maska {
    const { w, h, m } = k, t = new Uint8Array(w * h), out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        let zera = 0; const o = y * w;
        for (let x = -r; x < w; x++) {
            const wch = x + r, wyj = x - r - 1;
            if (wch < w && !m[o + wch]) zera++;
            if (wyj >= 0 && !m[o + wyj]) zera--;
            if (x >= 0) t[o + x] = zera === 0 && x - r >= 0 && x + r < w ? 1 : 0;
        }
    }
    for (let x = 0; x < w; x++) {
        let zera = 0;
        for (let y = -r; y < h; y++) {
            const wch = y + r, wyj = y - r - 1;
            if (wch < h && !t[wch * w + x]) zera++;
            if (wyj >= 0 && !t[wyj * w + x]) zera--;
            if (y >= 0) out[y * w + x] = zera === 0 && y - r >= 0 && y + r < h ? 1 : 0;
        }
    }
    return { w, h, m: out };
}

/** Odcinek materiału w wierszu y zawierający x (albo najbliższy) → [od, do] w pikselach, null gdy wiersz pusty. */
export function przekroj(k: Maska, y: number, x: number): [number, number] | null {
    const { w, h, m } = k, yy = Math.min(h - 1, Math.max(0, Math.round(y))), xx = Math.min(w - 1, Math.max(0, Math.round(x)));
    let best: [number, number] | null = null, bestOdl = Infinity;
    for (let s = 0; s < w;) {
        if (!m[yy * w + s]) { s++; continue; }
        let e = s; while (e + 1 < w && m[yy * w + e + 1]) e++;
        const d = xx < s ? s - xx : xx > e ? xx - e : 0;
        if (d < bestOdl) { bestOdl = d; best = [s, e]; }
        s = e + 1;
    }
    return best;
}

/** Ramka materiału: pierwszy/ostatni wiersz i kolumna z materiałem. */
export function ramka(k: Maska) {
    let x0 = k.w, x1 = -1, y0 = k.h, y1 = -1;
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++) if (k.m[y * k.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0, x1, y0, y1 };
}

/** Odcisk naszywki: piksele z alfą > 8 (cała ramka, gdy obraz bez przezroczystości), w siatce ≤ `n` × n. */
export interface Odcisk { w: number; h: number; a: Uint8Array }
export function odcisk(o: Obraz): Odcisk {
    const a = new Uint8Array(o.w * o.h);
    for (let j = 0; j < o.w * o.h; j++) a[j] = o.kanaly === 4 ? (o.px[j * 4 + 3] > 8 ? 1 : 0) : 1;
    return { w: o.w, h: o.h, a };
}

/** Ile pikseli odcisku (ułożonego jak w `naloz`: szerokość w·W, obrót wokół środka) wypada poza dozwolony obszar. */
export function poza(dozwolone: Maska, o: Odcisk, p: Pozycja, proporcja: number): number {
    const W = dozwolone.w, sz = p.w * W, wy = sz * proporcja;
    const kat = ((p.rot ?? 0) * Math.PI) / 180, c = Math.cos(kat), s = Math.sin(kat);
    const cx = p.x * W, cy = p.y * (dozwolone.h);
    let zle = 0;
    for (let v = 0; v < o.h; v++) for (let u = 0; u < o.w; u++) {
        if (!o.a[v * o.w + u]) continue;
        const lx = ((u + 0.5) / o.w - 0.5) * sz, ly = ((v + 0.5) / o.h - 0.5) * wy;
        // ffmpeg rotate: dodatni kąt = zgodnie z ruchem wskazówek (oś y w dół)
        const X = Math.round(cx + lx * c - ly * s), Y = Math.round(cy + lx * s + ly * c);
        if (X < 0 || Y < 0 || X >= W || Y >= dozwolone.h || !dozwolone.m[Y * W + X]) zle++;
    }
    return zle;
}

export const MARGINES = 0.012;          // ułamek szerokości kadru — odstęp naszywki od krawędzi materiału
export const REKAW_MAX = 0.6;           // naszywka ≤ 60% przekroju rękawu
const SKALE = [1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4, 0.34];
const PLECY_KURTEK = ['bluza', 'longsleeve', 'kurtka', 'bomber', 'jeansowa', 'ramoneska', 'parka', 'plaszcz', 'koszulka'];

/** Obszar dozwolony dla strefy (maska materiału zerodowana + strefa produkcyjna). */
export function obszarStrefy(maska: Maska, ubior: string, strefa: string, rekawPoLewej: boolean | null = null): Maska {
    const { w, h } = maska;
    const r = ramka(maska), wys = r.y1 - r.y0;
    let dozw = erozja(maska, Math.max(1, Math.round(MARGINES * w)));
    const tnij = (y0: number, y1: number, x0 = 0, x1 = w - 1) => {
        const m = new Uint8Array(w * h);
        for (let y = Math.max(0, Math.ceil(y0)); y <= Math.min(h - 1, Math.floor(y1)); y++) for (let x = Math.max(0, Math.ceil(x0)); x <= Math.min(w - 1, Math.floor(x1)); x++) m[y * w + x] = dozw.m[y * w + x];
        dozw = { w, h, m };
    };
    if (ubior === 'torba') {
        // korpus = wiersze, w których materiał w środku kadru jest szeroki (uchwyty są wąskie)
        const szer = (y: number) => { const p = przekroj(maska, y, w / 2); return p ? p[1] - p[0] : 0; };
        let max = 0; for (let y = r.y0; y <= r.y1; y++) max = Math.max(max, szer(y));
        let gora = r.y0; while (gora < r.y1 && szer(gora) < 0.6 * max) gora++;
        tnij(gora + 0.03 * h, r.y1 - 0.02 * h);
    } else if (['tyl', 'tyl-dol', 'przod', 'przod-l', 'przod-p'].includes(strefa) && PLECY_KURTEK.includes(ubior)) {
        // korpus (plecy i pierś — bez rękawów): boki z korpusu, góra pod karczkiem, dół nad ściągaczem
        const { bx0, bx1 } = korpus(maska, ubior), wew = 0.06 * (bx1 - bx0);
        // dół: nad ściągaczem/paskiem z zapasem (kurtki z dolnym ściągaczem i bluzy wyżej)
        const dol = ['kurtka', 'bomber', 'jeansowa', 'bluza'].includes(ubior) ? 0.84 : 0.88;
        tnij(r.y0 + (ubior === 'koszulka' ? 0.14 : 0.16) * wys, r.y0 + dol * wys, bx0 + wew, bx1 - wew);
    } else if (strefa.startsWith('rekaw')) {
        // rękaw = materiał POZA korpusem, po swojej stronie kadru (inaczej naszywka „uciekłaby” na pierś)
        const { bx0, bx1 } = korpus(maska, ubior), odst = 0.02 * w;
        if (rekawPoLewej === null) return dozw;
        if (rekawPoLewej) tnij(0, h - 1, 0, bx0 - odst); else tnij(0, h - 1, bx1 + odst, w - 1);
    }
    return dozw;
}

/** Boki korpusu: węższy z przekrojów przez środek — nad dolnym ściągaczem albo na wysokości barków (rękawy przylegają do pasa). */
export function korpus(maska: Maska, ubior = '') {
    const r = ramka(maska), wys = r.y1 - r.y0;
    if (ubior === 'torba') { const p = przekroj(maska, r.y0 + 0.7 * wys, maska.w / 2) ?? [r.x0, r.x1]; return { bx0: p[0], bx1: p[1] }; }
    const kandydaci = [0.86, 0.12, 0.14].map((f) => przekroj(maska, r.y0 + f * wys, maska.w / 2)).filter(Boolean) as [number, number][];
    const [bx0, bx1] = kandydaci.length ? kandydaci.reduce((a, b) => (b[1] - b[0] < a[1] - a[0] ? b : a)) : [r.x0, r.x1];
    return { bx0, bx1 };
}

export interface WynikQc { strefa: string; przed: Pozycja; po: Pozycja; poza: number; zmiana: 'bez' | 'przesunieta' | 'zmniejszona' | 'nie-miesci'; uwaga?: string; cm?: { w: number; h: number }; kadr?: Kadr }
/** Ramka samej grafiki w pliku strefy (ułamki 0–1) — przezroczysty zapas nie idzie do druku. */
export type Kadr = { x0: number; y0: number; x1: number; y1: number };
export function kadrGrafiki(o: Obraz): Kadr {
    let x0 = o.w, x1 = -1, y0 = o.h, y1 = -1;
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (o.kanaly === 3 || o.px[(y * o.w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { x0: 0, y0: 0, x1: 1, y1: 1 };
    return { x0: x0 / o.w, y0: y0 / o.h, x1: (x1 + 1) / o.w, y1: (y1 + 1) / o.h };
}

/**
 * Długość ubrania od kołnierza do dołu (cm, rozmiar M; torba: szerokość korpusu) — PRZYBLIŻENIE z typowych tabel rozmiarów,
 * służy tylko do przeliczenia naszywki z makiety na centymetry (długość, bo szerokość korpusu na makiecie zlewa się z rękawami).
 * Wymiar wiążący = szablon wybranej drukarni (Printful, Gelato, Apliiq).
 */
export const MIARA_CM: Record<string, number> = { koszulka: 72, longsleeve: 72, bluza: 70, kurtka: 66, bomber: 64, jeansowa: 60, ramoneska: 58, parka: 82, plaszcz: 100, torba: 38 };

/**
 * Dopasuj naszywkę: zostaw, gdy mieści się w całości; inaczej NAJWIĘKSZA skala, a przy niej NAJBLIŻSZE miejsce (siatka do ±0,1 kadru),
 * w którym nie wystaje ani piksel. Rękaw: najpierw ograniczenie do 60% przekroju rękawu.
 */
export function dopasuj(dozw: Maska, _maska: Maska, o: Odcisk, proporcja: number, strefa: string, p: Pozycja): WynikQc {
    const W = dozw.w, H = dozw.h, rekaw = strefa.startsWith('rekaw');
    // szerokość SAMEJ grafiki w odcisku (przezroczysty zapas pliku się nie liczy do 60% rękawu)
    let u0 = o.w, u1 = -1;
    for (let v = 0; v < o.h; v++) for (let u = 0; u < o.w; u++) if (o.a[v * o.w + u]) { if (u < u0) u0 = u; if (u > u1) u1 = u; }
    const czescGrafiki = u1 >= u0 ? (u1 - u0 + 1) / o.w : 1;
    const margPx = 2 * Math.max(1, Math.round(MARGINES * W));
    /** Rękaw: grafika ≤ 60% przekroju rękawu w wierszu jej środka (przekrój z obszaru dozwolonego + oddany margines). */
    const zaSzeroka = (q: Pozycja) => {
        if (!rekaw) return false;
        const prz = przekroj(dozw, q.y * H, q.x * W);
        if (!prz) return true;
        return q.w * czescGrafiki * W > REKAW_MAX * (prz[1] - prz[0] + 1 + margPx);
    };
    const dobra = (q: Pozycja) => !zaSzeroka(q) && poza(dozw, o, q, proporcja) === 0;
    const zle0 = poza(dozw, o, p, proporcja);
    if (zle0 === 0 && !zaSzeroka(p)) return { strefa, przed: p, po: p, poza: 0, zmiana: 'bez' };
    const kroki: [number, number][] = [];
    for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) kroki.push([dx * 0.01, dy * 0.01]);
    kroki.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    const daleko: [number, number][] = [];
    for (let dy = -15; dy <= 15; dy++) for (let dx = -15; dx <= 15; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) > 5) daleko.push([dx * 0.02, dy * 0.02]);
    daleko.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    // najpierw NAJWIĘKSZA skala, przy niej najbliższe miejsce — na rękawie zwykle wystarczy zejść niżej, gdzie jest szerzej
    for (const siatka of [kroki, daleko]) for (const s of SKALE) for (const [dx, dy] of siatka) {
        const q = { ...p, x: p.x + dx, y: p.y + dy * (W / H), w: p.w * s };
        if (!dobra(q)) continue;
        const uwagi = [zaSzeroka(p) ? `była szersza niż ${Math.round(REKAW_MAX * 100)}% rękawu` : '', siatka === daleko ? 'przeniesiona dalej — blisko nie było miejsca' : ''].filter(Boolean);
        return { strefa, przed: p, po: q, poza: zle0, zmiana: s < 1 ? 'zmniejszona' : 'przesunieta', uwaga: uwagi.length ? uwagi.join('; ') : undefined };
    }
    return { strefa, przed: p, po: p, poza: zle0, zmiana: 'nie-miesci', uwaga: 'nie ma miejsca na materiale nawet przy 34% wielkości' };
}

export const ODSTEP = 0.012;   // odstęp między naszywkami rękawa (ułamek szerokości kadru)
/** Zaznacz odcisk naszywki (z odstępem) jako zajęty — ułożony tak samo jak w `poza`. */
export function zajmij(zajete: Uint8Array, W: number, H: number, o: Odcisk, p: Pozycja, proporcja: number, odstep: number) {
    const sz = p.w * W, wy = sz * proporcja, kat = ((p.rot ?? 0) * Math.PI) / 180, c = Math.cos(kat), s = Math.sin(kat);
    const r = odstep + Math.ceil(Math.max(sz / o.w, wy / o.h) / 2);
    for (let v = 0; v < o.h; v++) for (let u = 0; u < o.w; u++) {
        if (!o.a[v * o.w + u]) continue;
        const lx = ((u + 0.5) / o.w - 0.5) * sz, ly = ((v + 0.5) / o.h - 0.5) * wy;
        const X = Math.round(p.x * W + lx * c - ly * s), Y = Math.round(p.y * H + lx * s + ly * c);
        for (let y = Math.max(0, Y - r); y <= Math.min(H - 1, Y + r); y++) for (let x = Math.max(0, X - r); x <= Math.min(W - 1, X + r); x++) zajete[y * W + x] = 1;
    }
}

/** QC całej strony makiety: maska raz, każda strefa dopasowana. */
export async function kontrolaStrony(makieta: string, ubior: string, warstwy: { strefa: string; plik: string; poz: Pozycja }[]): Promise<WynikQc[]> {
    const maska = maskaUbioru(await czytajObraz(makieta, 384));
    const rm = ramka(maska), { bx0, bx1 } = korpus(maska, ubior);
    const cmNaPx = ubior === 'torba' ? MIARA_CM.torba / Math.max(1, bx1 - bx0) : (MIARA_CM[ubior] ?? 68) / Math.max(1, rm.y1 - rm.y0);
    const wyniki: WynikQc[] = [];
    // naszywki rękawów nie mogą na siebie nachodzić: każda postawiona zajmuje swój odcisk + ODSTEP (kolejne omijają)
    const zajete = new Uint8Array(maska.w * maska.h);
    for (const w of warstwy) {
        const o = await czytajObraz(w.plik, 48, true), od = odcisk(o), rekaw = w.strefa.startsWith('rekaw');
        let obszar = obszarStrefy(maska, ubior, w.strefa, rekaw ? w.poz.x < 0.5 : null);
        if (rekaw) obszar = { ...obszar, m: obszar.m.map((v, j) => (zajete[j] ? 0 : v)) };
        const q = dopasuj(obszar, maska, od, o.h / o.w, w.strefa, w.poz);
        if (rekaw) zajmij(zajete, maska.w, maska.h, od, q.po, o.h / o.w, Math.max(2, Math.round(ODSTEP * maska.w)));
        const kadr = kadrGrafiki(await czytajObraz(w.plik, 512, true));
        const ramkaCm = q.po.w * maska.w * cmNaPx;   // szerokość CAŁEGO pliku strefy na ubraniu
        const szer = ramkaCm * (kadr.x1 - kadr.x0), wys = ramkaCm * (o.h / o.w) * (kadr.y1 - kadr.y0);
        wyniki.push({ ...q, kadr, cm: { w: Math.round(szer * 10) / 10, h: Math.round(wys * 10) / 10 } });
    }
    return wyniki;
}

/** Wstaw do PNG znacznik pHYs (piksele na metr) — program drukarni odczyta fizyczny rozmiar. */
export function pngZDpi(png: Buffer, dpi: number): Buffer {
    if (png.readUInt32BE(0) !== 0x89504e47) throw new Error('To nie PNG.');
    const ppm = Math.round(dpi / 0.0254), dane = Buffer.alloc(9);
    dane.writeUInt32BE(ppm, 0); dane.writeUInt32BE(ppm, 4); dane[8] = 1;
    const typ = Buffer.from('pHYs'), dl = Buffer.alloc(4), crc = Buffer.alloc(4);
    dl.writeUInt32BE(9); crc.writeUInt32BE(zlib.crc32(Buffer.concat([typ, dane])) >>> 0);
    // usuń istniejący pHYs, wstaw nowy po IHDR (8 + 25 B)
    const kawalki: Buffer[] = [png.subarray(0, 33)];
    for (let o = 33; o < png.length;) {
        const n = png.readUInt32BE(o), ty = png.toString('latin1', o + 4, o + 8), cal = png.subarray(o, o + 12 + n);
        if (ty !== 'pHYs') kawalki.push(cal);
        if (o === 33) kawalki.splice(1, 0, Buffer.concat([dl, typ, dane, crc]));
        o += 12 + n;
    }
    return Buffer.concat(kawalki);
}
