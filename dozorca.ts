/**
 * 🧠 DOZORCA — pilnuje ŻYCIA PRODUKTU, a nie wygląda mądrze.
 *
 * Suweren: „AI — coś, co to pochwyta i będzie jakoś zarządzać i monitorować
 * życie produktu".
 *
 * ⚠️ TO NIE JEST PANEL Z WYKRESAMI. Każda liczba tutaj jest POLICZONA
 * z realnych plików i każda prowadzi do konkretnej czynności. Wskaźnik,
 * z którego nie wynika, co zrobić dalej, jest ozdobą — a ozdoby w Katedrze
 * już raz udawały, że coś działa.
 *
 * ⚠️ DOZORCA NIC NIE ROBI SAM. Mówi, co stoi i dlaczego; wykonanie zostaje
 * przy człowieku. Agent, który sam rusza sto renderów, potrafi zająć kartę
 * na dobę bez pytania.
 */

import fs from 'fs/promises';
import path from 'path';
import { kreacje as wczytajKreacje } from './jajo-mody';
import { lista as wczytajWizualizacje } from './wizualizacje';
import { lista as wczytajMarki } from './marki';
import { stanKrawca } from './krawiec-lokalny';

const MOST = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';

export interface Etap {
    /** Nazwa etapu w życiu produktu. */
    co: string;
    ile: number;
    /** Z ilu — żeby widać było, jaka część drogi jest za nami. */
    z: number;
    /** Co zrobić, żeby ta liczba urosła. Pusto = nie ma co robić. */
    dalej: string | null;
}

export interface Przeszkoda {
    /** Co dokładnie stoi. */
    co: string;
    /** Dlaczego — po ludzku, z nazwą winowajcy. */
    czemu: string;
    waga: 'blokuje' | 'spowalnia';
}

/**
 * Ile koncepcji jest w katalogu Rady.
 *
 * ⚠️ Liczone z PLIKU, nie wpisane. Katalog bywa regenerowany skryptem
 * i liczba 62 przestanie być prawdą przy pierwszej takiej zmianie.
 */
async function ileKoncepcji(): Promise<number> {
    try {
        const p = path.join(process.cwd(), 'OtakOs_Fashion', 'katalog.json');
        const j = JSON.parse(await fs.readFile(p, 'utf8'));
        return Array.isArray(j) ? j.length : Object.keys(j).length;
    } catch {
        return 0;
    }
}

/**
 * Ile KREACJI jest ofirmowanych — nie ile jest plików.
 *
 * ⚠️ ZMIERZONE, ŻE TO NIE TO SAMO. Pierwsza wersja liczyła pliki i lejek
 * pokazał „ofirmowane 2 z 1" — bo jedna kreacja ofirmowana przez dwie marki
 * daje dwa pliki. Liczba przecząca sama sobie podważa cały panel, nawet gdy
 * reszta jest poprawna.
 *
 * Nazwa pliku ma kształt `<idKreacji>_<idMarki>.png`, więc licząc RÓŻNE
 * przedrostki dostajemy liczbę kreacji, a nie odbitek.
 */
async function ileOfirmowanych(znane: Set<string>): Promise<number> {
    try {
        const pliki = await fs.readdir(path.join(process.cwd(), 'public', 'ofirmowane'));
        const kreacje = new Set(
            pliki.filter((f) => /\.png$/i.test(f))
                .map((f) => f.replace(/\.png$/i, '').split('_marka-')[0]),
        );
        // ⚠️ Liczymy TYLKO te, które nadal istnieją jako narysowane kreacje.
        // Bez tego osierocony plik po skasowanym rysunku daje „2 z 1” — lejek
        // przeczy sam sobie i przestaje być wiarygodny w całości.
        return [...kreacje].filter((id) => znane.has(id)).length;
    } catch {
        return 0;
    }
}

/** Ile kadrów czeka w Katedrze — surowiec, z którego Krawcowa może kuć. */
async function kadryWKatedrze(): Promise<{ zywy: boolean; obrazow: number; powod?: string }> {
    try {
        const r = await fetch(`${MOST}/api/produkcja/kadry-z-obrazem?projekt=SOLLET`, {
            signal: AbortSignal.timeout(20000),
        });
        if (!r.ok) return { zywy: false, obrazow: 0, powod: `Most odpowiedział HTTP ${r.status}` };
        const d = await r.json() as { kadry?: { obraz: boolean }[] };
        return { zywy: true, obrazow: (d.kadry ?? []).filter((k) => k.obraz).length };
    } catch (e) {
        return { zywy: false, obrazow: 0, powod: `Most Katedry milczy (${(e as Error).message.slice(0, 60)})` };
    }
}

