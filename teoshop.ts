/**
 * 🛍 TeO ShoP — kolekcja i eksport do Shopify.
 *
 * Trzy linie produktów, dla każdego gotowy plik pod nadruk i wiersze do `teo_shop_import.csv`
 * w układzie oficjalnego importu Shopify (produkt + po jednym wierszu na wariant rozmiaru).
 * Wszystko ląduje w katalogu studia (`TEO_FASHION_STUDIO`), obok reszty kolekcji:
 *   <studio>/public/nadruki/teo-shop/<handle>/<handle>.png
 *   <studio>/public/nadruki/teo-shop/teo_shop_import.csv
 *
 * Grafikę rysuje PRZEGLĄDARKA (płótno 2D) i odsyła tu gotowy PNG — tak samo jak Canvas Spotify
 * i banery w Jukeboxie. Dzięki temu Szwalnia nie potrzebuje żadnej biblioteki graficznej na serwerze,
 * a to, co widać w podglądzie, jest dokładnie tym, co ląduje na dysku.
 */
import fs from 'fs/promises';
import path from 'path';

const KORZEN = process.env.TEO_FASHION_STUDIO ? path.resolve(process.env.TEO_FASHION_STUDIO) : process.cwd();
export const KATALOG = path.join(KORZEN, 'public', 'nadruki', 'teo-shop');
export const PLIK_CSV = path.join(KATALOG, 'teo_shop_import.csv');
/**
 * 🏬 Podglądy sklepowe (1200×1440) — JEDYNE pliki, które wychodzą poza dysk Suwerena.
 * `TEO_SKLEP_IMG` wskazuje katalog portalu (`TeOStory.studio-on-demaind/public/sklep-img`), skąd
 * Cloud Run poda je pod `TEO_SKLEP_IMG_URL`. Pliki produkcyjne 4500×5400 zostają na F: do druku.
 */
export const KATALOG_PODGLADOW = process.env.TEO_SKLEP_IMG ? path.resolve(process.env.TEO_SKLEP_IMG) : path.join(KATALOG, '_podglady');
export const ADRES_PODGLADU = (process.env.TEO_SKLEP_IMG_URL || 'https://teostory.studio/sklep-img').replace(/\/+$/, '');
export const urlPodgladu = (handle: string) => `${ADRES_PODGLADU}/${handle}.png`;
export const VENDOR = 'TeO 0.00G Studio';

/** Formaty druku. Metodę nadruku niesie każdy produkt do opisu — kupujący ma wiedzieć, co dostaje. */
export const FORMATY = {
    dtg: { w: 4500, h: 5400, nazwa: 'DTG 4500×5400 px', metoda: 'DTG — Direct to Garment na ciężkiej bawełnie organicznej', tlo: 'przezroczyste' },
    naklejka: { w: 3000, h: 3000, nazwa: 'Die-Cut 3000×3000 px', metoda: 'Wodoodporny winyl z laminatem UV', tlo: 'przezroczyste' },
    plakat: { w: 5400, h: 7200, nazwa: 'Plakat 5400×7200 px (18×24″ @300 DPI)', metoda: 'Druk giclée na papierze matowym 250 g', tlo: 'przezroczyste' },
} as const;
export type IdFormatu = keyof typeof FORMATY;
export type Uklad = 'stempel' | 'fala' | 'box';

export interface Produkt {
    handle: string; tytul: string; linia: 'A' | 'B' | 'C'; typ: string; format: IdFormatu; uklad: Uklad;
    napis: string; podpis: string; nota: string; tagi: string[]; cenaEur: number;
    opcja: { nazwa: string; wartosci: string[] };
}

const ROZMIARY_ODZIEZ = ['S', 'M', 'L', 'XL', 'XXL'];
const ROZMIARY_NAKLEJKA = ['7 cm', '10 cm', '15 cm'];
const ROZMIARY_PLAKAT = ['A3', 'A2'];
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
export const NAZWA_LINII_A = '0.00G NEW ENERGY ORIGINALS';
const TAGI_LINII_A = ['New-Energy', 'Sovereign-Classics', 'TeO-000G'];

