/**
 * 🥚 Klient JAJA MODY — kadry z produkcji i kucie z nich kreacji.
 *
 * ⚠️ Wszystko idzie przez WŁASNY serwer Fashion (`/api/*`), nie wprost do mostu
 * Katedry. Powód jest praktyczny i bezpieczeństwowy: przeglądarka nie musi znać
 * adresu mostu ani mieć do niego dostępu, a obrazy kadrów przechodzą przez
 * jedną, pilnowaną drogę.
 */

export interface KadrProdukcji {
    id: string;
    tytul: string;
    opis: string;
    etap: string;
    obraz: boolean;
    nazwaPliku: string;
    /** Adres w MOŚCIE Katedry — pełny URL składa `adresKadru()`. */
    plik: string;
    kwestie: { kto: string; tekst: string }[];
}

export interface KreacjaZKadru {
    id: string;
    title: string;
    archetype: string;
    anomalyType: string;
    fashionConcept: string;
    garmentMechanics: Record<string, string>;
    imagePrompt: string;
    /** Kto policzył — „qwen3.5:9b (lokalnie)", „szablon (NIE AI)"… */
    silnik: string;
    zKadru: { projekt: string; id: string; tytul: string; plik: string };
    /** Co OKO zobaczyło na kadrze — to ono karmiło projekt. */
    coWidac: string;
    wykute: string;
}

/**
 * ⚠️ Most Katedry stoi na 3001 i ma włączony CORS — obrazy kadrów bierzemy
 * z niego wprost, bo przepuszczanie kilkuset PNG przez serwer Fashion nic
 * nie wnosi poza opóźnieniem.
 */
const MOST = 'http://127.0.0.1:3001';

export const adresKadru = (plik: string) => `${MOST}${plik}`;

async function zawolaj<T>(sciezka: string, opcje?: RequestInit): Promise<T> {
    const odp = await fetch(sciezka, { headers: { 'Content-Type': 'application/json' }, ...opcje });
    const dane = await odp.json().catch(() => null);
    if (!odp.ok) throw new Error(dane?.error || `Serwer odpowiedział HTTP ${odp.status}`);
    return dane as T;
}

export const pobierzProjekty = () =>
    zawolaj<{ projekty: string[] }>('/api/projekty').then((d) => d.projekty);

export const pobierzKadry = (projekt: string) =>
    zawolaj<{ kadry: KadrProdukcji[] }>(`/api/kadry?projekt=${encodeURIComponent(projekt)}`).then((d) => d.kadry);

export const pobierzKreacje = () =>
    zawolaj<{ kreacje: KreacjaZKadru[] }>('/api/kreacje').then((d) => d.kreacje);

/**
 * Wykuj kreację z kadru.
 *
 * ⚠️ TRWA MINUTY — Jajo najpierw patrzy (model widzenia), potem projektuje
 * (krawiec). Panel musi to przetrzymać bez migania i bez limitu czasu.
 */
export const wykujZKadru = (projekt: string, kadrId: string) =>
    zawolaj<KreacjaZKadru>('/api/wykuj', { method: 'POST', body: JSON.stringify({ projekt, kadrId }) });