export async function przeglad() {
    const [koncepcji, kreacje, wizualizacje, marki, kadry, krawiec] = await Promise.all([
        ileKoncepcji(),
        wczytajKreacje(),
        wczytajWizualizacje(),
        wczytajMarki(),
        kadryWKatedrze(),
        stanKrawca(),
    ]);

    const ofirmowanych = await ileOfirmowanych(new Set(wizualizacje.map((w) => w.id)));

    const wszystkich = koncepcji + kreacje.length;
    const zLogo = marki.filter((m) => m.logo).length;

    /**
     * ⚠️ LEJEK, NIE ZBIÓR LICZB. Każdy etap mówi, ile przeszło dalej i CO ZROBIĆ,
     * żeby przeszło więcej. To jest różnica między monitorowaniem a dekoracją.
     */
    const lejek: Etap[] = [
        {
            co: 'koncepcje w katalogu',
            ile: wszystkich, z: wszystkich,
            dalej: kadry.zywy && kadry.obrazow > 0
                ? `W Katedrze czeka ${kadry.obrazow} kadrów — Krawcowa może wykuć z nich kolejne.`
                : null,
        },
        {
            co: 'narysowane (widać sztukę odzieży)',
            ile: wizualizacje.length, z: wszystkich,
            dalej: wizualizacje.length < wszystkich
                ? `${wszystkich - wizualizacje.length} kreacji istnieje TYLKO jako opis. Zakładka KREACJA → NARYSUJ.`
                : null,
        },
        {
            co: 'ofirmowane',
            ile: ofirmowanych, z: wizualizacje.length,
            dalej: wizualizacje.length > ofirmowanych
                ? `${wizualizacje.length - ofirmowanych} rysunków bez znaku marki. Zakładka MARKI → OFIRMUJ.`
                : null,
        },
    ];

    /**
     * ⚠️ PRZESZKODY WSKAZUJĄ WINOWAJCĘ Z NAZWY. „Coś nie działa" zmusza
     * człowieka do zgadywania — a to już raz kosztowało nas godzinę przy
     * komunikacie „zamknij VoiceStudio", gdy VoiceStudio było zamknięte.
     */
    const przeszkody: Przeszkoda[] = [];

    if (!kadry.zywy) {
        przeszkody.push({
            co: 'Krawcowa nie widzi kadrów',
            czemu: `${kadry.powod ?? 'Most nie odpowiada'}. Odpal Katedrę (START_KATEDRA.bat) — bez niej `
                 + 'nie ma z czego kuć ani czym rysować.',
            waga: 'blokuje',
        });
    }
    if (!krawiec.zywy) {
        przeszkody.push({
            co: 'Krawiec lokalny nie projektuje',
            czemu: krawiec.powod ?? 'Ollama nie odpowiada.',
            waga: 'blokuje',
        });
    }
    if (!marki.length) {
        przeszkody.push({
            co: 'Nie ma żadnej marki',
            czemu: 'Bez marki nie da się ofirmować kreacji. Zakładka MARKI → ZAŁÓŻ MARKĘ.',
            waga: 'spowalnia',
        });
    } else if (!zLogo) {
        przeszkody.push({
            co: `Żadna z ${marki.length} marek nie ma logo`,
            czemu: 'Marka bez logo nic nie ofirmuje. Wgraj PNG — najlepiej z przezroczystym tłem, '
                 + 'ale znak musi być na nim WIDOCZNY (przezroczysty na wylot zostanie odrzucony).',
            waga: 'spowalnia',
        });
    }

    return {
        lejek,
        przeszkody,
        surowiec: { kadrowWKatedrze: kadry.obrazow, katedraZywa: kadry.zywy },
        silniki: {
            krawiec: { zywy: krawiec.zywy, model: krawiec.model, powod: krawiec.powod ?? null },
        },
        marki: marki.map((m) => ({ nazwa: m.nazwa, maLogo: !!m.logo })),
        // ⚠️ Znacznik czasu, bo przegląd sprzed godziny opisuje inny stan.
        stanNa: new Date().toISOString(),
    };
}
