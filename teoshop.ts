/**
 * 🛍🖨 TeO ShoP — katalog kolekcji, pliki produkcyjne i arkusz importu do Shopify.
 *
 * Cztery linie, każda z własnymi postaciami z Pracowni Katedry (Mini-TeOgochi):
 *   A — 0.00G NEW ENERGY ORIGINALS      (Mini-Fiołek · Pęcherzik)
 *   B — ELARA & KAEL · 0.00G SESSIONS   (Czułkowiec = Kael · Płochuszkowy = Elara · Lampion = symbol nocny)
 *   C — BOX 02 · SOLAR PULSE            (Żołędzik · Dmuchawiec)
 *   D — BOX 03 · THE STORY OF HIDENGIRL (Puderciel · Gwiezdnik · HidenGirl — postać ukryta)
 *
 * Dwa światy plików, o PRZECIWNYCH wymaganiach — pomylenie ich kosztuje całą partię druku:
 *   • DTG / winyl / plakat → tło PRZEZROCZYSTE (tusz kładzie się na tkaninie),
 *   • All-Over Print       → tło PEŁNE, ciemne, bez jednego przezroczystego piksela
 *     (Printful szyje AOP z BIAŁEJ belki — każda dziura w kryciu wychodzi z pralni jako biała plama).
 *
 * Grafikę rysuje PRZEGLĄDARKA (płótno 2D) i odsyła tu gotowy PNG — tak samo jak Canvas Spotify
 * i banery w Jukeboxie. Szwalnia nie potrzebuje biblioteki graficznej na serwerze, a to, co widać
 * w podglądzie, jest dokładnie tym, co ląduje na dysku.
 *
 * Rozmiary paneli AOP sprawdzone na żywym API Printful 2026-11-19 (token w Skarbcu 0.00G):
 * #257 All-Over Tee 4200×5400 + rękawy 3000×1800, #84 All-Over Tote 2550×2475.
 */
import fs from 'fs/promises';
import path from 'path';

const KORZEN = process.env.TEO_FASHION_STUDIO ? path.resolve(process.env.TEO_FASHION_STUDIO) : process.cwd();
export const KATALOG = path.join(KORZEN, 'public', 'nadruki', 'teo-shop');
export const PLIK_CSV = path.join(KATALOG, 'teo_shop_import.csv');
/**
 * Podglądy sklepowe idą tam, skąd serwuje je portal (`TEO_SKLEP_IMG` = katalog `public/sklep-img`
 * repozytorium TeOStory.studio), a adres w CSV musi wskazywać ten sam plik w sieci.
 */
export const KATALOG_PODGLADOW = process.env.TEO_SKLEP_IMG ? path.resolve(process.env.TEO_SKLEP_IMG) : path.join(KATALOG, '_podglady');
export const ADRES_PODGLADU = (process.env.TEO_SKLEP_IMG_URL || 'https://teostory.studio/sklep-img').replace(/\/+$/, '');
/**
 * ⚠️ Podgląd sklepowy jest JPEG-iem, nie PNG — i to nie jest drobiazg.
 * Panel All-Over Print to ciemna mgławica: gładka poświata plus setki gwiazd. W PNG jedna taka
 * karta 1200×1440 waży 1,6 MB (2026-11-19, zmierzone), czyli 48 MB na całą kolekcję w repozytorium
 * portalu. Ten sam obraz w JPEG waży ułamek tego i wygląda tak samo na karcie sklepu.
 * PNG zostaje tam, gdzie jest potrzebny naprawdę: w plikach produkcyjnych.
 */
export const ROZSZERZENIE_PODGLADU = 'jpg';
export const urlPodgladu = (handle: string) => `${ADRES_PODGLADU}/${handle}.${ROZSZERZENIE_PODGLADU}`;
export const VENDOR = 'TeO 0.00G Studio';

/** Formaty druku. Metodę nadruku niesie każdy produkt do opisu — kupujący ma wiedzieć, co dostaje. */
export const FORMATY = {
    dtg: { w: 4500, h: 5400, nazwa: 'DTG 4500×5400 px', metoda: 'DTG — Direct to Garment na ciężkiej bawełnie organicznej', tlo: 'przezroczyste' },
    naklejka: { w: 3000, h: 3000, nazwa: 'Die-Cut 3000×3000 px', metoda: 'Wodoodporny winyl z laminatem UV', tlo: 'przezroczyste' },
    plakat: { w: 5400, h: 7200, nazwa: 'Plakat 5400×7200 px (18×24″ @300 DPI)', metoda: 'Druk giclée na papierze matowym 250 g', tlo: 'przezroczyste' },
    aop: { w: 4200, h: 5400, nazwa: 'All-Over Print — komplet paneli w rozmiarach szablonu Printful', metoda: 'AOP — sublimacja na całej powierzchni: przód, tył i oba rękawy', tlo: 'pełne ciemne, bez przezroczystości' },
} as const;
export type IdFormatu = keyof typeof FORMATY;
export type Uklad = 'stempel' | 'fala' | 'box';
export type Linia = 'A' | 'B' | 'C' | 'D';