const uchwyt = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const koszulkaA = (napis: string, nota: string): Produkt => ({
    handle: `new-energy-${uchwyt(napis)}`, tytul: `${napis} — 0.00G New Energy Originals`, linia: 'A', typ: 'T-shirt', format: 'dtg', uklad: 'stempel',
    napis, podpis: NAZWA_LINII_A, nota, tagi: [...TAGI_LINII_A, 'T-shirt', 'DTG'],
    cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ },
});
const naklejkaA = (napis: string, nota: string): Produkt => ({
    handle: `new-energy-sticker-${uchwyt(napis)}`, tytul: `${napis} — 0.00G New Energy Sticker`, linia: 'A', typ: 'Naklejka', format: 'naklejka', uklad: 'stempel',
    napis, podpis: NAZWA_LINII_A, nota, tagi: [...TAGI_LINII_A, 'Naklejka', 'Die-Cut'],
    cenaEur: 4.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_NAKLEJKA },
});
const koszulkaB = (napis: string, podpis: string): Produkt => ({
    handle: `sessions-${uchwyt(napis)}`, tytul: `${napis} — 0.00G Sessions`, linia: 'B', typ: 'T-shirt', format: 'dtg', uklad: 'fala',
    napis, podpis, nota: 'Typografia i fala dźwiękowa z utworu Elary i Kaela.', tagi: ['Elara & Kael', '0.00G Sessions', 'T-shirt', 'DTG', '0.00G'],
    cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ },
});

export const PRODUKTY: Produkt[] = [
    // ── Linia A — SHAUMBRA ORIGINALS ──
    koszulkaA('I Am', 'Dwa słowa, od których zaczyna się wszystko.'),
    koszulkaA('Be Wise, Minimize', 'Mądrość to odejmowanie, nie dodawanie.'),
    koszulkaA('Energy Serves the Master', 'Energia służy — nie panuje.'),
    koszulkaA('Spirit Is Present', 'Tu i teraz, bez szukania.'),
    koszulkaA('Drive More, Think Less', 'Mniej rozważań, więcej ruchu.'),
    koszulkaA('Live Your Bucket List', 'Lista życzeń jest do przeżycia, nie do trzymania.'),
    naklejkaA('Sinners Are Suckers', 'Dla tych, którzy odłożyli winę.'),
    naklejkaA('The Universe Conspires to Fill Your Desires', 'Wszechświat sprzyja — wystarczy pozwolić.'),
    naklejkaA('You Choose the Experience', 'Doświadczenie jest wyborem.'),
    naklejkaA('Infinite Consciousness', 'Świadomość bez granic.'),
    // ── Linia B — ELARA & KAEL · 0.00G SESSIONS ──
    koszulkaB('Velvet Booth for Two', 'Zero Gravity Heart · 82 BPM Intro'),
    koszulkaB('Zero Gravity Heart', '0.00G Sessions'),
    koszulkaB('Closer Than Gravity', 'Elara Solo'),
    koszulkaB('Amber Light on Your Skin', 'Kael Solo'),
    koszulkaB('Two Shadows, One Flame', 'Elara Solo'),
    koszulkaB('What Has Not Died', 'The Story Of HidenGirl'),
    koszulkaB('Sanctuary', 'The Story Of HidenGirl'),
    // ── Linia C — BOX EDITIONS ──
    { handle: 'box-02-solar-pulse-hoodie', tytul: 'Solar Pulse — Box 02 Hoodie (edycja limitowana)', linia: 'C', typ: 'Bluza', format: 'dtg', uklad: 'box',
        napis: 'SOLAR PULSE', podpis: 'BOX 02 · 10 STACJI', nota: 'Edycja limitowana do Boxu 02 z TeOfon Studio & Jukebox 0.00G.',
        tagi: ['Box Editions', 'Solar Pulse', 'Bluza', 'DTG', 'Edycja limitowana', '0.00G'], cenaEur: 59.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ } },
    { handle: 'box-02-solar-pulse-plakat', tytul: 'Solar Pulse — Box 02 Plakat', linia: 'C', typ: 'Plakat', format: 'plakat', uklad: 'box',
        napis: 'SOLAR PULSE', podpis: 'BOX 02 · TEOFON STUDIO 0.00G', nota: 'Plakat edycji Boxu 02.',
        tagi: ['Box Editions', 'Solar Pulse', 'Plakat', '0.00G'], cenaEur: 24.9, opcja: { nazwa: 'Format', wartosci: ROZMIARY_PLAKAT } },
    { handle: 'box-03-hidengirl-tee', tytul: 'The Story Of HidenGirl — Box 03 T-shirt (edycja limitowana)', linia: 'C', typ: 'T-shirt', format: 'dtg', uklad: 'box',
        napis: 'HIDENGIRL', podpis: 'BOX 03 · ELARA S.M.T. · KAEL SMT · ORION SMT', nota: 'Edycja limitowana do Boxu 03 z TeOfon Studio & Jukebox 0.00G.',
        tagi: ['Box Editions', 'HidenGirl', 'T-shirt', 'DTG', 'Edycja limitowana', '0.00G'], cenaEur: 34.9, opcja: { nazwa: 'Rozmiar', wartosci: ROZMIARY_ODZIEZ } },
    { handle: 'box-03-hidengirl-plakat', tytul: 'The Story Of HidenGirl — Box 03 Plakat', linia: 'C', typ: 'Plakat', format: 'plakat', uklad: 'box',
        napis: 'HIDENGIRL', podpis: 'BOX 03 · 14 ROZDZIAŁÓW', nota: 'Plakat edycji Boxu 03.',
        tagi: ['Box Editions', 'HidenGirl', 'Plakat', '0.00G'], cenaEur: 24.9, opcja: { nazwa: 'Format', wartosci: ROZMIARY_PLAKAT } },
];

