/**
 * 👕🌀 KOLEKCJE 360° — nadruk z opowieścią na PRZODZIE, PLECACH i RĘKAWACH (Suweren 2026-11-05: „sam stworek na środku
 * wygląda zbyt ubogo… bogate dzieło streetwearowe z własną opowieścią”).
 *
 * Podział pracy: KOMPOZYCJĘ stref (aureole, runy, typografia, karta opowieści) rysuje przeglądarka na Canvas 2D
 * (src/lib/kompozycja360.ts) i wgrywa każdą strefę jako PNG 4096 px; serwer zapisuje pliki druku, nakłada strefy na
 * makiety PRZÓD i TYŁ (FLUX raz na ubiór+kolor, potem z pamięci) i składa ARKUSZ PRODUKCYJNY. Opowieść pisze lokalny
 * model krawca (Ollama) z opisu motywu w Pracowni Katedry.
 *
 * ⚠️ UCZCIWIE: pozycje stref na makiecie (pierś, plecy, rękawy) to ułamki kadru FLUX, nie wymiary prawdziwego wykroju —
 *    makieta pokazuje ideę; drukarnia dostaje osobne pliki stref. Motyw z Pracowni ma 1024 px (plik druku = powiększenie).
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { FFMPEG } from './marki';
import { UBIORY, KOLORY, DLUGIE_REKAWY, makieta, motywy, pobierz, wymiary } from './nadruki';
import { stanKrawca } from './krawiec-lokalny';
import { kontrolaStrony, pngZDpi, type WynikQc } from './kontrolaSzwalni';

const uruchom = promisify(execFile);
const OLLAMA = process.env.OTAKOS_OLLAMA || 'http://127.0.0.1:11434';
const PUBLIC = path.join(process.cwd(), 'public');
const KAT = path.join(PUBLIC, 'nadruki', 'kolekcje');
const ID = /^k-[0-9a-f]{8}$/;

export const STREFY = ['przod', 'przod-l', 'przod-p', 'tyl', 'tyl-dol', 'rekaw-l', 'rekaw-p', 'rekaw-l-1', 'rekaw-l-2', 'rekaw-l-3', 'rekaw-p-1', 'rekaw-p-2', 'rekaw-p-3'] as const;
export type Strefa = typeof STREFY[number];
export const STYLE = ['plaski', 'haft'] as const;
export const UKLADY_PRZODU = ['plakat', 'herb'] as const;

/** Gdzie strefa siada na makiecie (ułamki szerokości/wysokości kadru, środek; obrót w stopniach). Rękaw „p” = prawy NOSZĄCEGO. */
type Pozycja = { x: number; y: number; w: number; rot?: number };
const DLUGI_REKAW = { 'rekaw-p': { x: 0.115, y: 0.6, w: 0.055, rot: 10 }, 'rekaw-l': { x: 0.885, y: 0.6, w: 0.055, rot: -10 } };
const KROTKI_REKAW = { 'rekaw-p': { x: 0.14, y: 0.29, w: 0.07, rot: 28 }, 'rekaw-l': { x: 0.86, y: 0.29, w: 0.07, rot: -28 } };
/** Naszywki haftu (styl „haft”): pierś lewa (blok) i prawa (kursywa), plecy + dół pleców, kaskada 3 naszywek na rękawach. */
/**
 * Krój płaszczy — pomiary z makiet FLUX (trencz piaskowy 2026-11-05): klapy zajmują środek do y ≈ 0,4, pasek y ≈ 0,45,
 * rękaw skośnie od barku (0,30; 0,20) do mankietu (0,17; 0,56). Naszywki piersi schodzą pod klapy, rękawne idą osią rękawa,
 * plecy: główna nad paskiem, sentencja na połach. Rękaw „p” = prawy NOSZĄCEGO (lewa strona kadru z przodu).
 */
const KROJE: Record<string, { rekaw: [number, number][]; rot: number; wRekaw: number; piersL: Pozycja; piersP: Pozycja; tyl: Pozycja; tylDol: Pozycja }> = {
    plaszcz: { rekaw: [[0.268, 0.29], [0.235, 0.38], [0.203, 0.47]], rot: 13, wRekaw: 0.07,
        piersL: { x: 0.69, y: 0.515, w: 0.13 }, piersP: { x: 0.355, y: 0.535, w: 0.15 }, tyl: { x: 0.5, y: 0.3, w: 0.4 }, tylDol: { x: 0.5, y: 0.68, w: 0.44 } },
    parka: { rekaw: [[0.25, 0.32], [0.215, 0.45], [0.185, 0.58]], rot: 11, wRekaw: 0.08,
        piersL: { x: 0.65, y: 0.4, w: 0.14 }, piersP: { x: 0.35, y: 0.41, w: 0.17 }, tyl: { x: 0.5, y: 0.42, w: 0.46 }, tylDol: { x: 0.5, y: 0.72, w: 0.46 } },
};