// ── 🎨 kolorystyki AOP (bliźniak `BARWY` w src/utils/bestsellery.ts — zmieniasz jedną, popraw drugą) ──
export const KOLORYSTYKI = [
    { id: 'obsidian-black', nazwa: 'Obsidian Black' },
    { id: 'cosmic-indigo', nazwa: 'Cosmic Indigo' },
    { id: 'solar-gold', nazwa: 'Solar Gold' },
    { id: 'alchemical-emerald', nazwa: 'Alchemical Emerald' },
] as const;
export const idKolorystyki = (nazwa: string) => KOLORYSTYKI.find((k) => k.nazwa === nazwa)?.id ?? KOLORYSTYKI[0].id;

// ── 🐾 postacie linii (id obrazów Pracowni Katedry: GET /api/nadruki/motyw/<id>) ──
/**
 * 🩹 Wycinanka postaci z białego tła — pola potrzebne tylko tam, gdzie domyślne nastawy zawodzą.
 *
 * BIAŁY stworek na BIAŁYM tle to przypadek graniczny i Puderciel-Śnieg przeszedł przez wszystkie trzy pułapki
 * (zmierzone 2026-11-19 wiernym portem `wytnijTlo` poza przeglądarką):
 *   • `tolerancja` 46 → wypełnienie wchodzi przez rozświetlony bok i wygryza mu pół tułowia; 14 → ciało całe;
 *   • `cien: false` → etap usuwania cienia z podłogi idzie przez SZARE piksele, a jego futro też jest szare —
 *     przy pełnym zasięgu zjadał nogi, przy ograniczonym ucinał uda płaską kreską;
 *   • `wymaz` → zostający cień ma barwę 240,241,244 wobec futra 239–248. Nie da się ich rozdzielić niczym,
 *     więc mówimy wprost, w którym prostokącie leży (ułamki 0–1 obrazu źródłowego).
 */
export interface Postac {
    id: string; nazwa: string; rola: string;
    tolerancja?: number; cien?: boolean;
    wymaz?: { x0: number; y0: number; x1: number; y1: number };
}
const P_FIOLEK: Postac = { id: 'mini-teogochi-mini-fiolek-cialo-z-szrono-538c', nazwa: 'Mini-Fiołek', rola: 'Koci Kwiat — płatki szronu w fiolecie i błękicie' };
const P_PECHERZIK: Postac = { id: 'mini-teogochi-pecherzik-wariant-purpurow-a1bd', nazwa: 'Pęcherzik', rola: 'Purpurowy Puch — puchaty przytulak' };
const P_KAEL: Postac = { id: 'mini-teogochi-czulkowiec-kozaczek-z-czul-e533', nazwa: 'Czułkowiec (Kael)', rola: 'Królewicz w złotej koronie, rubin na piersi' };
const P_ELARA: Postac = { id: 'mini-teogochi-plochuszkowy-ma-przezroczy-423e', nazwa: 'Płochuszkowy (Elara)', rola: 'Dziewczynka z lampionem na czubku głowy' };
const P_LAMPION: Postac = { id: 'mini-teogochi-lampion-spiewak-zgaszla-sz-bdf4', nazwa: 'Lampion-Śpiewak', rola: 'Lampa naftowa — symbol nocny' };
const P_ZOLEDZIK: Postac = { id: 'mini-teogochi-zoledzik-ma-male-barylkowa-cacf', nazwa: 'Żołędzik', rola: 'Żołądź ze słońcem w środku' };
const P_DMUCHAWIEC: Postac = { id: 'mini-teogochi-wiotki-stworek-ze-sprezyst-32ed', nazwa: 'Wiotki Dmuchawiec', rola: 'Złoty dmuchawiec na sprężystej łodydze' };
const P_PUDERCIEL: Postac = {
    id: 'mini-teogochi-puderciel-snieg-puchaty-ma-8e07', nazwa: 'Puderciel-Śnieg', rola: 'Biała chmurka z gwiazdką',
    tolerancja: 14, cien: false, wymaz: { x0: 0, y0: 0.84, x1: 0.30, y1: 1 },   // nogi zaczynają się dopiero od x ≈ 0,31
};
const P_GWIEZDNIK: Postac = { id: 'mini-teogochi-gwiezdnik-promieniscie-swi-afae', nazwa: 'Gwiezdnik', rola: 'Szmaragdowo-fioletowy kryształ ze złotymi konstelacjami' };
/**
 * 🎸 Postać UKRYTA Boxu 03 — jedyna narysowana pod tę kolekcję (FLUX, 2026-11-19), reszta już była w Pracowni.
 * Wersja z gitarą idzie na druk; bliźniaczka w A-pozie (`…dziewczynka-bard-4ea2`) została jako karta pod rzeźbę 3D.
 */