const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Opis produktu (HTML) — zawsze mówi, jaką metodą jest drukowany i w jakim pliku powstał. */
export function opisHtml(p: Produkt): string {
    const f = FORMATY[p.format];
    const czesci = [
        `<p><strong>${esc(p.napis)}</strong>${p.podpis ? ` — ${esc(p.podpis)}` : ''}</p>`,
        `<p>${esc(p.nota)}</p>`,
        `<p><strong>Metoda nadruku:</strong> ${esc(f.metoda)}.</p>`,
        `<p><strong>Plik produkcyjny:</strong> ${esc(f.nazwa)}, tło ${esc(f.tlo)}.</p>`,
        ...(p.linia === 'A' ? [`<p><em>${esc(NOTA_LINII_A)}</em></p>`] : []),
    ];
    return czesci.join('');
}

// ── CSV w układzie importu Shopify ──
export const KOLUMNY = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
    'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Image Src', 'Image Position', 'Image Alt Text', 'Status'];

const pole = (v: string | number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const gramy = (p: Produkt) => (p.format === 'naklejka' ? 10 : p.typ === 'Bluza' ? 600 : p.format === 'plakat' ? 120 : 190);

/**
 * Wiersze CSV: pierwszy wariant niesie całą kartę produktu, kolejne tylko `Handle` i swój rozmiar —
 * tak Shopify rozpoznaje warianty jednego produktu, a nie osobne produkty.
 */
export function wiersze(produkty: Produkt[] = PRODUKTY): string[][] {
    const out: string[][] = [KOLUMNY];
    for (const p of produkty) {
        p.opcja.wartosci.forEach((wart, i) => {
            const pierwszy = i === 0;
            out.push([
                p.handle, pierwszy ? p.tytul : '', pierwszy ? opisHtml(p) : '', pierwszy ? VENDOR : '', pierwszy ? p.typ : '',
                pierwszy ? p.tagi.join(', ') : '', pierwszy ? 'TRUE' : '',
                p.opcja.nazwa, wart,
                `${p.handle}-${uchwyt(wart)}`.toUpperCase(), String(gramy(p)), 'shopify', '0', 'continue', 'manual',
                p.cenaEur.toFixed(2), 'TRUE', 'TRUE',
                pierwszy ? urlPodgladu(p.handle) : '', pierwszy ? '1' : '', pierwszy ? `${p.tytul} — ${FORMATY[p.format].metoda}` : '',
                pierwszy ? 'active' : '',
            ]);
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

/** Zapisuje gotowy PNG z przeglądarki. Przyjmuje tylko handle z katalogu — nic nie trafia poza `teo-shop/`. */
export async function zapiszPlik(handle: string, png: Buffer) {
    const p = PRODUKTY.find((x) => x.handle === handle);
    if (!p) throw new Error(`Nie znam produktu „${handle}”.`);
    if (!Buffer.isBuffer(png) || png.length < 1000 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('To nie jest plik PNG.');
    const kat = katalogProduktu(handle);
    await fs.mkdir(kat, { recursive: true });
    const plik = path.join(kat, `${handle}.png`);
    await fs.writeFile(plik, png);
    await fs.writeFile(path.join(kat, 'METODA-NADRUKU.txt'), [
        p.tytul, '', `Metoda nadruku: ${FORMATY[p.format].metoda}`, `Plik: ${FORMATY[p.format].nazwa}, tło ${FORMATY[p.format].tlo}`,
        `Linia: ${p.linia}`, `Cena: ${p.cenaEur.toFixed(2)} EUR`, `Tagi: ${p.tagi.join(', ')}`,
        ...(p.linia === 'A' ? ['', NOTA_LINII_A] : []),
    ].join('\n'), 'utf8');
    return { handle, plik, bajtow: png.length };
}

/** Zapisuje podgląd sklepowy 1200×1440 — ten plik trafia do portalu i to jego adres jedzie do Shopify. */
export async function zapiszPodglad(handle: string, png: Buffer) {
    const p = PRODUKTY.find((x) => x.handle === handle);
    if (!p) throw new Error(`Nie znam produktu „${handle}”.`);
    if (!Buffer.isBuffer(png) || png.length < 500 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('To nie jest plik PNG.');
    await fs.mkdir(KATALOG_PODGLADOW, { recursive: true });
    const plik = path.join(KATALOG_PODGLADOW, `${bezpiecznyHandle(handle)}.png`);
    await fs.writeFile(plik, png);
    return { handle, plik, url: urlPodgladu(handle), bajtow: png.length };
}

/** Pisze `teo_shop_import.csv` obok folderów produktów. BOM, żeby Excel nie zjadł polskich znaków. */
export async function zapiszCsv(produkty: Produkt[] = PRODUKTY) {
    await fs.mkdir(KATALOG, { recursive: true });
    await fs.writeFile(PLIK_CSV, `﻿${csv(produkty)}`, 'utf8');
    return { plik: PLIK_CSV, produktow: produkty.length, wierszy: wiersze(produkty).length - 1 };
}

/** Stan kolekcji: które produkty mają już plik na dysku. */
export async function stan() {
    const out = [];
    for (const p of PRODUKTY) {
        const plik = path.join(katalogProduktu(p.handle), `${p.handle}.png`);
        const pod = path.join(KATALOG_PODGLADOW, `${p.handle}.png`);
        out.push({ ...p, gotowy: await fs.access(plik).then(() => true, () => false), podgladGotowy: await fs.access(pod).then(() => true, () => false),
            url: urlPodgladu(p.handle), metoda: FORMATY[p.format].metoda, wymiar: FORMATY[p.format].nazwa });
    }
    return { katalog: KATALOG, katalogPodgladow: KATALOG_PODGLADOW, adresPodgladu: ADRES_PODGLADU, csv: PLIK_CSV, produkty: out, csvGotowy: await fs.access(PLIK_CSV).then(() => true, () => false) };
}