function pozycjeHaftu(ubior: string): { przod: Record<string, Pozycja>; tyl: Record<string, Pozycja> } {
    const dlugi = DLUGIE_REKAWY.includes(ubior);
    const kroj = KROJE[ubior];
    const rekawP: Record<string, Pozycja> = {}, rekawL: Record<string, Pozycja> = {};
    if (ubior === 'koszulka') { rekawP['rekaw-p-1'] = { x: 0.14, y: 0.29, w: 0.07, rot: 28 }; rekawL['rekaw-l-1'] = { x: 0.86, y: 0.29, w: 0.07, rot: -28 }; }
    if (kroj) for (const [i, [x, y]] of kroj.rekaw.entries()) {
        rekawP[`rekaw-p-${i + 1}`] = { x, y, w: kroj.wRekaw, rot: kroj.rot };
        rekawL[`rekaw-l-${i + 1}`] = { x: 1 - x, y, w: kroj.wRekaw, rot: -kroj.rot };
    } else if (dlugi) for (const [i, f] of [0.32, 0.48, 0.64].entries()) {
        rekawP[`rekaw-p-${i + 1}`] = { x: 0.19 - i * 0.035, y: f, w: 0.095, rot: 8 };
        rekawL[`rekaw-l-${i + 1}`] = { x: 0.81 + i * 0.035, y: f, w: 0.095, rot: -8 };
    }
    const zTylu: Record<string, Pozycja> = {};   // z tyłu rękawy zamieniają się stronami kadru
    for (const [k, p] of Object.entries(rekawP)) zTylu[k.replace('-p-', '-L-')] = { ...p, x: 1 - p.x, rot: -(p.rot ?? 0) };
    for (const [k, p] of Object.entries(rekawL)) zTylu[k.replace('-l-', '-P-')] = { ...p, x: 1 - p.x, rot: -(p.rot ?? 0) };
    const tylR = Object.fromEntries(Object.entries(zTylu).map(([k, p]) => [k.replace('-L-', '-p-').replace('-P-', '-l-'), p]));
    if (kroj) return {
        przod: { 'przod-l': kroj.piersL, 'przod-p': kroj.piersP, ...rekawP, ...rekawL },
        tyl: { tyl: kroj.tyl, 'tyl-dol': kroj.tylDol, ...tylR },
    };
    return {
        przod: { 'przod-l': { x: 0.64, y: 0.34, w: 0.17 }, 'przod-p': { x: 0.36, y: 0.35, w: 0.22 }, ...rekawP, ...rekawL },
        tyl: { tyl: { x: 0.5, y: ubior === 'bluza' ? 0.5 : 0.44, w: 0.54 }, 'tyl-dol': { x: 0.5, y: 0.7, w: 0.5 }, ...tylR },
    };
}
export function pozycje(ubior: string, uklad: string, styl = 'plaski'): { przod: Record<string, Pozycja>; tyl: Record<string, Pozycja> } {
    if (styl === 'haft') return pozycjeHaftu(ubior);
    const rekawy = ubior === 'koszulka' ? KROTKI_REKAW : ubior === 'torba' ? null : DLUGI_REKAW;
    const piers = uklad === 'herb' ? { x: 0.63, y: 0.33, w: 0.12 } : { x: 0.5, y: ubior === 'torba' ? 0.58 : 0.45, w: ubior === 'torba' ? 0.42 : 0.34 };
    const plecy = { x: 0.5, y: ubior === 'bluza' ? 0.53 : ubior === 'torba' ? 0.58 : 0.47, w: ubior === 'torba' ? 0.42 : 0.4 };
    // z tyłu rękawy zamieniają się stronami kadru (patrzymy na plecy)
    const zTylu = rekawy ? { 'rekaw-l': { ...rekawy['rekaw-p'] }, 'rekaw-p': { ...rekawy['rekaw-l'] } } : {};
    return { przod: { przod: piers, ...(rekawy ?? {}) }, tyl: { tyl: plecy, ...zTylu } };
}