const P_HIDENGIRL: Postac = { id: 'mini-teogochi-hidengirl-z-gitara-dziewcz-5a1a', nazwa: 'HidenGirl', rola: 'Postać ukryta Boxu 03 — gitara w chmurkach, karminowy tiul, kryształowe kowbojki' };

export const LINIE: Record<Linia, { nazwa: string; postacie: Postac[]; kolorystyka: string }> = {
    A: { nazwa: '0.00G NEW ENERGY ORIGINALS', postacie: [P_FIOLEK, P_PECHERZIK], kolorystyka: 'Cosmic Indigo' },
    B: { nazwa: 'ELARA & KAEL · 0.00G SESSIONS', postacie: [P_KAEL, P_ELARA, P_LAMPION], kolorystyka: 'Obsidian Black' },
    C: { nazwa: 'BOX 02 · SOLAR PULSE', postacie: [P_ZOLEDZIK, P_DMUCHAWIEC], kolorystyka: 'Solar Gold' },
    D: { nazwa: 'BOX 03 · THE STORY OF HIDENGIRL', postacie: [P_PUDERCIEL, P_GWIEZDNIK, P_HIDENGIRL], kolorystyka: 'Alchemical Emerald' },
};

// ── 🌌 panele All-Over Print ──
export type RysunekAop = 'aop-glowny' | 'aop-tyl' | 'aop-pas';
export interface PanelAop { placement: string; nazwa: string; w: number; h: number; rysunek: RysunekAop }
export interface Aop { katalogId: number; nazwaPrintful: string; panele: PanelAop[] }
/** Nazwa pliku panelu — ten sam kształt co w bestsellerach Printful: `<placement>-<w>x<h>.png`. */
export const nazwaPanelu = (p: PanelAop) => `${p.placement}-${p.w}x${p.h}.png`;

const AOP_TEE: Aop = {
    katalogId: 257, nazwaPrintful: "All-Over Print Men's Crew Neck T-Shirt",
    panele: [
        { placement: 'default', nazwa: 'przód', w: 4200, h: 5400, rysunek: 'aop-glowny' },
        { placement: 'back', nazwa: 'tył', w: 4200, h: 5400, rysunek: 'aop-tyl' },
        { placement: 'sleeve_left', nazwa: 'rękaw lewy', w: 3000, h: 1800, rysunek: 'aop-pas' },
        { placement: 'sleeve_right', nazwa: 'rękaw prawy', w: 3000, h: 1800, rysunek: 'aop-pas' },
    ],
};
const AOP_TOTE: Aop = {
    katalogId: 84, nazwaPrintful: 'All-Over Print Tote Bag',
    panele: [{ placement: 'default', nazwa: 'obie strony torby', w: 2550, h: 2475, rysunek: 'aop-glowny' }],
};

export interface Produkt {
    handle: string; tytul: string; linia: Linia; typ: string; format: IdFormatu; uklad: Uklad;
    napis: string; podpis: string; nota: string; tagi: string[]; cenaEur: number;
    opcja: { nazwa: string; wartosci: string[] };
    /** Postacie na nadruku — jedna albo duet (rysowane obok siebie). Pusta lista = sama typografia. */
    postacie: Postac[];
    /** Komplet paneli All-Over Print; obecny tylko przy `format: 'aop'`. */
    aop?: Aop;
    /** Kolorystyki AOP (Option 2 w Shopify). */
    kolorystyki?: string[];
}

const ROZMIARY_ODZIEZ = ['S', 'M', 'L', 'XL', 'XXL'];
const ROZMIARY_AOP = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
const ROZMIARY_NAKLEJKA = ['7 cm', '10 cm', '15 cm'];
const ROZMIARY_PLAKAT = ['A3', 'A2'];
const WSZYSTKIE_KOLORYSTYKI = KOLORYSTYKI.map((k) => k.nazwa);

/**
 * 🕊 Nota Linii A — trafia do opisu KAŻDEGO z dziesięciu produktów.
 * Mówi wprost, że kolekcja jest NIEZALEŻNA (bez powiązania korporacyjnego), deklaruje darowiznę
 * i odsyła po darmową wiedzę do źródła. Kod rabatowy: SOVEREIGN20.
 */
export const NOTA_LINII_A = 'Niezależna kolekcja autorska TeO 0.00G Studio inspirowana uniwersalnymi hasłami nowej świadomości. '
    + '10% zysku z każdego zakupu przekazujemy jako darowiznę wdzięczności na rzecz Crimson Circle '
    + '(store.crimsoncircle.com/donations), wspierając ich darmową bibliotekę wiedzy. Jeśli pytasz, od czego zacząć '
    + 'własną podróż ku lekkości i świadomości — zajrzyj właśnie do ich darmowych materiałów. '
    + 'Kod rabatowy dla przyjaciół: SOVEREIGN20 (-20%).';
