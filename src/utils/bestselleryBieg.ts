/**
 * 🖨 Bieg bestsellerów Printful — jedna postać, jeden przebieg.
 *
 * Wyjęte z `BestselleryPrintful.tsx`, żeby ten sam kod mógł puścić i panel kolekcji (jedna postać,
 * ręcznie), i TeO ShoP (wszystkie postacie linii, jednym przyciskiem). Dotąd istniał tylko w komponencie,
 * więc każda postać wymagała przejścia przez Kolekcję 360 — przy dziesięciu stworkach to dziesięć
 * ręcznych przebiegów i dziesięć okazji do pomyłki.
 *
 * Co robi: dla każdego produktu z `PRODUKTY_PF` pobiera DOKŁADNE wymiary szablonu z Printful
 * (most → Skarbiec 0.00G), rysuje każdy panel, odsyła PNG na serwer i na końcu pisze manifest.
 * Manifest to umowa z synchronizacją Printful: wiąże SKU wariantu sklepu z `variantId` katalogu
 * drukarni i ze ścieżkami plików druku. Bez niego `/api/printful/synchronizuj` nie ma czego dopasować.
 */
import { doPng, type TekstKolekcji } from './kompozycja360';
import { PRODUKTY_PF, miejscaWariantu, nazwaPliku, rysujPlik, type MiejsceDruku, type ProduktPF, type WariantPF, type Barwa } from './bestsellery';

export const slugPostaci = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kolekcja';

interface Printfiles {
    success: boolean; message?: string;
    printfiles?: { printfile_id: number; width: number; height: number; can_rotate?: boolean }[];
    warianty?: Record<string, Record<string, number>>;
}

/** Miejsca wariantu w rozmiarach z Printful (gdy przyszły); miejsca, których Printful dla wariantu nie ma, odpadają. */
function miejscaZPrintful(p: ProduktPF, w: WariantPF, pf: Printfiles | null): { miejsca: MiejsceDruku[]; zrodlo: 'printful' | 'orientacyjne' } {
    const baza = miejscaWariantu(p, w);
    const mapa = pf?.success ? pf.warianty?.[String(w.variantId)] : null;
    if (!mapa) return { miejsca: baza, zrodlo: 'orientacyjne' };
    const out: MiejsceDruku[] = [];
    for (const mi of baza) {
        const id = mapa[mi.placement]; const f = pf!.printfiles?.find((x) => x.printfile_id === id);
        // plakat/canvas 18×24″ Printful podaje poziomo (7200×5400, can_rotate) — projekt pionowy dostaje ten sam szablon obrócony
        const obroc = f && f.can_rotate && (mi.w > mi.h) !== (f.width > f.height);
        if (f) out.push({ ...mi, w: obroc ? f.height : f.width, h: obroc ? f.width : f.height });
    }
    return { miejsca: out.length ? out : baza, zrodlo: out.length ? 'printful' : 'orientacyjne' };
}

async function wyslijPng(adres: string, c: HTMLCanvasElement) {
    const r = await fetch(adres, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: await doPng(c) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
}

export interface BiegOpcje {
    /** Imię postaci — z niego powstaje katalog `public/nadruki/bestsellery/<slug>/`. */
    imie: string;
    /** Postać wycięta z tła (albo duet złożony obok siebie). */
    wyciety: HTMLCanvasElement;
    tekst: TekstKolekcji;
    kolekcja?: string | null;
    /** Tylko produkty All-Over Print — reszta katalogu czeka na własnych producentów. */
    tylkoAop?: boolean;
    /** Barwa kolorystyki 0.00G; domyślnie Obsidian Black. */
    barwa?: Barwa;
    /** Klucze produktów do narysowania; domyślnie wszystkie (po filtrze `tylkoAop`). */
    klucze?: string[];
    postep?: (tekst: string) => void;
}

export interface BiegWynik {
    postac: string; produktow: number; plikow: number;
    zrodloWymiarow: Record<string, string>;
    dokladnych: number; wszystkich: number;
    most: unknown;
}

/** Rysuje i odsyła komplet plików druku jednej postaci, a na końcu manifest. Rzuca z nazwą produktu w treści. */
export async function biegBestsellerow(o: BiegOpcje): Promise<BiegWynik> {
    const postac = slugPostaci(o.imie);
    const mow = o.postep ?? (() => {});
    const wybrane = PRODUKTY_PF.filter((p) => (o.tylkoAop ? p.aop : true) && (o.klucze ? o.klucze.includes(p.klucz) : true));
    if (!wybrane.length) throw new Error('Nie wybrano żadnego produktu Printful.');

    const zrodloWymiarow: Record<string, string> = {};
    const produkty: unknown[] = [];
    let plikow = 0;

    for (const p of wybrane) {
        mow(`${o.imie} · ${p.nazwa}: wymiary szablonu…`);
        const pf: Printfiles | null = await fetch(`/api/nadruki/printful/printfiles/${p.katalogId}`).then((r) => r.json()).catch(() => null);
        const gotowe = new Set<string>();
        const warianty = [];
        let zrodlo: 'printful' | 'orientacyjne' = 'orientacyjne';
        for (const w of p.warianty) {
            const mz = miejscaZPrintful(p, w, pf); zrodlo = mz.zrodlo;
            const pliki: Record<string, string> = {};
            for (const mi of mz.miejsca) {
                const nazwa = nazwaPliku(mi);
                if (!gotowe.has(nazwa)) {
                    mow(`${o.imie} · ${p.nazwa} · ${mi.nazwa} (${mi.w}×${mi.h})…`);
                    await new Promise((r) => setTimeout(r, 0));
                    const c = rysujPlik(mi.rysunek, mi.w, mi.h, o.wyciety, o.tekst, o.imie, `${postac}-${p.klucz}-${mi.placement}`, o.barwa);
                    await wyslijPng(`/api/nadruki/bestsellery/${postac}/plik?produkt=${p.klucz}&nazwa=${encodeURIComponent(nazwa)}`, c);
                    gotowe.add(nazwa); plikow++;
                }
                pliki[mi.placement] = `${p.klucz}/${nazwa}`;
            }
            warianty.push({
                wartosc: w.wartosc, variantId: w.variantId, cenaEur: w.cenaEur,
                sku: `${postac}-${p.klucz}-${w.wartosc}`.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80),
                pliki,
            });
        }
        zrodloWymiarow[String(p.katalogId)] = zrodlo;
        produkty.push({ klucz: p.klucz, katalogId: p.katalogId, nazwaPrintful: p.nazwaPrintful, tytul: `${o.imie} — ${p.nazwa} · 0.00G Style`, typ: p.typ, aop: p.aop, opcja: p.opcja, uwaga: p.uwaga, warianty });
    }

    mow(`${o.imie}: manifest i kopia do Stołu Produktowego…`);
    const r = await fetch(`/api/nadruki/bestsellery/${postac}/manifest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imie: o.imie, kolekcja: o.kolekcja ?? null, zrodloWymiarow, produkty }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);

    const wszystkich = Object.keys(zrodloWymiarow).length;
    return { postac, produktow: produkty.length, plikow, zrodloWymiarow, wszystkich, most: d.most, dokladnych: Object.values(zrodloWymiarow).filter((z) => z === 'printful').length };
}