export interface Kolekcja {
    id: string; obraz: string; opisMotywu: string; ubior: string; kolor: string; uklad: string; styl?: string;
    tekst: { tytul?: string; podtytul?: string; zywiol?: string; opowiesc?: string; cytat?: string; edycja?: string; blok?: string; sentencja?: string };
    strefy: Partial<Record<Strefa, string>>; makietaPrzod?: string; makietaTyl?: string; arkusz?: string;
    stan: 'szkic' | 'gotowa'; kiedy: string; psnr?: Record<string, string | null>;
    /** 🧵 QC szwalni przy ostatnim złożeniu: strefy przesunięte/zmniejszone, by nie wystawały poza materiał. */
    qc?: { kiedy: string; poprawki: WynikQc[]; nieMieszcza: string[]; wymiary?: Record<string, { w: number; h: number; kadr?: { x0: number; y0: number; x1: number; y1: number } }> };
}
const dir = (id: string) => path.join(KAT, id);
const url = (id: string, plik: string) => `/nadruki/kolekcje/${id}/${plik}`;
async function czytaj(id: string): Promise<Kolekcja> {
    if (!ID.test(id)) throw new Error('Nie ma takiej kolekcji.');
    try { return JSON.parse(await fs.readFile(path.join(dir(id), 'kolekcja.json'), 'utf8')); } catch { throw new Error('Nie ma takiej kolekcji.'); }
}
async function zapisz(k: Kolekcja) { await fs.mkdir(dir(k.id), { recursive: true }); await fs.writeFile(path.join(dir(k.id), 'kolekcja.json'), JSON.stringify(k, null, 2), 'utf8'); }

export async function lista(): Promise<Kolekcja[]> {
    const out: Kolekcja[] = [];
    for (const d of await fs.readdir(KAT).catch(() => [] as string[])) if (ID.test(d)) { try { out.push(await czytaj(d)); } catch { /* — */ } }
    return out.sort((a, b) => b.kiedy.localeCompare(a.kiedy));
}

const tnij = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
function oczyscTekst(t: any): Kolekcja['tekst'] {
    return { tytul: tnij(t?.tytul, 40), podtytul: tnij(t?.podtytul, 60), zywiol: tnij(t?.zywiol, 24), opowiesc: tnij(t?.opowiesc, 420), cytat: tnij(t?.cytat, 120), edycja: tnij(t?.edycja, 24), blok: tnij(t?.blok, 18), sentencja: tnij(t?.sentencja, 90) };
}

/** Nowa kolekcja: sprawdza motyw, dorysowuje (albo bierze z pamięci) makiety PRZÓD i TYŁ. */
export async function nowa(wej: { obraz: string; ubior?: string; kolor?: string; uklad?: string; styl?: string; tekst?: any }): Promise<Kolekcja> {
    const ubior = UBIORY[String(wej.ubior)] ? String(wej.ubior) : 'bluza';
    const kolor = KOLORY[String(wej.kolor)] ? String(wej.kolor) : 'czarny';
    const uklad = (UKLADY_PRZODU as readonly string[]).includes(String(wej.uklad)) ? String(wej.uklad) : 'plakat';
    const motyw = (await motywy()).find((m) => m.id === wej.obraz);
    if (!motyw) throw new Error('Nie ma takiego motywu w Pracowni.');
    const id = `k-${crypto.randomBytes(4).toString('hex')}`;
    await fs.mkdir(dir(id), { recursive: true });
    const styl = (STYLE as readonly string[]).includes(String(wej.styl)) ? String(wej.styl) : 'plaski';
    const k: Kolekcja = { id, obraz: motyw.id, opisMotywu: motyw.opis, ubior, kolor, uklad, styl, tekst: oczyscTekst(wej.tekst), strefy: {}, stan: 'szkic', kiedy: new Date().toISOString() };
    for (const strona of ['przod', 'tyl'] as const) {
        const m = await makieta(ubior, kolor, { strona });   // FLUX tylko przy pierwszym razie dla ubioru+koloru+strony
        await pobierz(m.plik, path.join(dir(id), `makieta-${strona}.png`));
    }
    await zapisz(k);
    return k;
}

/** Strefa z przeglądarki: surowy PNG (≤ 60 MB, z nagłówkiem PNG). */
export async function wgrajStrefe(id: string, strefa: string, dane: Buffer) {
    const k = await czytaj(id);
    if (!(STREFY as readonly string[]).includes(strefa)) throw new Error(`Strefa: ${STREFY.join(', ')}.`);
    if (k.ubior === 'torba' && strefa.startsWith('rekaw')) throw new Error('Torba nie ma rękawów.');
    if (!Buffer.isBuffer(dane) || dane.length < 100 || dane.readUInt32BE(0) !== 0x89504e47) throw new Error('To nie jest plik PNG.');
    await fs.writeFile(path.join(dir(id), `strefa-${strefa}.png`), dane);
    k.strefy[strefa as Strefa] = url(id, `strefa-${strefa}.png`);
    k.stan = 'szkic';
    await zapisz(k);
    return k;
}