export const KOD_LINII_A = 'SOVEREIGN20';
export const NAZWA_LINII_A = LINIE.A.nazwa;
const TAGI_LINII_A = ['New-Energy', 'Sovereign-Classics', 'TeO-000G'];

const uchwyt = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const koszulkaA = (napis: string, nota: string, postac: Postac): Produkt => ({
    handle: `new-energy-${uchwyt(napis)}`, tytul: `${napis} — 0.00G New Energy Originals`, linia: 'A', typ: 'T-shirt', format: 'dtg', uklad: 'stempel',
    napis, podpis: NAZWA_LINII_A, nota, tagi: [...TAGI_LINII_A, 'T-shirt', 'DTG', postac.nazwa],
    cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ }, postacie: [postac],
});
const naklejkaA = (napis: string, nota: string, postac: Postac): Produkt => ({
    handle: `new-energy-sticker-${uchwyt(napis)}`, tytul: `${napis} — 0.00G New Energy Sticker`, linia: 'A', typ: 'Naklejka', format: 'naklejka', uklad: 'stempel',
    napis, podpis: NAZWA_LINII_A, nota, tagi: [...TAGI_LINII_A, 'Naklejka', 'Die-Cut', postac.nazwa],
    cenaEur: 4.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_NAKLEJKA }, postacie: [postac],
});
const koszulkaB = (napis: string, podpis: string, postacie: Postac[]): Produkt => ({
    handle: `sessions-${uchwyt(napis)}`, tytul: `${napis} — 0.00G Sessions`, linia: 'B', typ: 'T-shirt', format: 'dtg', uklad: 'fala',
    napis, podpis, nota: `Typografia i fala dźwiękowa z utworu Elary i Kaela. Na nadruku: ${postacie.map((p) => p.nazwa).join(' i ')}.`,
    tagi: ['Elara & Kael', '0.00G Sessions', 'T-shirt', 'DTG', '0.00G', ...postacie.map((p) => p.nazwa)],
    cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ }, postacie,
});

/** All-Over Print linii: jeden komplet paneli na kolorystykę, postacie linii na przodzie i tyle. */
const aopKoszulka = (linia: Linia, cenaEur = 69.9): Produkt => {
    const L = LINIE[linia];
    return {
        handle: `aop-tee-${uchwyt(L.nazwa)}`, tytul: `${L.nazwa} — All-Over Print Tee`, linia, typ: 'T-shirt', format: 'aop', uklad: 'box',
        napis: L.nazwa, podpis: 'FULL-DRUK 0.00G · PRZÓD · TYŁ · RĘKAWY',
        nota: `Pełny nadruk na całej koszulce — przód, tył i oba rękawy. Postacie linii: ${L.postacie.map((p) => p.nazwa).join(', ')}. Cztery kolorystyki Katedry do wyboru.`,
        tagi: ['All-Over Print', 'AOP', 'Full-Druk', 'T-shirt', '0.00G', L.nazwa, ...L.postacie.map((p) => p.nazwa)],
        cenaEur, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_AOP }, postacie: L.postacie, aop: AOP_TEE, kolorystyki: WSZYSTKIE_KOLORYSTYKI,
    };
};
const aopTorba = (linia: Linia, cenaEur = 44.9): Produkt => {
    const L = LINIE[linia];
    return {
        handle: `aop-tote-${uchwyt(L.nazwa)}`, tytul: `${L.nazwa} — All-Over Print Tote`, linia, typ: 'Torba', format: 'aop', uklad: 'box',
        napis: L.nazwa, podpis: 'FULL-DRUK 0.00G · OBIE STRONY',
        nota: `Torba z nadrukiem na obu stronach. Postacie linii: ${L.postacie.map((p) => p.nazwa).join(', ')}.`,
        tagi: ['All-Over Print', 'AOP', 'Full-Druk', 'Torba', '0.00G', L.nazwa, ...L.postacie.map((p) => p.nazwa)],
        cenaEur, opcja: { nazwa: 'Rozmiar', wartosci: ['15″×15″'] }, postacie: L.postacie, aop: AOP_TOTE, kolorystyki: WSZYSTKIE_KOLORYSTYKI,
    };
};

