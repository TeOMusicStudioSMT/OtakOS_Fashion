/**
 * 🔗 Powiązanie KONCEPCJI z PRAWDZIWYM OBRAZEM.
 *
 * PO CO. Rada wygenerowała 62 koncepcje mody, po jednej na kadr SOLLET.
 * Te same 62 kadry istnieją jako realne pliki PNG — policzone przez Wan 2.2
 * w dziale filmowym. Do 2026-09-10 nic ich nie łączyło: aplikacja pokazywała
 * opisy bez zdjęć, a zdjęcia leżały w katalogu, o którym nie wiedziała.
 *
 * ⚠️ WIĄZANIE JEST DOMYSŁEM I TAK JEST OPISANE. Koncepcja ma tytuł
 * „SOLLET-KF01: Solita Vantablack Tectonic Sheath", a obraz pochodzi z kadru
 * „#1.1 Otwarcie: Ciemność" — nie mają wspólnego identyfikatora. Wiążemy po
 * kolejności fabularnej (numer sceny z tytułu kadru, rosnąco), bo to najbliższe
 * temu, co Rada najpewniej widziała.
 *
 * Poprawia się to w `OtakOs_Fashion/powiazania.json` — bez tykania kodu.
 * Skrypt `scripts/zwiaz-obrazy.mjs` generuje ten plik od nowa.
 */

import surowe from '../../OtakOs_Fashion/powiazania.json';

export interface Powiazanie {
    keyframe: number;
    idKoncepcji: string | null;
    tytulKoncepcji: string | null;
    /** Ścieżka serwowana przez Vite, np. `/kadry/001__1_1_Otwarcie__Ciemno__.png`. */
    plik: string | null;
    /** Tytuł KADRU z produkcji filmowej — inny niż tytuł koncepcji. */
    tytulKadru: string | null;
    /** Opis sceny z karty produkcyjnej. To on mówi, co naprawdę widać. */
    opisKadru: string | null;
    szerokosc: number | null;
    wysokosc: number | null;
    /** `kolejnosc` = para z domysłu. Cokolwiek innego = ktoś to potwierdził ręcznie. */
    skad: string;
}

interface PlikPowiazan {
    zwiazane: string;
    metoda: string;
    uwaga: string;
    par: number;
    pozycje: Powiazanie[];
}

const dane = surowe as unknown as PlikPowiazan;

export const POWIAZANIA: Powiazanie[] = dane.pozycje ?? [];
export const METODA_WIAZANIA = dane.metoda ?? 'nieznana';

/** Szybkie wyszukanie po numerze klatki — mapa, nie `find` w pętli renderu. */
const poKlatce = new Map(POWIAZANIA.map((p) => [p.keyframe, p]));

export function obrazDlaKlatki(keyframe: number): Powiazanie | null {
    return poKlatce.get(keyframe) ?? null;
}

/**
 * Ile koncepcji ma NAPRAWDĘ obraz.
 *
 * ⚠️ Pokazywane w panelu. „62 kreacje" bez tej liczby sugerowałoby, że
 * wszystkie mają wizualizację — a mają tylko te, dla których kadr się policzył.
 */
export const ZE_ZDJECIEM = POWIAZANIA.filter((p) => !!p.plik).length;