async function naloz(makietaPlik: string, warstwy: { plik: string; poz: Pozycja }[], cel: string) {
    const wm = await wymiary(makietaPlik);
    if (!wm) throw new Error('ffmpeg nie odczytał makiety.');
    const wejscia = ['-y', '-i', makietaPlik];
    const filtry: string[] = [];
    let ostatni = '0:v';
    const prostokaty: { x: number; y: number; w: number; h: number }[] = [];
    for (const [i, w] of warstwy.entries()) {
        const wz = await wymiary(w.plik);
        if (!wz) continue;
        wejscia.push('-i', w.plik);
        const sz = Math.max(8, Math.round(wm[0] * w.poz.w)), wy = Math.max(8, Math.round(sz * wz[1] / wz[0]));
        const kat = ((w.poz.rot ?? 0) * Math.PI) / 180;
        const bw = Math.round(sz * Math.abs(Math.cos(kat)) + wy * Math.abs(Math.sin(kat))), bh = Math.round(sz * Math.abs(Math.sin(kat)) + wy * Math.abs(Math.cos(kat)));
        const px = Math.round(wm[0] * w.poz.x - bw / 2), py = Math.round(wm[1] * w.poz.y - bh / 2);
        const obrot = w.poz.rot ? `,rotate=${kat.toFixed(4)}:c=none:ow=rotw(${kat.toFixed(4)}):oh=roth(${kat.toFixed(4)})` : '';
        filtry.push(`[${i + 1}:v]format=rgba,scale=${sz}:${wy}:flags=lanczos${obrot}[s${i}]`, `[${ostatni}][s${i}]overlay=${px}:${py}[o${i}]`);
        ostatni = `o${i}`;
        prostokaty.push({ x: Math.max(0, px), y: Math.max(0, py), w: Math.min(bw, wm[0] - Math.max(0, px)), h: Math.min(bh, wm[1] - Math.max(0, py)) });
    }
    if (!prostokaty.length) { await fs.copyFile(makietaPlik, cel); return null; }
    await uruchom(FFMPEG, [...wejscia, '-filter_complex', filtry.join(';'), '-map', `[${ostatni}]`, '-frames:v', '1', cel], { maxBuffer: 32 * 1024 * 1024 });
    // czy główna strefa naprawdę siadła (PSNR w jej prostokącie, jak przy logo marki)
    const r = prostokaty[0], wyc = `crop=${r.w}:${r.h}:${r.x}:${r.y}`;
    const { stderr } = await uruchom(FFMPEG, ['-i', cel, '-i', makietaPlik, '-filter_complex', `[0:v]${wyc}[a];[1:v]${wyc}[b];[a][b]psnr`, '-f', 'null', '-'], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => ({ stderr: e.stderr ?? '' }));
    return String(stderr).match(/average:([0-9.]+|inf)/i)?.[1] ?? null;
}

/** Makiety PRZÓD i TYŁ ze strefami + arkusz produkcyjny (wszystkie strefy obok siebie, podpisane). */
export async function zloz(id: string): Promise<Kolekcja> {
    const k = await czytaj(id);
    const poz = pozycje(k.ubior, k.uklad, k.styl);
    const plik = (s: string) => path.join(dir(id), `strefa-${s}.png`);
    const ma = async (s: string) => fs.access(plik(s)).then(() => true, () => false);
    if (!((await ma('przod')) || (await ma('przod-l'))) || !(await ma('tyl'))) throw new Error('Najpierw wgraj strefy przodu i pleców.');
    k.psnr = {};
    const poprawki: WynikQc[] = [], wymiary: NonNullable<NonNullable<Kolekcja['qc']>['wymiary']> = {};
    for (const strona of ['przod', 'tyl'] as const) {
        let warstwy: { strefa: string; plik: string; poz: Pozycja }[] = [];
        for (const [s, p] of Object.entries(poz[strona])) if (await ma(s)) warstwy.push({ strefa: s, plik: plik(s), poz: p });
        // 🧵 QC szwalni: nic poza materiałem, rękaw ≤ 60%, plecy w korpusie, torba bez uchwytów
        const qc = await kontrolaStrony(path.join(dir(id), `makieta-${strona}.png`), k.ubior, warstwy);
        warstwy = warstwy.map((w, i) => ({ ...w, poz: qc[i].po }));
        for (const q of qc) if (q.cm && !wymiary[q.strefa]) wymiary[q.strefa] = { ...q.cm, kadr: q.kadr };
        poprawki.push(...qc.filter((q) => q.zmiana !== 'bez').map((q) => ({ ...q, strefa: `${strona}:${q.strefa}` })));
        const cel = path.join(dir(id), `podglad-${strona}.png`);
        const psnr = await naloz(path.join(dir(id), `makieta-${strona}.png`), warstwy, cel);
        if (psnr && (psnr.toLowerCase() === 'inf' || Number(psnr) > 40)) throw new Error(`Nadruku na ${strona === 'przod' ? 'przodzie' : 'plecach'} nie widać (PSNR ${psnr} dB) — sprawdź strefę.`);
        k.psnr[strona] = psnr;
        if (strona === 'przod') k.makietaPrzod = url(id, 'podglad-przod.png'); else k.makietaTyl = url(id, 'podglad-tyl.png');
    }
    // arkusz: każda strefa przeskalowana do wysokości 1400 px, obok siebie na grafitowym tle
    const obecne = [];
    for (const s of STREFY) if (await ma(s)) obecne.push(s);
    const wej = obecne.flatMap((s) => ['-i', plik(s)]);
    const skal = obecne.map((_, i) => `[${i}:v]format=rgba,scale=-1:1400:flags=lanczos,pad=iw+80:1480:40:40:color=0x1a1a22[a${i}]`).join(';');
    await uruchom(FFMPEG, ['-y', ...wej, '-filter_complex', `${skal};${obecne.map((_, i) => `[a${i}]`).join('')}hstack=inputs=${obecne.length}[w]`, '-map', '[w]', '-frames:v', '1', path.join(dir(id), 'arkusz.png')], { maxBuffer: 32 * 1024 * 1024 });
    k.arkusz = url(id, 'arkusz.png');
    k.qc = { kiedy: new Date().toISOString(), poprawki, wymiary, nieMieszcza: poprawki.filter((q) => q.zmiana === 'nie-miesci').map((q) => q.strefa) };
    k.stan = 'gotowa';
    await zapisz(k);
    return k;
}

