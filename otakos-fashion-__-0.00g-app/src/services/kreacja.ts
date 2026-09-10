/**
 * 🖌️ Klient KREACJI — rysowanie sztuki odzieży z `imagePrompt`.
 *
 * ⚠️ Rysowanie idzie przez WŁASNY serwer Fashion, który czeka na wynik
 * i zapisuje go. Odpytywanie z przeglądarki co sekundę przez siedem minut
 * to setki zapytań i utrata wyniku przy odświeżeniu karty.
 */

export interface Wizualizacja {
    id: string;
    nazwa: string;
    /** Adres w MOŚCIE Katedry — pełny URL składa `adresKadru()`. */
    plik: string;
    prompt: string;
    silnik: string;
    sekundy: number;
    narysowane: string;
}

const MOST = 'http://127.0.0.1:3001';

export const adresKadru = (plik: string) => `${MOST}${plik}`;

async function zawolaj<T>(sciezka: string, opcje?: RequestInit): Promise<T> {
    const odp = await fetch(sciezka, { headers: { 'Content-Type': 'application/json' }, ...opcje });
    const dane = await odp.json().catch(() => null);
    if (!odp.ok) throw new Error(dane?.error || `Serwer odpowiedział HTTP ${odp.status}`);
    return dane as T;
}

export const pobierzWizualizacje = () =>
    zawolaj<{ wizualizacje: Wizualizacja[] }>('/api/wizualizacje').then((d) => d.wizualizacje);

/** ⚠️ Trwa minuty — to połączenie czeka. Panel musi to przetrzymać. */
export const narysujKreacje = (dane: { id: string; prompt: string; silnik?: string; ziarno?: number }) =>
    zawolaj<Wizualizacja>('/api/narysuj', { method: 'POST', body: JSON.stringify(dane) });
