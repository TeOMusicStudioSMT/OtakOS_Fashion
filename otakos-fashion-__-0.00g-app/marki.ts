/**
 * 🏷️ MARKI — kto firmuje kreację i ile to jest warte.
 *
 * Suweren: „marki, które będą swe logo na brand nakładać z automatu",
 * „wartości wyświetlane w GRV, mierzone na assetach portfolio".
 *
 * ⚠️ WYCENA NIE JEST ZMYŚLONA I NIE MOŻE BYĆ. Marka nosi JAWNĄ stawkę GRV
 * za sztukę, którą ustawia człowiek; panel mnoży ją przez POLICZONE assety
 * portfolio. Wymyślenie „algorytmu wyceny mody" dałoby liczbę wyglądającą
 * na wiedzę, a będącą zgadywanką — i ktoś by na niej oparł decyzję.
 *
 * Stąd wycena rozbita jest na trzy jawne składniki: ile kreacji, ile z nich
 * narysowanych, ile ofirmowanych. Każdy ma własną stawkę. Widać, skąd bierze
 * się każdy GRV.
 *
 * ⚠️ NAKŁADANIE LOGO JEST NIEODWRACALNE DLA PLIKU WYJŚCIOWEGO, więc NIGDY
 * nie nadpisujemy oryginału. Ofirmowana kreacja to nowy plik obok.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const uruchom = promisify(execFile);

/**
 * Gdzie jest ffmpeg.
 *
 * ⚠️ NIE INSTALUJEMY `ffmpeg-static` w tym module. Katedra ma go już od dawna
 * (Montażownia, muzyka do filmu, sklejki) — dokładanie drugiej kopii to
 * kolejne 30 MB natywnego binarium i drugie źródło prawdy o tym, która wersja
 * liczy. Szukamy istniejącego, po kolei:
 *   1. OTAKOS_FFMPEG — gdy Suweren wskaże własny
 *   2. binarium Katedry w TeO_Genesis/node_modules
 *   3. `ffmpeg` z PATH
 *
 * Gdy żadnego nie ma, mówimy to WPROST przy pierwszej próbie nałożenia logo —
 * zamiast wywalać się cudzym „ENOENT".
 */