export const PRODUKTY: Produkt[] = [
    // ── Linia A — 0.00G NEW ENERGY ORIGINALS ──
    koszulkaA('I Am', 'Dwa słowa, od których zaczyna się wszystko.', P_PECHERZIK),
    koszulkaA('Be Wise, Minimize', 'Mądrość to odejmowanie, nie dodawanie.', P_PECHERZIK),
    koszulkaA('Energy Serves the Master', 'Energia służy — nie panuje.', P_PECHERZIK),
    koszulkaA('Spirit Is Present', 'Tu i teraz, bez szukania.', P_FIOLEK),
    koszulkaA('Drive More, Think Less', 'Mniej rozważań, więcej ruchu.', P_PECHERZIK),
    koszulkaA('Live Your Bucket List', 'Lista życzeń jest do przeżycia, nie do trzymania.', P_PECHERZIK),
    naklejkaA('Sinners Are Suckers', 'Dla tych, którzy odłożyli winę.', P_PECHERZIK),
    naklejkaA('The Universe Conspires to Fill Your Desires', 'Wszechświat sprzyja — wystarczy pozwolić.', P_FIOLEK),
    naklejkaA('You Choose the Experience', 'Doświadczenie jest wyborem.', P_PECHERZIK),
    naklejkaA('Infinite Consciousness', 'Świadomość bez granic.', P_FIOLEK),
    aopKoszulka('A'), aopTorba('A'),
    // ── Linia B — ELARA & KAEL · 0.00G SESSIONS ──
    koszulkaB('Velvet Booth for Two', 'Zero Gravity Heart · 82 BPM Intro', [P_KAEL, P_ELARA]),
    koszulkaB('Zero Gravity Heart', '0.00G Sessions', [P_KAEL, P_ELARA]),
    koszulkaB('Closer Than Gravity', 'Elara Solo', [P_ELARA]),
    koszulkaB('Amber Light on Your Skin', 'Kael Solo', [P_KAEL]),
    koszulkaB('Two Shadows, One Flame', 'Elara Solo', [P_ELARA]),
    koszulkaB('What Has Not Died', 'The Story Of HidenGirl', [P_HIDENGIRL]),
    koszulkaB('Sanctuary', 'The Story Of HidenGirl', [P_HIDENGIRL]),
    // 🪔 symbol nocny linii B — naklejka kolekcjonerska (Suweren: „samą Lampę Naftową zostaw jako wariant nocny”)
    { handle: 'sessions-sticker-the-night-lamp', tytul: 'The Night Lamp — 0.00G Sessions Collector Sticker', linia: 'B', typ: 'Naklejka', format: 'naklejka', uklad: 'fala',
        napis: 'The Night Lamp', podpis: 'ELARA & KAEL · WARIANT NOCNY',
        nota: 'Naklejka kolekcjonerska: Lampion-Śpiewak, lampa naftowa 0.00G Sessions. Symbol nocny linii — żarzy się, gdy wszystko inne gaśnie.',
        tagi: ['Elara & Kael', '0.00G Sessions', 'Naklejka', 'Die-Cut', 'Kolekcjonerska', 'Lampion-Śpiewak'],
        cenaEur: 5.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_NAKLEJKA }, postacie: [P_LAMPION] },
    aopKoszulka('B'), aopTorba('B'),
    // ── Linia C — BOX 02 · SOLAR PULSE ──
    { handle: 'box-02-solar-pulse-hoodie', tytul: 'Solar Pulse — Box 02 Hoodie (edycja limitowana)', linia: 'C', typ: 'Bluza', format: 'dtg', uklad: 'box',
        napis: 'SOLAR PULSE', podpis: 'BOX 02 · 10 STACJI', nota: 'Edycja limitowana do Boxu 02 z TeOfon Studio & Jukebox 0.00G. Na nadruku Żołędzik — żołądź ze słońcem w środku.',
        tagi: ['Box Editions', 'Solar Pulse', 'Bluza', 'DTG', 'Edycja limitowana', '0.00G', 'Żołędzik'], cenaEur: 59.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ }, postacie: [P_ZOLEDZIK] },
    { handle: 'box-02-solar-pulse-plakat', tytul: 'Solar Pulse — Box 02 Plakat', linia: 'C', typ: 'Plakat', format: 'plakat', uklad: 'box',
        napis: 'SOLAR PULSE', podpis: 'BOX 02 · TEOFON STUDIO 0.00G', nota: 'Plakat edycji Boxu 02 ze Złotym Dmuchawcem.',
        tagi: ['Box Editions', 'Solar Pulse', 'Plakat', '0.00G', 'Dmuchawiec'], cenaEur: 24.9, opcja: { nazwa: 'Format', wartosci: ROZMIARY_PLAKAT }, postacie: [P_DMUCHAWIEC] },
    aopKoszulka('C'), aopTorba('C'),
    // ── Linia D — BOX 03 · THE STORY OF HIDENGIRL ──
    { handle: 'box-03-hidengirl-tee', tytul: 'The Story Of HidenGirl — Box 03 T-shirt (edycja limitowana)', linia: 'D', typ: 'T-shirt', format: 'dtg', uklad: 'box',
        napis: 'HIDENGIRL', podpis: 'BOX 03 · ELARA S.M.T. · KAEL SMT · ORION SMT', nota: 'Edycja limitowana do Boxu 03 z TeOfon Studio & Jukebox 0.00G. Na nadruku HidenGirl — postać ukryta, narysowana dla tej kolekcji.',
        tagi: ['Box Editions', 'HidenGirl', 'T-shirt', 'DTG', 'Edycja limitowana', '0.00G'], cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ }, postacie: [P_HIDENGIRL] },
    { handle: 'box-03-hidengirl-plakat', tytul: 'The Story Of HidenGirl — Box 03 Plakat', linia: 'D', typ: 'Plakat', format: 'plakat', uklad: 'box',
        napis: 'HIDENGIRL', podpis: 'BOX 03 · 14 ROZDZIAŁÓW', nota: 'Plakat edycji Boxu 03: Puderciel-Śnieg i Gwiezdnik — biała chmurka i kryształ z konstelacjami.',
        tagi: ['Box Editions', 'HidenGirl', 'Plakat', '0.00G', 'Puderciel-Śnieg', 'Gwiezdnik'], cenaEur: 24.9, opcja: { nazwa: 'Format', wartosci: ROZMIARY_PLAKAT }, postacie: [P_PUDERCIEL, P_GWIEZDNIK] },
    aopKoszulka('D'), aopTorba('D'),
];

