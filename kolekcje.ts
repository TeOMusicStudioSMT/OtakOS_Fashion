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
import { UBIORY, KOLORY, makieta, motywy, pobierz, wymiary } from './nadruki';
import { stanKrawca } from './krawiec-lokalny';

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
function pozycjeHaftu(ubior: string): { przod: Record<string, Pozycja>; tyl: Record<string, Pozycja> } {
    const dlugi = ['bluza', 'longsleeve', 'kurtka'].includes(ubior);
    const rekawP: Record<string, Pozycja> = {}, rekawL: Record<string, Pozycja> = {};
    if (ubior === 'koszulka') { rekawP['rekaw-p-1'] = { x: 0.14, y: 0.29, w: 0.07, rot: 28 }; rekawL['rekaw-l-1'] = { x: 0.86, y: 0.29, w: 0.07, rot: -28 }; }
    if (dlugi) for (const [i, f] of [0.32, 0.48, 0.64].entries()) {
        rekawP[`rekaw-p-${i + 1}`] = { x: 0.19 - i * 0.035, y: f, w: 0.095, rot: 8 };
        rekawL[`rekaw-l-${i + 1}`] = { x: 0.81 + i * 0.035, y: f, w: 0.095, rot: -8 };
    }
    const zTylu: Record<string, Pozycja> = {};   // z tyłu rękawy zamieniają się stronami kadru
    for (const [k, p] of Object.entries(rekawP)) zTylu[k.replace('-p-', '-L-')] = { ...p, x: 1 - p.x, rot: -(p.rot ?? 0) };
    for (const [k, p] of Object.entries(rekawL)) zTylu[k.replace('-l-', '-P-')] = { ...p, x: 1 - p.x, rot: -(p.rot ?? 0) };
    const tylR = Object.fromEntries(Object.entries(zTylu).map(([k, p]) => [k.replace('-L-', '-p-').replace('-P-', '-l-'), p]));
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
    for (const strona of ['przod', 'tyl'] as const) {
        const warstwy = [];
        for (const [s, p] of Object.entries(poz[strona])) if (await ma(s)) warstwy.push({ plik: plik(s), poz: p });
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
    k.stan = 'gotowa';
    await zapisz(k);
    return k;
}

/** ✨ Opowieść na plecy: lokalny model krawca pisze z opisu motywu (JSON, jedna poprawka). */
export async function opowiesc(obraz: string, jezyk: 'pl' | 'en' = 'pl'): Promise<Kolekcja['tekst']> {
    const motyw = (await motywy()).find((m) => m.id === obraz);
    if (!motyw) throw new Error('Nie ma takiego motywu w Pracowni.');
    const stan = await stanKrawca();
    if (!stan.zywy) throw new Error(stan.powod ?? 'Krawiec lokalny nie jest gotowy.');
    const system = `Jesteś Kronikarzem Teterhii — piszesz LORE na plecy streetwearowej bluzy z Katedry OtakOS. Język: ${jezyk === 'en' ? 'English' : 'polski'}.
Zwięźle, baśniowo albo mrocznie, z obrazem w słowach; bez cudzych chronionych postaci i bez nazw marek.
Odpowiedz WYŁĄCZNIE JSON-em: {"tytul":"≤ 3 słowa, IMIĘ albo przydomek","podtytul":"≤ 6 słów","zywiol":"jedno słowo","opowiesc":"2–3 zdania, łącznie ≤ 320 znaków","cytat":"krótka maksyma ≤ 12 słów"}`;
    let prompt = `MOTYW (opis z Pracowni): ${motyw.opis}`;
    for (let proba = 0; proba < 2; proba++) {
        const r = await fetch(`${OLLAMA}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5 * 60 * 1000),
            body: JSON.stringify({ model: stan.model, stream: false, think: false, format: 'json', options: { temperature: 0.9, num_ctx: 4096 }, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
        if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
        const d = await r.json() as { message?: { content?: string } };
        try {
            const t = oczyscTekst(JSON.parse(String(d.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '')));
            if (t.tytul && t.opowiesc) return { ...t, edycja: `ARCHIVE // 0.00G · Nº ${parseInt(crypto.createHash('sha1').update(obraz).digest('hex').slice(0, 4), 16) % 900 + 100}` };   // stały numer motywu
        } catch { /* jedna poprawka */ }
        prompt += '\n\nPOPRZEDNIA ODPOWIEDŹ BYŁA ZŁA — oddaj sam poprawny JSON z polami tytul i opowiesc.';
    }
    throw new Error('Krawiec dwa razy nie oddał opowieści w formacie JSON.');
}

/** Ustaw tekst kolekcji (po poprawkach Suwerena) — strefy trzeba wtedy przerysować w przeglądarce. */
export async function ustawTekst(id: string, tekst: any) { const k = await czytaj(id); k.tekst = oczyscTekst(tekst); k.stan = 'szkic'; await zapisz(k); return k; }

export async function usun(id: string) { await czytaj(id); await fs.rm(dir(id), { recursive: true, force: true }); return { usunieta: id }; }
