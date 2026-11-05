/**
 * 👕 NADRUKI — motywy Teterhii i Mini-TeOgochi z Pracowni obrazów Katedry na bluzach, koszulkach, torbach.
 *
 * Suweren 2026-11-01: „mógłby brać też z obrazów… mini teogochi… świetne są na nadruki, bluzy, koszulki”.
 *
 * Droga: obraz Pracowni (Katedra `GET /api/assety3d/obrazy`, gałęzie mini-teogochi, postacie, stwory…) + MAKIETA
 * pustego ubioru (FLUX przez `narysuj`, raz na ubiór i kolor, potem z pamięci) → ffmpeg: tło motywu wycięte
 * (`colorkey` bieli — Pracownia rysuje „jeden obiekt na spokojnym tle”), motyw na piersi → podgląd
 * `public/nadruki/<id>.png` + PLIK DRUKU `<id>-druk.png` (sam motyw z przezroczystym tłem, 4096 px).
 *
 * ⚠️ UCZCIWIE: plik druku to motyw 1024 px POWIĘKSZONY lanczosem — nie jest to prawdziwe 300 DPI. Do druku DTG
 *    sprawdź ostrość przed zamówieniem. Makieta to rysunek FLUX, nie zdjęcie produktu dostawcy.
 * ⚠️ Nałożenie sprawdzane jak logo marki: PSNR w prostokącie motywu — „ffmpeg nie zwrócił błędu” ≠ „motyw widać”.
 * Oryginały (obraz Pracowni, makieta) zostają nietknięte.
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { FFMPEG } from './marki';
import { narysuj, lista as wczytajWizualizacje } from './wizualizacje';

const uruchom = promisify(execFile);
const MOST = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';
const KORZEN = path.join(process.cwd(), 'OtakOs_Fashion');
const PLIK = path.join(KORZEN, 'nadruki.json');
const KATALOG = path.join(process.cwd(), 'public', 'nadruki');

export const UBIORY: Record<string, { nazwa: string; prompt: string; x: number; y: number; skala: number }> = {
    koszulka: { nazwa: 'Koszulka', prompt: 't-shirt', x: 0.5, y: 0.42, skala: 0.3 },
    bluza: { nazwa: 'Bluza z kapturem', prompt: 'pullover hoodie with hood', x: 0.5, y: 0.47, skala: 0.28 },
    longsleeve: { nazwa: 'Longsleeve', prompt: 'long sleeve t-shirt', x: 0.5, y: 0.42, skala: 0.28 },
    torba: { nazwa: 'Torba bawełniana', prompt: 'cotton canvas tote bag', x: 0.5, y: 0.58, skala: 0.42 },
};
export const KOLORY: Record<string, string> = { czarny: 'black', bialy: 'white', grafitowy: 'charcoal grey', granatowy: 'navy blue', zielony: 'forest green', piaskowy: 'sand beige' };
/** Gałęzie Pracowni, z których bierzemy motywy (krainy i otoczenie to koncepty scen — na nadruk słabo). */
export const GALEZIE_MOTYWOW = ['mini-teogochi', 'postacie', 'stwory', 'wierzchowce', 'rekwizyty', 'ekwipunek'];

export interface Nadruk {
    id: string; obraz: string; opisMotywu: string; galaz: string | null; ubior: string; kolor: string;
    x: number; y: number; skala: number; tlo: 'wytnij' | 'zostaw';
    podglad: string; druk: string; psnr: string | null; kiedy: string;
}

async function wczytaj(): Promise<Nadruk[]> { try { return JSON.parse(await fs.readFile(PLIK, 'utf8')); } catch { return []; } }
async function zapisz(l: Nadruk[]) { await fs.mkdir(KORZEN, { recursive: true }); await fs.writeFile(PLIK, JSON.stringify(l, null, 2), 'utf8'); }
export const lista = wczytaj;

const ogranicz = (v: unknown, od: number, doo: number, dom: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(doo, Math.max(od, n)) : dom; };

