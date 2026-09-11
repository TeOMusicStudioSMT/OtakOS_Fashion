/**
 * 🏷️ Klient MAREK — kto firmuje kreację i ile to jest warte w GRV.
 *
 * ⚠️ Wycena NIE JEST rynkowa. To przelicznik przyjęty przez Suwerena: stawka
 * GRV za sztukę razy POLICZONE assety portfolio. Panel pokazuje rozbicie,
 * żeby było widać, skąd bierze się każdy GRV — suma bez składników to liczba,
 * w którą trzeba wierzyć.
 */

export interface Skladnik { co: string; ile: number; stawka: number; grv: number }

export interface Marka {
    id: string;
    nazwa: string;
    opis: string;
    logo: string | null;
    rog: string;
    skala: number;
    krycie: number;
    stawki: { zaKreacje: number; zaNarysowana: number; zaOfirmowana: number };
    wycena: { skladniki: Skladnik[]; razem: number };
}

export interface Portfolio { kreacji: number; narysowanych: number; ofirmowanych: number }

async function zawolaj<T>(sciezka: string, opcje?: RequestInit): Promise<T> {
    const odp = await fetch(sciezka, { headers: { 'Content-Type': 'application/json' }, ...opcje });
    const dane = await odp.json().catch(() => null);
    if (!odp.ok) throw new Error(dane?.error || `Serwer odpowiedział HTTP ${odp.status}`);
    return dane as T;
}

export const pobierzMarki = () =>
    zawolaj<{ marki: Marka[]; portfolio: Portfolio; rogi: string[] }>('/api/marki');

export const zapiszMarke = (dane: Partial<Marka> & { nazwa: string }) =>
    zawolaj<Marka>('/api/marki', { method: 'POST', body: JSON.stringify(dane) });

export const usunMarke = (id: string) =>
    zawolaj<Marka>(`/api/marki/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** Logo idzie DANYMI, nie ścieżką — typ rozpoznaje serwer po zawartości pliku. */
export const wgrajLogo = (id: string, base64: string, nazwaPliku: string) =>
    zawolaj<Marka>(`/api/marki/${encodeURIComponent(id)}/logo`, {
        method: 'POST', body: JSON.stringify({ base64, nazwaPliku }),
    });

/**
 * Nałóż logo na kreację.
 *
 * ⚠️ Serwer ODMÓWI, gdy logo się nie odznaczy — sprawdza to, porównując
 * prostokąt, w który logo trafia. Cichy sukces bez logo byłby gorszy niż błąd.
 */
export const nalozLogo = (markaId: string, zrodloUrl: string, nazwa: string) =>
    zawolaj<{ plik: string; nazwa: string; roznica?: string | null }>('/api/marki/naloz', {
        method: 'POST', body: JSON.stringify({ markaId, zrodloUrl, nazwa }),
    });

export const naBase64 = (plik: File): Promise<string> =>
    new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1] ?? '');
        r.onerror = () => rej(new Error('Nie umiem odczytać pliku.'));
        r.readAsDataURL(plik);
    });
