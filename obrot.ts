/**
 * 🔄 OBRÓT — prezentacja produktu z narysowanej kreacji.
 *
 * Suweren: „u krawca nie widzę modułu obracania tych wykonanych… i widzę, że
 * mamy z automatu na wybieg z modelem… może jak już wygeneruje, to można go
 * przenieść do dalszej obróbki, by skupić się na samym ubraniu i innych
 * wersjach tego wzoru".
 *
 * ⚠️ SILNIK: Wan 2.2 TI2V-5B, NIE SVD. Stable Video Diffusion wymaga zgody na
 * licencję na koncie HuggingFace Suwerena — cudzych regulaminów nie akceptuję
 * w jego imieniu. Wan leży na dysku i został zmierzony na tym sprzęcie.
 *
 * ⚠️ TO JEST i2v: kreacja idzie jako klatka startowa, więc obraca się TA suknia,
 * a nie podobna. Gdyby puścić sam opis, przy każdym kliknięciu wychodziłby inny
 * strój — i nikt by nie zauważył podmiany.
 *
 * ⚠️ CZEKAMY TU, W SERWERZE. Zmierzone na tej maszynie: 49 klatek w 704×480 to
 * ~171 s, obrót na testach wyszedł 257 s. Odpytywanie z przeglądarki przez
 * kilka minut gubi wynik przy odświeżeniu karty.
 */

import fs from 'fs/promises';
import path from 'path';

const MOST = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';
const PLIK = path.join(process.cwd(), 'OtakOs_Fashion', 'obroty.json');

/** Wan liczy w długościach 4n+1. 49 klatek to zmierzone ~171 s przy 704×480. */
export const DLUGOSCI = [
    { klatek: 49, opis: '~2 s · najszybciej' },
    { klatek: 73, opis: '~3 s' },
    { klatek: 97, opis: '~4 s · pełniejszy obrót' },
];

export interface Obrot {
    /** Id kreacji, której to obrót. */
    id: string;
    /** Plik wideo w wyjściu ComfyUI. */
    nazwa: string;
    /** Adres w moście — pełny URL składa front. */
    plik: string;
    /** Z jakiej klatki startowej powstał — bez tego nie wiadomo, co się obraca. */
    zKreacji: string;
    prompt: string;
    silnik: string;
    klatek: number;
    sekundy: number;
    zrobione: string;
}

async function wczytaj(): Promise<Obrot[]> {
    try {
        const j = JSON.parse(await fs.readFile(PLIK, 'utf8'));
        return Array.isArray(j) ? j : (j.obroty ?? []);
    } catch {
        return [];
    }
}