/** Motywy z Pracowni Katedry (tylko gałęzie postaci/stworków/rzeczy), nowsze pierwsze. */
export async function motywy(): Promise<{ id: string; opis: string; galaz: string | null; projekt: string | null; plik: string }[]> {
    const r = await fetch(`${MOST}/api/assety3d/obrazy`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!r?.ok) throw new Error('Katedra nie odpowiada — motywy leżą w Pracowni obrazów Katedry (odpal most).');
    const d = await r.json() as { obrazy?: { id: string; opis?: string; galaz?: string | null; projekt?: string | null; kiedy?: string }[] };
    return (d.obrazy ?? [])
        .filter((o) => GALEZIE_MOTYWOW.includes(String(o.galaz)))
        .sort((a, b) => String(b.kiedy ?? '').localeCompare(String(a.kiedy ?? '')))
        .map((o) => ({ id: o.id, opis: String(o.opis ?? '').slice(0, 300), galaz: o.galaz ?? null, projekt: o.projekt ?? null, plik: `/api/assety3d/obrazy/${encodeURIComponent(o.id)}/plik` }));
}

/** Pusta makieta ubioru: z pamięci wizualizacji albo narysowana raz (FLUX, ziarno stałe). */
export async function makieta(ubior: string, kolor: string, { odNowa = false } = {}) {
    if (!UBIORY[ubior]) throw new Error(`Ubiór: ${Object.keys(UBIORY).join(', ')}.`);
    if (!KOLORY[kolor]) throw new Error(`Kolor: ${Object.keys(KOLORY).join(', ')}.`);
    const id = `makieta-${ubior}-${kolor}`;
    const jest = (await wczytajWizualizacje()).find((w) => w.id === id);
    if (jest && !odNowa) return jest;
    const zlec = () => narysuj({
        id, szerokosc: 768, wysokosc: 1024, ziarno: 4242,
        prompt: `flat lay product photo of a plain ${KOLORY[kolor]} ${UBIORY[ubior].prompt}, front view, perfectly centered, symmetrical, completely blank front with no print, no logo, no text, no graphics, soft even studio lighting, plain light grey background`,
    });
    // ComfyUI budzony przez most odpowiada „właśnie wstaje” — czekamy do ~3 min, zamiast odbijać Suwerena.
    for (let proba = 0; ; proba++) {
        try { return await zlec(); }
        catch (e) {
            if (proba >= 12 || !/wstaje/i.test(String((e as Error).message))) throw e;
            await new Promise((r) => setTimeout(r, 15000));
        }
    }
}