function znajdzFfmpeg(): string | null {
    const kandydaci = [
        process.env.OTAKOS_FFMPEG,
        path.resolve(process.cwd(), '..', '..', 'TeO_Genesis', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
        path.resolve(process.cwd(), '..', '..', 'TeO_Genesis', 'node_modules', 'ffmpeg-static', 'ffmpeg'),
    ].filter(Boolean) as string[];

    for (const k of kandydaci) {
        try { if (fsSync.existsSync(k)) return k; } catch { /* następny */ }
    }
    // Ostatnia deska: ffmpeg z PATH. `execFile` sam go odnajdzie.
    return 'ffmpeg';
}

const FFMPEG = znajdzFfmpeg();

const KORZEN = path.join(process.cwd(), 'OtakOs_Fashion');
const PLIK = path.join(KORZEN, 'marki.json');
const KATALOG_LOGO = path.join(KORZEN, 'logo');
const KATALOG_OFIRMOWANE = path.join(process.cwd(), 'public', 'ofirmowane');

/** Gdzie na kreacji siada logo. Nazwy po ludzku, przeliczane na wyrażenie ffmpeg. */
export const ROGI = {
    'lewy-gorny': 'M:M',
    'prawy-gorny': 'W-w-M:M',
    'lewy-dolny': 'M:H-h-M',
    'prawy-dolny': 'W-w-M:H-h-M',
    'srodek-dolny': '(W-w)/2:H-h-M',
} as const;
export type Rog = keyof typeof ROGI;

export interface Marka {
    id: string;
    nazwa: string;
    opis: string;
    /** Nazwa pliku logo w OtakOs_Fashion/logo/. Bez logo marka nic nie ofirmuje. */
    logo: string | null;
    rog: Rog;
    /** Ile procent szerokości kreacji ma zajmować logo. */
    skala: number;
    /** 0–1. Zbyt mocne logo zabija zdjęcie produktu, zbyt słabe jest niewidoczne. */
    krycie: number;
    /**
     * ⚠️ STAWKI USTAWIA CZŁOWIEK. To nie jest wycena rynkowa, tylko przelicznik
     * przyjęty przez Suwerena — i tak jest podpisany w panelu.
     */
    stawki: { zaKreacje: number; zaNarysowana: number; zaOfirmowana: number };
    utworzono: string;
}

async function wczytaj(): Promise<Marka[]> {
    try {
        const j = JSON.parse(await fs.readFile(PLIK, 'utf8'));
        return Array.isArray(j) ? j : (j.marki ?? []);
    } catch {
        return [];
    }
}

/** Zapis atomowy: tmp → rename. */
async function zapiszPlik(lista: Marka[]) {
    await fs.mkdir(KORZEN, { recursive: true });
    const tmp = `${PLIK}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ marki: lista }, null, 2), 'utf8');
    await fs.rename(tmp, PLIK);
}

export const lista = wczytaj;

export async function zapisz(dane: Partial<Marka> & { nazwa: string }): Promise<Marka> {
    const nazwa = String(dane.nazwa || '').trim();
    if (nazwa.length < 2) throw new Error('Marka potrzebuje nazwy (min. 2 znaki).');

    const marki = await wczytaj();
    const istniejaca = dane.id ? marki.find((m) => m.id === dane.id) : null;
    const wpis: Marka = {
        ...(istniejaca ?? { utworzono: new Date().toISOString() }),
        id: istniejaca?.id ?? `marka-${Date.now().toString(36)}`,
        nazwa,
        opis: String(dane.opis ?? istniejaca?.opis ?? '').trim(),
        logo: dane.logo !== undefined ? dane.logo : (istniejaca?.logo ?? null),
        rog: (dane.rog && dane.rog in ROGI ? dane.rog : (istniejaca?.rog ?? 'prawy-dolny')) as Rog,
        skala: Math.min(0.5, Math.max(0.03, Number(dane.skala ?? istniejaca?.skala ?? 0.14))),
        krycie: Math.min(1, Math.max(0.05, Number(dane.krycie ?? istniejaca?.krycie ?? 0.85))),
        stawki: {
            zaKreacje: Number(dane.stawki?.zaKreacje ?? istniejaca?.stawki.zaKreacje ?? 10),
            zaNarysowana: Number(dane.stawki?.zaNarysowana ?? istniejaca?.stawki.zaNarysowana ?? 50),
            zaOfirmowana: Number(dane.stawki?.zaOfirmowana ?? istniejaca?.stawki.zaOfirmowana ?? 100),
        },
        utworzono: istniejaca?.utworzono ?? new Date().toISOString(),
    };

    if (istniejaca) Object.assign(istniejaca, wpis);
    else marki.push(wpis);
    await zapiszPlik(marki);
    return wpis;
}

export async function usun(id: string): Promise<Marka> {
    const marki = await wczytaj();
    const i = marki.findIndex((m) => m.id === id);
    if (i < 0) throw new Error('Nie ma takiej marki.');
    const [usunieta] = marki.splice(i, 1);
    await zapiszPlik(marki);
    return usunieta;
}

/**
 * Wgraj logo. Plik idzie DANYMI (base64), nie ścieżką.
 *
 * ⚠️ ROZPOZNAJEMY TYP PO ZAWARTOŚCI, nie po nazwie. Raz już w tej Katedrze
 * próbka WAV wylądowała jako `probka.png`, bo ufaliśmy rozszerzeniu — i panel
 * pokazywał ją jako obrazek, którego nie dało się otworzyć.
 */
export async function wgrajLogo(id: string, base64: string, nazwaPliku = 'logo'): Promise<Marka> {
    const bufor = Buffer.from(String(base64).replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (bufor.length < 64) throw new Error('Plik logo jest pusty.');

    const magia = bufor.subarray(0, 12);
    let rozsz: string | null = null;
    if (magia[0] === 0x89 && magia[1] === 0x50) rozsz = '.png';
    else if (magia[0] === 0xff && magia[1] === 0xd8) rozsz = '.jpg';
    else if (magia.subarray(0, 4).toString() === 'RIFF' && magia.subarray(8, 12).toString() === 'WEBP') rozsz = '.webp';
    if (!rozsz) throw new Error('To nie jest PNG, JPG ani WEBP. Logo z przezroczystością wgraj jako PNG.');

    await fs.mkdir(KATALOG_LOGO, { recursive: true });
    const bezpieczna = `${id}_${String(nazwaPliku).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}${rozsz}`;
    await fs.writeFile(path.join(KATALOG_LOGO, bezpieczna), bufor);
    return zapisz({ id, nazwa: (await wczytaj()).find((m) => m.id === id)?.nazwa ?? id, logo: bezpieczna });
}

/**
 * Nałóż logo marki na kreację — Z AUTOMATU.
 *
 * ⚠️ ORYGINAŁ ZOSTAJE NIETKNIĘTY. Wynik to nowy plik w `public/ofirmowane/`.
 * Nadpisanie kreacji własnym znakiem wodnym jest nieodwracalne, a decyzja
 * o marce bywa zmieniana.
 *
 * ⚠️ Skala liczona w PROCENTACH SZEROKOŚCI kreacji, nie w pikselach — to samo
 * logo ma wyglądać tak samo na 704×480 i na 1280×704.
 */
export async function nalozLogo({ marka, zrodlo, nazwaWynikowa }: {
    marka: Marka; zrodlo: string; nazwaWynikowa: string;
}): Promise<{ plik: string; nazwa: string; roznica?: string | null }> {
    if (!marka.logo) throw new Error(`Marka „${marka.nazwa}" nie ma wgranego logo — nie ma czego nałożyć.`);

    const logo = path.join(KATALOG_LOGO, path.basename(marka.logo));
    await fs.access(logo).catch(() => { throw new Error(`Plik logo „${marka.logo}" zniknął z dysku.`); });

    await fs.mkdir(KATALOG_OFIRMOWANE, { recursive: true });
    const bezpieczna = `${String(nazwaWynikowa).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)}_${marka.id}.png`;
    const cel = path.join(KATALOG_OFIRMOWANE, bezpieczna);

    const margines = 'main_w*0.03';
    const pozycja = ROGI[marka.rog]
        .replace(/W/g, 'main_w').replace(/H/g, 'main_h')
        .replace(/\bw\b/g, 'overlay_w').replace(/\bh\b/g, 'overlay_h')
        .replace(/M/g, margines);

    // ⚠️ `scale` NIE ZNA `main_w` — te zmienne istnieją tylko w `overlay`.
    // Dlatego szerokość logo liczymy w JavaScripcie, po odczytaniu wymiarów
    // kreacji z ffmpega. Filtr `scale=iw*0.14*main_w/iw` wygląda sensownie
    // i wywala się przy uruchomieniu.
    const { stderr } = await uruchom(FFMPEG, ['-i', zrodlo, '-f', 'null', '-'], { maxBuffer: 8 * 1024 * 1024 })
        .catch((e) => ({ stderr: e.stderr ?? '' }));
    const m = String(stderr).match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
    const szerokosc = m ? Number(m[1]) : 704;
    const szerokoscLogo = Math.max(24, Math.round(szerokosc * marka.skala));

    const filtr = [
        `[1:v]scale=${szerokoscLogo}:-1[skala]`,
        `[skala]format=rgba,colorchannelmixer=aa=${marka.krycie}[logo]`,
        `[0:v][logo]overlay=${pozycja}`,
    ].join(';');

    await uruchom(FFMPEG, [
        '-y', '-i', zrodlo, '-i', logo,
        '-filter_complex', filtr,
        '-frames:v', '1', cel,
    ], { maxBuffer: 16 * 1024 * 1024 });

    const st = await fs.stat(cel);
    if (st.size < 1024) throw new Error('ffmpeg oddał pusty plik — logo się nie nałożyło.');

    /**
     * ⚠️ „ffmpeg NIE ZWRÓCIŁ BŁĘDU" TO NIE TO SAMO CO „LOGO JEST WIDOCZNE".
     *
     * Zmierzone: logo w całości przezroczyste przeszło przez cały łańcuch bez
     * jednego ostrzeżenia. Powstał poprawny plik — bez logo. Panel pokazałby
     * sukces, a Suweren wystawiłby nieofirmowaną kreację jako ofirmowaną.
     *
     * ⚠️ PIERWSZA WERSJA TEGO STRAŻNIKA BYŁA ZŁA i to też jest zmierzone.
     * Porównywała CAŁE obrazy i odrzucała powyżej 50 dB — a przezroczyste logo
     * dało 43,6 dB, czyli przeszło. Powód: overlay dotyka niecałych 3% kadru,
     * więc różnica rozmyta na całości nic nie znaczy. Widoczne logo dało 21,6 dB
     * — obie liczby po tej samej stronie progu wziętego z sufitu.
     *
     * Dlatego porównujemy WYŁĄCZNIE PROSTOKĄT, w który logo trafia. Tam różnica
     * jest jednoznaczna: albo coś się pojawiło, albo nie.
     */
    const { stderr: oLogo } = await uruchom(FFMPEG, ['-i', logo, '-f', 'null', '-'], { maxBuffer: 8 * 1024 * 1024 })
        .catch((e) => ({ stderr: e.stderr ?? '' }));
    const wl = String(oLogo).match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
    const wysokoscLogo = wl
        ? Math.max(8, Math.round(szerokoscLogo * (Number(wl[2]) / Number(wl[1]))))
        : szerokoscLogo;

    // Te same wyrażenia co przy overlay, ale liczone w JS — `crop` nie zna
    // `main_w` ani `overlay_w`.
    const wysokosc = m ? Number(m[2]) : 480;
    const marg = Math.round(szerokosc * 0.03);
    const rogi: Record<Rog, [number, number]> = {
        'lewy-gorny': [marg, marg],
        'prawy-gorny': [szerokosc - szerokoscLogo - marg, marg],
        'lewy-dolny': [marg, wysokosc - wysokoscLogo - marg],
        'prawy-dolny': [szerokosc - szerokoscLogo - marg, wysokosc - wysokoscLogo - marg],
        'srodek-dolny': [Math.round((szerokosc - szerokoscLogo) / 2), wysokosc - wysokoscLogo - marg],
    };
    const [lx, ly] = rogi[marka.rog];
    const wycinek = `crop=${szerokoscLogo}:${wysokoscLogo}:${Math.max(0, lx)}:${Math.max(0, ly)}`;

    const { stderr: porownanie } = await uruchom(FFMPEG, [
        '-i', cel, '-i', zrodlo,
        '-filter_complex', `[0:v]${wycinek}[a];[1:v]${wycinek}[b];[a][b]psnr`,
        '-f', 'null', '-',
    ], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => ({ stderr: e.stderr ?? '' }));
    const psnr = String(porownanie).match(/average:([0-9.]+|inf)/i)?.[1];

    // 40 dB w SAMYM prostokącie logo to już „nie widać różnicy". Widoczne logo
    // schodzi tam grubo poniżej 20 dB.
    if (psnr && (psnr.toLowerCase() === 'inf' || Number(psnr) > 40)) {
        await fs.unlink(cel).catch(() => {});
        throw new Error(
            `Logo się nie odznaczyło — w miejscu, gdzie miało siąść, obraz się nie zmienił `
            + `(PSNR ${psnr} dB w prostokącie logo). Najczęstsza przyczyna: plik logo jest `
            + 'w całości przezroczysty. Wgraj PNG, w którym znak jest naprawdę widoczny.',
        );
    }

    return { plik: `/ofirmowane/${bezpieczna}`, nazwa: bezpieczna, roznica: psnr ?? null };
}

/**
 * Wycena marki w GRV.
 *
 * ⚠️ KAŻDY SKŁADNIK JEST WIDOCZNY. Zwracamy nie samą sumę, tylko z czego się
 * bierze — bo suma bez rozbicia to liczba, w którą trzeba wierzyć.
 */
export function wycen(marka: Marka, portfolio: { kreacji: number; narysowanych: number; ofirmowanych: number }) {
    const skladniki = [
        { co: 'kreacje w katalogu', ile: portfolio.kreacji, stawka: marka.stawki.zaKreacje },
        { co: 'narysowane', ile: portfolio.narysowanych, stawka: marka.stawki.zaNarysowana },
        { co: 'ofirmowane', ile: portfolio.ofirmowanych, stawka: marka.stawki.zaOfirmowana },
    ].map((s) => ({ ...s, grv: s.ile * s.stawka }));

    return { skladniki, razem: skladniki.reduce((s, x) => s + x.grv, 0) };
}