const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Opis produktu (HTML) — zawsze mówi, jaką metodą jest drukowany i w jakim pliku powstał. */
export function opisHtml(p: Produkt): string {
    const f = FORMATY[p.format];
    const czesci = [
        `<p><strong>${esc(p.napis)}</strong>${p.podpis ? ` — ${esc(p.podpis)}` : ''}</p>`,
        `<p>${esc(p.nota)}</p>`,
        ...(p.postacie.length ? [`<p><strong>Postacie:</strong> ${p.postacie.map((x) => `${esc(x.nazwa)} — ${esc(x.rola)}`).join('; ')}.</p>`] : []),
        `<p><strong>Metoda nadruku:</strong> ${esc(f.metoda)}.</p>`,
        ...(p.aop ? [`<p><strong>Panele:</strong> ${p.aop.panele.map((x) => `${esc(x.nazwa)} ${x.w}×${x.h} px`).join(', ')} — szablon Printful #${p.aop.katalogId} ${esc(p.aop.nazwaPrintful)}.</p>`] : []),
        `<p><strong>Plik produkcyjny:</strong> ${esc(f.nazwa)}, tło ${esc(f.tlo)}.</p>`,
        ...(p.linia === 'A' ? [`<p><em>${esc(NOTA_LINII_A)}</em></p>`] : []),
    ];
    return czesci.join('');
}

// ── CSV w układzie importu Shopify ──
export const KOLUMNY = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
    'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Image Src', 'Image Position', 'Image Alt Text', 'Status'];