async function pobierz(url: string, cel: string) {
    const r = await fetch(`${MOST}${url}`, { signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`Nie pobrałem ${url} z Katedry: HTTP ${r.status}`);
    await fs.writeFile(cel, Buffer.from(await r.arrayBuffer()));
}
async function wymiary(plik: string): Promise<[number, number] | null> {
    const { stderr } = await uruchom(FFMPEG, ['-i', plik, '-f', 'null', '-'], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => ({ stderr: e.stderr ?? '' }));
    const m = String(stderr).match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
    return m ? [Number(m[1]), Number(m[2])] : null;
}

/** Nadruk: motyw z Pracowni na makiecie ubioru + plik druku. Rzuca, gdy motywu nie widać. */
export async function nadrukuj(wej: { obraz: string; ubior?: string; kolor?: string; x?: number; y?: number; skala?: number; tlo?: string }): Promise<Nadruk> {
    const ubior = UBIORY[String(wej.ubior)] ? String(wej.ubior) : 'koszulka';
    const kolor = KOLORY[String(wej.kolor)] ? String(wej.kolor) : 'czarny';
    const u = UBIORY[ubior];
    const x = ogranicz(wej.x, 0.15, 0.85, u.x), y = ogranicz(wej.y, 0.15, 0.85, u.y), skala = ogranicz(wej.skala, 0.08, 0.7, u.skala);
    const tlo: Nadruk['tlo'] = wej.tlo === 'zostaw' ? 'zostaw' : 'wytnij';
    const motyw = (await motywy()).find((m) => m.id === wej.obraz);
    if (!motyw) throw new Error('Nie ma takiego motywu w Pracowni (albo jest z gałęzi krajobrazów).');
    const mak = await makieta(ubior, kolor);

    const id = `n-${crypto.randomBytes(4).toString('hex')}`;
    await fs.mkdir(KATALOG, { recursive: true });
    const tmp = await fs.mkdtemp(path.join(KORZEN, '_nadruk_'));
    try {
        const pMotyw = path.join(tmp, 'motyw.png'), pMak = path.join(tmp, 'makieta.png');
        await pobierz(motyw.plik, pMotyw);
        await pobierz(mak.plik, pMak);
        const wm = await wymiary(pMak), wo = await wymiary(pMotyw);
        if (!wm || !wo) throw new Error('ffmpeg nie odczytał wymiarów makiety albo motywu.');
        const sz = Math.max(16, Math.round(wm[0] * skala)), wy = Math.max(16, Math.round(sz * wo[1] / wo[0]));
        const px = Math.max(0, Math.round(wm[0] * x - sz / 2)), py = Math.max(0, Math.round(wm[1] * y - wy / 2));
        // Tło Pracowni bywa jasnoszare, nie białe — kolor do wycięcia bierzemy z lewego górnego rogu motywu.
        const rog = await uruchom(FFMPEG, ['-v', 'error', '-i', pMotyw, '-vf', 'crop=8:8:0:0,scale=1:1', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1024 * 1024 })
            .then((r) => r.stdout as unknown as Buffer).catch(() => null);
        const kolorTla = rog && rog.length >= 3 ? `0x${[rog[0], rog[1], rog[2]].map((b) => b.toString(16).padStart(2, '0')).join('')}` : '0xFFFFFF';
        const wytnij = tlo === 'wytnij' ? `colorkey=${kolorTla}:0.2:0.1,` : '';

        const podglad = path.join(KATALOG, `${id}.png`), druk = path.join(KATALOG, `${id}-druk.png`);
        await uruchom(FFMPEG, ['-y', '-i', pMak, '-i', pMotyw, '-filter_complex',
            `[1:v]format=rgba,${wytnij}scale=${sz}:${wy}:flags=lanczos[m];[0:v][m]overlay=${px}:${py}`, '-frames:v', '1', podglad], { maxBuffer: 16 * 1024 * 1024 });
        await uruchom(FFMPEG, ['-y', '-i', pMotyw, '-vf', `format=rgba,${wytnij}scale=4096:-1:flags=lanczos`, '-frames:v', '1', druk], { maxBuffer: 16 * 1024 * 1024 });

        // Czy motyw naprawdę siadł: PSNR w jego prostokącie (jak przy logo marki).
        const wycinek = `crop=${Math.min(sz, wm[0] - px)}:${Math.min(wy, wm[1] - py)}:${px}:${py}`;
        const { stderr } = await uruchom(FFMPEG, ['-i', podglad, '-i', pMak, '-filter_complex', `[0:v]${wycinek}[a];[1:v]${wycinek}[b];[a][b]psnr`, '-f', 'null', '-'], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => ({ stderr: e.stderr ?? '' }));
        const psnr = String(stderr).match(/average:([0-9.]+|inf)/i)?.[1] ?? null;
        if (psnr && (psnr.toLowerCase() === 'inf' || Number(psnr) > 40)) {
            await fs.unlink(podglad).catch(() => {}); await fs.unlink(druk).catch(() => {});
            throw new Error(`Motywu nie widać na ubiorze (PSNR ${psnr} dB w jego prostokącie) — wycięcie tła zjadło obraz? Spróbuj „zostaw tło”.`);
        }
        const n: Nadruk = { id, obraz: motyw.id, opisMotywu: motyw.opis, galaz: motyw.galaz, ubior, kolor, x, y, skala, tlo,
            podglad: `/nadruki/${id}.png`, druk: `/nadruki/${id}-druk.png`, psnr, kiedy: new Date().toISOString() };
        await zapisz([n, ...(await wczytaj())].slice(0, 300));
        return n;
    } finally { await fs.rm(tmp, { recursive: true, force: true }).catch(() => {}); }
}

export async function usun(id: string) {
    const l = await wczytaj();
    const n = l.find((x) => x.id === id);
    if (!n) throw new Error('Nie ma takiego nadruku.');
    for (const p of [n.podglad, n.druk]) await fs.unlink(path.join(process.cwd(), 'public', p)).catch(() => {});
    await zapisz(l.filter((x) => x.id !== id));
    return n;
}