/** Zapis atomowy: tmp → rename. */
async function zapisz(lista: Obrot[]) {
    await fs.mkdir(path.dirname(PLIK), { recursive: true });
    const tmp = `${PLIK}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ obroty: lista }, null, 2), 'utf8');
    await fs.rename(tmp, PLIK);
}

export const lista = wczytaj;

export async function obroc({ id, nazwa, pod = 'katedra', klatek = 49, opis = '' }: {
    id: string; nazwa: string; pod?: string; klatek?: number; opis?: string;
}): Promise<Obrot> {
    if (!String(id).trim()) throw new Error('Nie wiem, której kreacji to obrót.');
    if (!String(nazwa).trim()) throw new Error('Nie wskazałeś narysowanej kreacji — obrót potrzebuje klatki startowej.');

    const t0 = Date.now();
    const r = await fetch(`${MOST}/api/moda/obrot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nazwa, pod, klatek, opis }),
        signal: AbortSignal.timeout(120000),
    });
    const d = await r.json() as {
        success?: boolean; message?: string; zlecenie?: string;
        silnikOpis?: string; model?: string;
    };
    if (!r.ok || d.success === false) {
        throw new Error(d.message ?? `Most odmówił (HTTP ${r.status}). Odpal Katedrę.`);
    }
    const zlecenie = d.zlecenie!;

    // ⚠️ Limit twardy: 25 minut. Dłużej i tak nie ma sensu — przy takim czasie
    // problemem jest zajęta karta graficzna, nie cierpliwość.
    const czekaj = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (Date.now() - t0 < 25 * 60 * 1000) {
        await czekaj(6000);
        const s = await fetch(`${MOST}/api/wideo/zlecenie/${encodeURIComponent(zlecenie)}`, {
            signal: AbortSignal.timeout(30000),
        }).catch(() => null);
        if (!s) continue;
        const w = await s.json() as {
            success?: boolean; message?: string; gotowe?: boolean;
            blad?: unknown;
            materialy?: { nazwa: string; podkatalog: string }[];
        };
        if (w.success === false) throw new Error(w.message ?? 'ComfyUI odmówił.');
        if (w.blad) throw new Error(`ComfyUI zgłosił błąd przy obrocie: ${JSON.stringify(w.blad).slice(0, 200)}`);
        if (!w.gotowe) continue;

        const m = (w.materialy ?? [])[0];
        if (!m) throw new Error('Zlecenie skończone, ale silnik nie oddał pliku.');

        const wpis: Obrot = {
            id,
            nazwa: m.nazwa,
            plik: `/api/obraz/plik?nazwa=${encodeURIComponent(m.nazwa)}&pod=${encodeURIComponent(m.podkatalog || 'katedra')}`,
            zKreacji: nazwa,
            prompt: opis || '(domyślny opis obrotu — sam produkt, bez wybiegu)',
            // ⚠️ Podpis mówi, co NAPRAWDĘ liczyło. Bez tego za pół roku nikt nie
            // odróżni obrotu z Wana od czegoś dorysowanego ręcznie.
            silnik: d.silnikOpis ?? d.model ?? 'Wan 2.2 TI2V-5B (i2v, lokalnie)',
            klatek,
            sekundy: Math.round((Date.now() - t0) / 1000),
            zrobione: new Date().toISOString(),
        };
        const wszystkie = await wczytaj();
        // Jeden obrót na kreację — nowy zastępuje stary.
        await zapisz([wpis, ...wszystkie.filter((x) => x.id !== id)]);
        return wpis;
    }
    throw new Error('25 minut bez wyniku — silnik nie oddał obrotu. Sprawdź, co trzyma kartę graficzną.');
}

/**
 * Warianty wzoru — „inne wersje tego wzoru" bez wybiegu i bez modelki.
 *
 * ⚠️ NIE RUSZAMY SILNIKA. Ta funkcja tylko PRZEPISUJE opis: wycina z niego
 * wybieg, modelkę i całą inscenizację, a zostawia sam strój. Zwrócone opisy
 * idą potem tą samą drogą co zwykłe rysowanie (FLUX.2 klein), więc nic tu nie
 * udaje osobnego silnika.
 */
export function wariantyWzoru(promptKreacji: string, ile = 3): { nazwa: string; prompt: string }[] {
    const bezInscenizacji = String(promptKreacji)
        // Zdania o wybiegu, modelce i fotografii edytorialnej wypadają w całość.
        .split(/(?<=[.!?])\s+/)
        .filter((z) => !/runway|model\b|editorial|photograph|catwalk|walking|show\b/i.test(z))
        .join(' ')
        .trim();

    const rdzen = bezInscenizacji || String(promptKreacji).trim();
    const ujecie = 'Studio product shot of the garment alone on a plain seamless backdrop, '
        + 'no model, no runway, even lighting, full garment in frame, fabric and construction clearly visible.';

    const warianty = [
        { nazwa: 'sam produkt', dopisek: '' },
        { nazwa: 'inna kolorystyka', dopisek: ' Same cut and construction, a different colourway.' },
        { nazwa: 'inna tkanina', dopisek: ' Same cut and silhouette, a different fabric and surface texture.' },
        { nazwa: 'zbliżenie na detal', dopisek: ' Close-up on the seams and surface detail of the same garment.' },
    ];

    return warianty.slice(0, Math.max(1, Math.min(ile, warianty.length)))
        .map((w) => ({ nazwa: w.nazwa, prompt: `${ujecie} ${rdzen}${w.dopisek}`.trim() }));
}
