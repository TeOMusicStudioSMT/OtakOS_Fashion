/**
 * 🖌️ WIZUALIZACJE — narysowana sztuka odzieży, nie kadr filmowy.
 *
 * PO CO. Galeria pokazywała dotąd KADRY: postać w scenie, w świetle sceny.
 * To materiał wyjściowy, nie projekt. Kreacja żyła wyłącznie jako opis —
 * `imagePrompt` po tysiąc sto znaków, którego nikt nigdy nie podał silnikowi.
 *
 * Ta warstwa spina jedno z drugim: bierze `imagePrompt`, każe Katedrze go
 * narysować (FLUX.2 klein, 4 kroki) i zapamiętuje wynik przy kreacji.
 *
 * ⚠️ NIE PRZECHOWUJEMY OBRAZU, tylko wskazanie. Plik zostaje w wyjściu
 * ComfyUI i jest serwowany przez most. Kopiowanie go tutaj dałoby drugie
 * źródło prawdy i dwa razy więcej megabajtów.
 */

import fs from 'fs/promises';
import path from 'path';

const MOST = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';
const PLIK = path.join(process.cwd(), 'OtakOs_Fashion', 'wizualizacje.json');

export interface Wizualizacja {
    /** Id kreacji albo koncepcji z katalogu — jedno i drugie ląduje tu tak samo. */
    id: string;
    /** Nazwa pliku w wyjściu ComfyUI. */
    nazwa: string;
    /** Adres W MOŚCIE — pełny URL składa front. */
    plik: string;
    /** Prompt, którym to narysowano. Bez niego nie da się powtórzyć ani poprawić. */
    prompt: string;
    silnik: string;
    sekundy: number;
    narysowane: string;
}

async function wczytaj(): Promise<Wizualizacja[]> {
    try {
        const j = JSON.parse(await fs.readFile(PLIK, 'utf8'));
        return Array.isArray(j) ? j : (j.wizualizacje ?? []);
    } catch {
        return [];
    }
}

/** Zapis atomowy: tmp → rename. */
async function zapisz(lista: Wizualizacja[]) {
    await fs.mkdir(path.dirname(PLIK), { recursive: true });
    const tmp = `${PLIK}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ wizualizacje: lista }, null, 2), 'utf8');
    await fs.rename(tmp, PLIK);
}

export const lista = wczytaj;

/**
 * Narysuj kreację i zapamiętaj wynik.
 *
 * ⚠️ CZEKAMY TU, W SERWERZE, a nie w przeglądarce. Zmierzone na FLUX.2 klein:
 * 57–407 s zależnie od wolnego VRAM-u. Odpytywanie z przeglądarki co sekundę
 * przez siedem minut to setki zapytań; jedno długie połączenie do własnego
 * serwera jest prostsze i nie gubi wyniku przy odświeżeniu karty.
 */
export async function narysuj({ id, prompt, silnik = 'flux2-klein-4b', szerokosc = 704, wysokosc = 480, ziarno }: {
    id: string; prompt: string; silnik?: string; szerokosc?: number; wysokosc?: number; ziarno?: number;
}): Promise<Wizualizacja> {
    if (!String(prompt).trim()) throw new Error('Pusty opis — nie ma czego rysować.');

    const t0 = Date.now();
    const r = await fetch(`${MOST}/api/obraz/policz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, silnik, szerokosc, wysokosc, ziarno }),
        signal: AbortSignal.timeout(120000),
    });
    const d = await r.json() as { success?: boolean; message?: string; zlecenie?: string; silnik?: string };
    if (!r.ok || d.success === false) {
        throw new Error(d.message ?? `Most odmówił (HTTP ${r.status}). Odpal Katedrę.`);
    }
    const zlecenie = d.zlecenie!;

    // ⚠️ Limit twardy: 20 minut. Dłużej i tak nie ma sensu dla jednego obrazu —
    // przy takim czasie problemem jest wolny VRAM, nie cierpliwość.
    const czekaj = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (Date.now() - t0 < 20 * 60 * 1000) {
        await czekaj(5000);
        const s = await fetch(`${MOST}/api/obraz/stan?zlecenie=${encodeURIComponent(zlecenie)}`, {
            signal: AbortSignal.timeout(30000),
        }).catch(() => null);
        if (!s) continue;
        const w = await s.json() as { success?: boolean; message?: string; gotowe?: boolean; nazwa?: string; plik?: string };
        if (w.success === false) throw new Error(w.message ?? 'ComfyUI odmówił.');
        if (!w.gotowe) continue;

        const wpis: Wizualizacja = {
            id,
            nazwa: w.nazwa!,
            plik: w.plik!,
            prompt,
            silnik: d.silnik ?? silnik,
            sekundy: Math.round((Date.now() - t0) / 1000),
            narysowane: new Date().toISOString(),
        };
        const wszystkie = await wczytaj();
        // Jedna wizualizacja na kreację — nowa zastępuje starą.
        await zapisz([wpis, ...wszystkie.filter((x) => x.id !== id)]);
        return wpis;
    }
    throw new Error('20 minut bez obrazu — silnik nie oddał wyniku. Sprawdź, co trzyma kartę graficzną.');
}