/** Języki tekstów na ubraniu (nazwa dla modelu). */
export const JEZYKI: Record<string, string> = { pl: 'polski', en: 'English', de: 'Deutsch', es: 'español', fr: 'français', it: 'italiano', ja: '日本語 (Japanese)', uk: 'українська' };
const nazwaJezyka = (j: string) => JEZYKI[j] ?? JEZYKI.pl;

/** Jedno pytanie do krawca (Ollama, JSON) — wspólne dla opowieści i tłumaczenia; zły JSON = jedna poprawka. */
async function krawiecJson(system: string, prompt: string, temperatura: number, dobre: (t: Kolekcja['tekst']) => boolean): Promise<Kolekcja['tekst']> {
    const stan = await stanKrawca();
    if (!stan.zywy) throw new Error(stan.powod ?? 'Krawiec lokalny nie jest gotowy.');
    for (let proba = 0; proba < 2; proba++) {
        const r = await fetch(`${OLLAMA}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5 * 60 * 1000),
            body: JSON.stringify({ model: stan.model, stream: false, think: false, format: 'json', options: { temperature: temperatura, num_ctx: 4096 }, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
        if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
        const d = await r.json() as { message?: { content?: string } };
        try { const t = oczyscTekst(JSON.parse(String(d.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, ''))); if (dobre(t)) return t; } catch { /* poprawka */ }
        prompt += '\n\nPOPRZEDNIA ODPOWIEDŹ BYŁA ZŁA — oddaj sam poprawny JSON z wszystkimi polami.';
    }
    throw new Error('Krawiec dwa razy nie oddał poprawnego JSON-a.');
}

/** 🌍 Przekład wszystkich tekstów ubioru na wybrany język (nazwy własne i rytm napisów zostają). */
export async function przetlumacz(tekst: any, jezyk: string): Promise<Kolekcja['tekst']> {
    const t = oczyscTekst(tekst);
    if (!JEZYKI[jezyk]) throw new Error(`Język: ${Object.keys(JEZYKI).join(', ')}.`);
    const pola = Object.fromEntries(Object.entries(t).filter(([k, v]) => v && k !== 'edycja'));
    if (!Object.keys(pola).length) throw new Error('Nie ma czego tłumaczyć.');
    const system = `Tłumaczysz napisy na streetwearowe ubranie z Katedry OtakOS na język: ${nazwaJezyka(jezyk)}. Przekład krótki i chwytliwy jak oryginał (napisy na odzieży), ten sam nastrój; imiona i nazwy własne (Teterhia, TeOgochi, OtakOS, 0.00G) zostawiasz albo transliterujesz. Odpowiedz WYŁĄCZNIE JSON-em z TYMI SAMYMI kluczami: ${Object.keys(pola).join(', ')}.`;
    const wynik = await krawiecJson(system, JSON.stringify(pola), 0.3, (w) => Object.keys(pola).every((k) => (w as any)[k]));
    return { ...t, ...Object.fromEntries(Object.keys(pola).map((k) => [k, (wynik as any)[k]])) };
}

/** ✨ Opowieść na plecy: lokalny model krawca pisze z opisu motywu (JSON, jedna poprawka). */
/**
 * 📺 Historia postaci z serialu TeOgochi Mini — PRAWDZIWE kwestie ze scenariuszy odcinków Katedry
 * (`_OtakOs_Wymiar/produkcje/teogochi-mini/odcNN-*\/scenariusz.mjs`, `OTAKOS_SERIAL_DIR`): co postać mówi + zdania narratora z jej imieniem.
 */
const SERIAL = process.env.OTAKOS_SERIAL_DIR || path.resolve(process.cwd(), '..', 'TeO_Genesis', '_OtakOs_Wymiar', 'produkcje', 'teogochi-mini');
export async function historiaPostaci(imie: string): Promise<{ odcinek: string; tytul: string; kwestie: string[] }[]> {
    const im = String(imie ?? '').trim();
    if (im.length < 2) return [];
    const out = [];
    for (const d of (await fs.readdir(SERIAL).catch(() => [] as string[])).filter((x) => /^odc\d+/.test(x)).sort()) {
        const tekst = await fs.readFile(path.join(SERIAL, d, 'scenariusz.mjs'), 'utf8').catch(() => '');
        const tytul = /PODTYTUL\s*=\s*'([^']+)'/.exec(tekst)?.[1] ?? d;
        const kwestie: string[] = [];
        for (const m of tekst.matchAll(/\[\s*'([^']+)'\s*,\s*'((?:[^'\\]|\\.)+)'\s*\]/g)) {
            const ml = m[1].toLowerCase(), il = im.toLowerCase();   // imię z motywu bywa WIELKIMI literami
            if (ml === il) kwestie.push(`${m[1]}: „${m[2]}”`);
            else if (ml === 'narrator' && m[2].toLowerCase().includes(il)) kwestie.push(`Narrator: ${m[2]}`);
        }
        if (kwestie.length) out.push({ odcinek: d, tytul, kwestie: kwestie.slice(0, 6) });
    }
    return out;
}

export async function opowiesc(obraz: string, jezyk = 'pl', { wzor = '', inne = [] as string[], historia = true } = {}): Promise<Kolekcja['tekst']> {
    const motyw = (await motywy()).find((m) => m.id === obraz);
    if (!motyw) throw new Error('Nie ma takiego motywu w Pracowni.');
    const imie = (/[„"]([^"”]{2,30})[”"]/.exec(motyw.opis)?.[1] ?? '').trim();
    const serial = historia && imie ? await historiaPostaci(imie) : [];
    const system = `Jesteś Kronikarzem Teterhii — piszesz LORE na streetwearowe ubranie z Katedry OtakOS. Język WSZYSTKICH pól: ${nazwaJezyka(jezyk)}.
Zwięźle, baśniowo albo mrocznie, z obrazem w słowach; bez cudzych chronionych postaci i bez nazw marek.${serial.length ? `
Postać ma swoją HISTORIĘ Z SERIALU (fakty niżej) — opowieść ma do niej nawiązywać, nie wymyślaj innej biografii.` : ''}${inne.length ? `
Ta postać ma już opowieści na innych modelach: ${inne.join(' | ')} — napisz INNĄ, o innym wątku z historii, z INNYM tytułem.` : ''}
Odpowiedz WYŁĄCZNIE JSON-em: {"tytul":"≤ 3 słowa: przydomek albo nazwa wątku — NIE samo imię postaci","podtytul":"≤ 6 słów","zywiol":"jedno słowo","opowiesc":"2–3 zdania, łącznie ≤ 320 znaków","cytat":"krótka maksyma ≤ 12 słów"}`;
    const prompt = [`MOTYW (opis z Pracowni): ${motyw.opis}`, wzor && `MODEL UBRANIA: ${wzor}`,
        serial.length && `HISTORIA Z SERIALU TeOgochi Mini:\n${serial.map((o) => `[${o.tytul}] ${o.kwestie.join(' ')}`).join('\n')}`].filter(Boolean).join('\n\n');
    // tytuł = nazwa opowieści w sklepie: nie samo imię i nie tytuł z innego modelu (pakiet Shopify pomija tytuł równy imieniu)
    const norm = (s: string) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const zajete = new Set([norm(imie), ...inne.map((x) => norm(String(x).split(' — ')[0]))].filter(Boolean));
    const tekst = await krawiecJson(system, prompt, 0.9, (w) => !!(w.tytul && w.opowiesc) && !zajete.has(norm(w.tytul)));
    return { ...tekst, edycja: `ARCHIVE // 0.00G · Nº ${parseInt(crypto.createHash('sha1').update(obraz).digest('hex').slice(0, 4), 16) % 900 + 100}` };   // stały numer motywu
}

/** Ustaw tekst kolekcji (po poprawkach Suwerena) — strefy trzeba wtedy przerysować w przeglądarce. */
export async function ustawTekst(id: string, tekst: any) { const k = await czytaj(id); k.tekst = oczyscTekst(tekst); k.stan = 'szkic'; await zapisz(k); return k; }

/**
 * 🛍️ Pakiet do Shopify — kolekcje jednej postaci → `public/nadruki/sklep/<imie>/`:
 * `produkty.csv` (format importu produktów Shopify, każdy produkt jako SZKIC `draft`, rozmiary S–XXL dla odzieży),
 * katalog na model (makiety przód/tył, arkusz, pliki druku stref), `CZYTAJ.txt`.
 * UCZCIWIE: cenę podaje Suweren (bez ceny = odmowa); obrazy w CSV tylko, gdy podasz publiczny adres, pod którym je wystawisz
 * (`bazaObrazow`) — Shopify ściąga zdjęcia z URL; inaczej kolumna pusta i zdjęcia dodajesz w panelu Shopify.
 */
const ROZMIARY = ['S', 'M', 'L', 'XL', 'XXL'];
/** Nazwy produktów w sklepie — wydanie globalne po angielsku (Suweren 2026-11-06). */
export const UBIORY_EN: Record<string, string> = { koszulka: 'T-Shirt', bluza: 'Hoodie', longsleeve: 'Longsleeve', torba: 'Tote Bag', bomber: 'Bomber Jacket', jeansowa: 'Denim Jacket', ramoneska: 'Leather Biker Jacket', parka: 'Hooded Parka', plaszcz: 'Trench Coat', kurtka: 'Varsity Jacket' };
const csv = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const slug = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kolekcja';
export async function pakietSklepu({ imie, kolekcje: ids, ceny = {}, waluta = 'EUR', bazaObrazow = '', vendor = '0.00G Style', jezyk = 'en' }: { imie: string; kolekcje: string[]; ceny: Record<string, number>; waluta?: string; bazaObrazow?: string; vendor?: string; jezyk?: string }) {
    const en = jezyk !== 'pl';
    const nazwa = String(imie ?? '').trim().slice(0, 40);
    if (!nazwa) throw new Error('Podaj imię postaci kolekcji.');
    const lista: Kolekcja[] = [];
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 30)) { const k = await czytaj(String(id)); if (k.stan === 'gotowa') lista.push(k); }
    if (!lista.length) throw new Error('Nie ma gotowych kolekcji do pakietu (najpierw „Uszyj”).');
    const brak = [...new Set(lista.map((k) => k.ubior))].filter((u) => !(Number(ceny[u]) > 0));
    if (brak.length) throw new Error(`Podaj cenę dla: ${brak.map((u) => UBIORY[u]?.nazwa ?? u).join(', ')}.`);
    const baza = String(bazaObrazow || '').replace(/\/+$/, '');
    if (baza && !/^https:\/\//.test(baza)) throw new Error('Adres obrazów musi być https.');
    const kat = path.join(PUBLIC, 'nadruki', 'sklep', slug(nazwa));
    await fs.rm(kat, { recursive: true, force: true }); await fs.mkdir(kat, { recursive: true });
    const wiersze = [['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable', 'Image Src', 'Image Position', 'Image Alt Text', 'Status']];
    for (const k of lista) {
        const u = en ? (UBIORY_EN[k.ubior] ?? k.ubior) : (UBIORY[k.ubior]?.nazwa?.replace(/^🧥\s*/, '') ?? k.ubior);
        const KOLOR_EN: Record<string, string> = { czarny: 'black', bialy: 'white', grafitowy: 'graphite', granatowy: 'navy', zielony: 'green', piaskowy: 'sand', burgundowy: 'burgundy' };
        const handle = en ? `${slug(nazwa)}-${slug(UBIORY_EN[k.ubior] ?? k.ubior)}-${KOLOR_EN[k.kolor] ?? slug(k.kolor)}` : `${slug(nazwa)}-${k.ubior}-${k.kolor}`;
        const dk = path.join(kat, handle);
        await fs.mkdir(dk, { recursive: true });
        const pliki = ['podglad-przod.png', 'podglad-tyl.png', 'arkusz.png', ...Object.keys(k.strefy).map((s) => `strefa-${s}.png`)];
        for (const p of pliki) await fs.copyFile(path.join(dir(k.id), p), path.join(dk, p)).catch(() => {});
        // 🧵 pliki DO DRUKU: każda strefa w rozmiarze z QC (cm) przy 300 DPI + znacznik pHYs
        const druk: string[] = [];
        for (const s of Object.keys(k.strefy)) {
            const cm = k.qc?.wymiary?.[s]; if (!cm) continue;
            const px = Math.max(16, Math.round((cm.w / 2.54) * 300));
            const cel = path.join(dk, `druk-${s}-${cm.w}x${cm.h}cm-300dpi.png`);
            await uruchom(FFMPEG, ['-v', 'error', '-y', '-i', path.join(dir(k.id), `strefa-${s}.png`), '-vf', `${cm.kadr ? `crop=iw*${(cm.kadr.x1 - cm.kadr.x0).toFixed(4)}:ih*${(cm.kadr.y1 - cm.kadr.y0).toFixed(4)}:iw*${cm.kadr.x0.toFixed(4)}:ih*${cm.kadr.y0.toFixed(4)},` : ''}scale=${px}:-1:flags=lanczos`, '-pix_fmt', 'rgba', cel], { maxBuffer: 16 * 1024 * 1024 });
            await fs.writeFile(cel, pngZDpi(await fs.readFile(cel), 300));
            druk.push(`  ${s}: ${cm.w} × ${cm.h} cm (${px} px, 300 DPI)`);
        }
        if (druk.length) await fs.writeFile(path.join(dk, 'WYMIARY-DRUKU.txt'), [`${u} — strefy do druku (QC szwalni ${k.qc?.kiedy?.slice(0, 10) ?? ''}):`, ...druk, '',
            'Wymiary liczone z makiety względem typowej długości ubrania w rozmiarze M (torba: szerokości korpusu) — PRZYBLIŻENIE.',
            'Wiążący jest szablon drukarni: w kreatorze ustaw naszywkę na podany rozmiar i sprawdź, czy mieści się w polu druku tego produktu.'].join('\n'), 'utf8');
        const t = k.tekst;
        const opis = `<p><strong>${t.tytul || nazwa}</strong>${t.podtytul ? ` — ${t.podtytul}` : ''}</p>${t.opowiesc ? `<p>${t.opowiesc}</p>` : ''}${t.cytat ? `<p><em>${en ? '“' : '„'}${t.cytat}”</em></p>` : ''}<p>${en ? `${u} · ${k.styl === 'haft' ? 'chenille embroidered patches' : 'printed'}. 0.00G Style · ${nazwa} from the TeOgochi Mini series.` : `${u} · ${k.kolor} · ${k.styl === 'haft' ? 'naszywki haftowane' : 'nadruk'}. 0.00G Style · postać ${nazwa} z serialu TeOgochi Mini.`}</p>`;
        const tytul = `${nazwa} — ${t.tytul && t.tytul !== nazwa ? `${t.tytul} · ` : ''}${u}`;
        const tagi = ['0.00G Style', 'TeOgochi', nazwa, u, k.styl === 'haft' ? (en ? 'patches' : 'naszywki') : (en ? 'print' : 'nadruk')].join(', ');
        const obrazy = baza ? [`${baza}/${handle}/podglad-przod.png`, `${baza}/${handle}/podglad-tyl.png`] : [];
        const warianty = k.ubior === 'torba' ? ['Default Title'] : ROZMIARY;
        warianty.forEach((r, i) => wiersze.push([handle, i ? '' : tytul, i ? '' : opis, i ? '' : vendor, i ? '' : u, i ? '' : tagi, i ? '' : 'FALSE',
            k.ubior === 'torba' ? 'Title' : (en ? 'Size' : 'Rozmiar'), r, `${handle}-${r}`.toUpperCase().slice(0, 60), String(Number(ceny[k.ubior]).toFixed(2)), 'TRUE', 'TRUE',
            obrazy[i] ?? '', obrazy[i] ? String(i + 1) : '', obrazy[i] ? `${nazwa} — ${u} (${i ? (en ? 'back' : 'tył') : (en ? 'front' : 'przód')})` : '', i ? '' : 'draft']));
    }
    await fs.writeFile(path.join(kat, 'produkty.csv'), '﻿' + wiersze.map((w) => w.map(csv).join(',')).join('\n'), 'utf8');
    await fs.writeFile(path.join(kat, 'CZYTAJ.txt'), [
        `Pakiet kolekcji „${nazwa}” — ${lista.length} produktów, ceny w ${waluta}.`,
        'Shopify → Produkty → Importuj → produkty.csv. Każdy produkt wchodzi jako SZKIC (draft) — sprawdzasz i publikujesz sam.',
        baza ? `Zdjęcia w CSV wskazują na ${baza}/… — muszą tam być publicznie, zanim zaimportujesz.` : 'Zdjęć w CSV nie ma (brak publicznego adresu) — dodaj podglad-przod.png i podglad-tyl.png z katalogu produktu w panelu Shopify.',
        'Pliki druk-<strefa>-<szer>x<wys>cm-300dpi.png = strefa w rozmiarze z kontroli szwalni, 300 DPI (WYMIARY-DRUKU.txt w katalogu produktu). strefa-*.png = oryginał 4096 px; arkusz.png = podgląd wszystkich stref.',
        'Makiety to rysunek FLUX, nie zdjęcie produktu drukarni — na stronie sklepu lepiej podmienić je na makiety z kreatora drukarni.',
        `Walutę sklepu ustawiasz w Shopify (CSV podaje same liczby — tu ${waluta}).`,
    ].join('\n'), 'utf8');
    return { katalog: `/nadruki/sklep/${slug(nazwa)}`, csv: `/nadruki/sklep/${slug(nazwa)}/produkty.csv`, produktow: lista.length, wierszy: wiersze.length - 1 };
}

export async function usun(id: string) { await czytaj(id); await fs.rm(dir(id), { recursive: true, force: true }); return { usunieta: id }; }
