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

// ── 🔄 DALSZA OBRÓBKA — obrót produktu i warianty wzoru ──────────────

export interface Obrot {
    id: string;
    nazwa: string;
    /** Adres w MOŚCIE Katedry — pełny URL składa `adresKadru()`. */
    plik: string;
    /** Nazwa pliku, z którego wyszedł obrót — bez tego nie wiadomo, co się kręci. */
    zKreacji: string;
    prompt: string;
    silnik: string;
    klatek: number;
    sekundy: number;
    zrobione: string;
}

export interface DlugoscObrotu {
    klatek: number;
    opis: string;
}

export const pobierzObroty = () =>
    zawolaj<{ obroty: Obrot[]; dlugosci: DlugoscObrotu[] }>('/api/obroty');

/**
 * ⚠️ Trwa minuty — to połączenie czeka, tak samo jak rysowanie.
 * Zmierzone na tym sprzęcie: 49 klatek w 704×480 to ~171 s, obrót na testach 257 s.
 */
export const obrocKreacje = (dane: { id: string; nazwa: string; klatek?: number; opis?: string }) =>
    zawolaj<Obrot>('/api/obroc', { method: 'POST', body: JSON.stringify(dane) });

export interface Wariant {
    nazwa: string;
    prompt: string;
}

/**
 * ⚠️ NIC TU NIE LICZY. Serwer tylko zdejmuje z opisu wybieg, modelkę i całą
 * inscenizację, zostawiając sam strój. Zwrócone opisy idą potem zwykłą drogą
 * rysowania — dlatego podpis mówi wprost „przepisanie opisu (NIE AI)".
 */
export const pobierzWarianty = (prompt: string, ile = 3) =>
    zawolaj<{ warianty: Wariant[]; silnik: string }>('/api/warianty', {
        method: 'POST',
        body: JSON.stringify({ prompt, ile }),
    });