const pole = (v: string | number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const gramy = (p: Produkt) => (p.format === 'naklejka' ? 10 : p.typ === 'Torba' ? 180 : p.typ === 'Bluza' ? 600 : p.format === 'plakat' ? 120 : 190);

/** Warianty produktu: rozmiar, a przy AOP rozmiar × kolorystyka (Option 2). */
export function warianty(p: Produkt): { o1: string; o2: string | null }[] {
    const kol = p.kolorystyki ?? null;
    return p.opcja.wartosci.flatMap((o1) => (kol ? kol.map((o2) => ({ o1, o2 })) : [{ o1, o2: null }]));
}
/** Kolorystyka z nazwy ALBO z id — przeglądarka przysyła id, katalog trzyma nazwy. */
export const kolorystyka = (x: string) => KOLORYSTYKI.find((k) => k.id === x || k.nazwa === x) ?? null;
/** Podgląd sklepowy wariantu: pierwsza kolorystyka = karta produktu, reszta = dodatkowe zdjęcia. */
export function handlePodgladu(p: Produkt, kol?: string | null) {
    const k = kol ? kolorystyka(kol) : null;
    return !k || k.nazwa === p.kolorystyki?.[0] ? p.handle : `${p.handle}-${k.id}`;
}

/**
 * Wiersze CSV: pierwszy wariant niesie całą kartę produktu, kolejne tylko `Handle` i swoje opcje —
 * tak Shopify rozpoznaje warianty jednego produktu, a nie osobne produkty. Na końcu produktu AOP
 * dochodzą wiersze z samym zdjęciem (pozycje 2…n) — po jednym na pozostałe kolorystyki.
 */
export function wiersze(produkty: Produkt[] = PRODUKTY): string[][] {
    const out: string[][] = [KOLUMNY];
    const iObraz = KOLUMNY.indexOf('Image Src'), iPoz = KOLUMNY.indexOf('Image Position'), iAlt = KOLUMNY.indexOf('Image Alt Text');
    for (const p of produkty) {
        warianty(p).forEach(({ o1, o2 }, i) => {
            const pierwszy = i === 0;
            out.push([
                p.handle, pierwszy ? p.tytul : '', pierwszy ? opisHtml(p) : '', pierwszy ? VENDOR : '', pierwszy ? p.typ : '',
                pierwszy ? p.tagi.join(', ') : '', pierwszy ? 'TRUE' : '',
                p.opcja.nazwa, o1, o2 ? 'Kolorystyka' : '', o2 ?? '',
                // ⚠️ `Variant Inventory Tracker` PUSTY, nie „shopify” (2026-11-19, ostrzeżenie z panelu Printful:
                // „Printful can only fulfill orders when their inventory is managed by us” — wariant, którego zapas
                // liczy Shopify, nie zostanie zrealizowany automatycznie przez drukarnię).
                `${p.handle}-${uchwyt(o1)}${o2 ? `-${idKolorystyki(o2)}` : ''}`.toUpperCase(), String(gramy(p)), '', '', 'continue', 'manual',
                p.cenaEur.toFixed(2), 'TRUE', 'TRUE',
                pierwszy ? urlPodgladu(p.handle) : '', pierwszy ? '1' : '', pierwszy ? `${p.tytul} — ${FORMATY[p.format].metoda}` : '',
                pierwszy ? 'active' : '',
            ]);
        });
        // dodatkowe zdjęcia: pozostałe kolorystyki (wiersz bez wariantu — sam Handle i obraz)
        (p.kolorystyki ?? []).slice(1).forEach((k, i) => {
            const w = KOLUMNY.map(() => '');
            w[0] = p.handle; w[iObraz] = urlPodgladu(handlePodgladu(p, k)); w[iPoz] = String(i + 2); w[iAlt] = `${p.tytul} — ${k}`;
            out.push(w);
        });
    }
    return out;
}
export const csv = (produkty: Produkt[] = PRODUKTY) => wiersze(produkty).map((w) => w.map(pole).join(',')).join('\r\n');

// ── zapis na dysk ──
// Handle bywa długi („new-energy-sticker-the-universe-conspires-to-fill-your-desires”) — Shopify
// dopuszcza do 255 znaków. Pilnujemy kształtu (same małe litery, cyfry i myślniki), nie długości.
const bezpiecznyHandle = (h: string) => { const s = String(h); if (!/^[a-z0-9][a-z0-9-]{1,120}$/.test(s)) throw new Error(`Zły handle: „${s}”.`); return s; };
export const katalogProduktu = (handle: string) => path.join(KATALOG, bezpiecznyHandle(handle));
const czyPng = (png: Buffer, min: number) => Buffer.isBuffer(png) && png.length >= min && png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
const produkt = (handle: string) => {
    const p = PRODUKTY.find((x) => x.handle === handle);
    if (!p) throw new Error(`Nie znam produktu „${handle}”.`);
    return p;
};

/** Metryczka obok plików — drukarnia i Suweren czytają ją bez otwierania kodu. */
async function metryczka(p: Produkt, kat: string) {
    await fs.writeFile(path.join(kat, 'METODA-NADRUKU.txt'), [
        p.tytul, '', `Metoda nadruku: ${FORMATY[p.format].metoda}`, `Plik: ${FORMATY[p.format].nazwa}, tło ${FORMATY[p.format].tlo}`,
        `Linia ${p.linia}: ${LINIE[p.linia].nazwa}`, `Cena: ${p.cenaEur.toFixed(2)} EUR`, `Tagi: ${p.tagi.join(', ')}`,
        ...(p.postacie.length ? ['', 'Postacie:', ...p.postacie.map((x) => `  • ${x.nazwa} — ${x.rola} (${x.id})`)] : []),
        ...(p.aop ? ['', `Printful #${p.aop.katalogId} ${p.aop.nazwaPrintful}`,
            'UWAGA: pliki AOP mają PEŁNE ciemne tło bez przezroczystości — Printful szyje z białej belki.',
            'Panele:', ...p.aop.panele.map((x) => `  • ${x.placement} (${x.nazwa}) ${x.w}×${x.h} px`),
            `Kolorystyki: ${(p.kolorystyki ?? []).join(', ')}`] : []),
        ...(p.linia === 'A' ? ['', NOTA_LINII_A] : []),
    ].join('\n'), 'utf8');
}

/** Zapisuje gotowy PNG z przeglądarki. Przyjmuje tylko handle z katalogu — nic nie trafia poza `teo-shop/`. */
export async function zapiszPlik(handle: string, png: Buffer) {
    const p = produkt(handle);
    if (!czyPng(png, 1000)) throw new Error('To nie jest plik PNG.');
    const kat = katalogProduktu(handle);
    await fs.mkdir(kat, { recursive: true });
    const plik = path.join(kat, `${handle}.png`);
    await fs.writeFile(plik, png);
    await metryczka(p, kat);
    return { handle, plik, bajtow: png.length };
}

/**
 * Zapisuje JEDEN panel All-Over Print: `teo-shop/<handle>/<kolorystyka>/<placement>-<w>x<h>.png`.
 * Panel i kolorystyka muszą być z katalogu — nazwa z przeglądarki nigdy nie składa ścieżki.
 */
export async function zapiszPanelAop(handle: string, kol: string, placement: string, png: Buffer) {
    const p = produkt(handle);
    if (!p.aop) throw new Error(`„${handle}” nie jest produktem All-Over Print.`);
    const panel = p.aop.panele.find((x) => x.placement === placement);
    if (!panel) throw new Error(`Produkt „${handle}” nie ma panelu „${placement}”.`);
    const k = kolorystyka(kol);
    if (!k || !(p.kolorystyki ?? []).includes(k.nazwa)) throw new Error(`Nie znam kolorystyki „${kol}”.`);
    if (!czyPng(png, 1000)) throw new Error('To nie jest plik PNG.');
    const kat = path.join(katalogProduktu(handle), k.id);
    await fs.mkdir(kat, { recursive: true });
    const plik = path.join(kat, nazwaPanelu(panel));
    await fs.writeFile(plik, png);
    await metryczka(p, katalogProduktu(handle));
    return { handle, kolorystyka: k.nazwa, placement, plik, bajtow: png.length };
}

/** Zapisuje podgląd sklepowy 1200×1440 (JPEG) — ten plik trafia do portalu i to jego adres jedzie do Shopify. */
export async function zapiszPodglad(handle: string, jpg: Buffer, kol: string | null = null) {
    const p = produkt(handle);
    if (!Buffer.isBuffer(jpg) || jpg.length < 500 || jpg.subarray(0, 3).toString('hex') !== 'ffd8ff') throw new Error('To nie jest plik JPEG.');
    if (kol && !kolorystyka(kol)) throw new Error(`Nie znam kolorystyki „${kol}”.`);
    const nazwa = handlePodgladu(p, kol);
    await fs.mkdir(KATALOG_PODGLADOW, { recursive: true });
    const plik = path.join(KATALOG_PODGLADOW, `${bezpiecznyHandle(nazwa)}.${ROZSZERZENIE_PODGLADU}`);
    await fs.writeFile(plik, jpg);
    return { handle, kolorystyka: kol, plik, url: urlPodgladu(nazwa), bajtow: jpg.length };
}

/** Pisze `teo_shop_import.csv` obok folderów produktów. BOM, żeby Excel nie zjadł polskich znaków. */
export async function zapiszCsv(produkty: Produkt[] = PRODUKTY) {
    await fs.mkdir(KATALOG, { recursive: true });
    await fs.writeFile(PLIK_CSV, `﻿${csv(produkty)}`, 'utf8');
    return { plik: PLIK_CSV, produktow: produkty.length, wierszy: wiersze(produkty).length - 1 };
}

const jest = (p: string) => fs.access(p).then(() => true, () => false);

/** Stan kolekcji: które produkty mają już KOMPLET plików na dysku (AOP = każdy panel w każdej kolorystyce). */
export async function stan() {
    const out = [];
    for (const p of PRODUKTY) {
        const kat = katalogProduktu(p.handle);
        const kolory: (string | null)[] = p.kolorystyki ?? [null];
        let gotowy: boolean;
        if (p.aop) {
            const sprawdzone = await Promise.all((p.kolorystyki ?? []).flatMap((k) =>
                p.aop!.panele.map((panel) => jest(path.join(kat, idKolorystyki(k), nazwaPanelu(panel))))));
            gotowy = sprawdzone.length > 0 && sprawdzone.every(Boolean);
        } else {
            gotowy = await jest(path.join(kat, `${p.handle}.png`));
        }
        const podglady = await Promise.all(kolory.map((k) => jest(path.join(KATALOG_PODGLADOW, `${handlePodgladu(p, k)}.${ROZSZERZENIE_PODGLADU}`))));
        out.push({
            ...p, gotowy, podgladGotowy: podglady.every(Boolean),
            url: urlPodgladu(p.handle), metoda: FORMATY[p.format].metoda, wymiar: FORMATY[p.format].nazwa,
            plikow: p.aop ? (p.kolorystyki ?? []).length * p.aop.panele.length : 1,
        });
    }
    return {
        katalog: KATALOG, katalogPodgladow: KATALOG_PODGLADOW, adresPodgladu: ADRES_PODGLADU, csv: PLIK_CSV,
        linie: LINIE, kolorystyki: KOLORYSTYKI, produkty: out, csvGotowy: await jest(PLIK_CSV),
    };
}
