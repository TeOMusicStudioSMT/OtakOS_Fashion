/**
 * 🔗 ZWIĄŻ KONCEPCJE Z OBRAZAMI.
 *
 * PO CO. Rada wygenerowała 62 koncepcje mody — po jednej na kadr SOLLET.
 * Te same 62 kadry leżą obok jako PRAWDZIWE obrazy (`katalog/sollet-kadry-*`).
 * I nic ich nie łączyło: aplikacja pokazywała opisy bez zdjęć, a zdjęcia
 * leżały w katalogu, o którym aplikacja nie wiedziała.
 *
 * ⚠️ WIĄZANIE JEST ZAŁOŻENIEM, NIE FAKTEM — i dlatego jest ZAPISYWANE
 * do pliku, który da się poprawić ręcznie.
 *
 * Czego NIE DA SIĘ dopasować automatycznie: koncepcja ma tytuł typu
 * „SOLLET-KF01: Solita Vantablack Tectonic Sheath", a obraz pochodzi z kadru
 * „#1.17 Fale Przestrzenne". Nie ma w nich wspólnego identyfikatora. Jedyne,
 * co wiadomo na pewno, to że jednych i drugich jest 62.
 *
 * Więc wiążemy PO KOLEJNOŚCI FABULARNEJ — numer sceny wyłuskany z tytułu
 * kadru (#1.1 → 1.1, #2.11 → 2.11), rosnąco. To najbliższe temu, co Rada
 * najpewniej widziała, ale nadal jest to domysł. Plik `powiazania.json`
 * istnieje po to, żeby Suweren mógł go poprawić bez tykania kodu.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const TU = path.dirname(fileURLToPath(import.meta.url));
const APKA = path.resolve(TU, '..');
const DZIAL = path.resolve(APKA, '..');            // OtakOs_Fashion/

const KATALOG_OBRAZOW = path.join(DZIAL, 'katalog.json');
const KONCEPCJE = path.join(APKA, 'OtakOs_Fashion', 'katalog.json');
const POWIAZANIA = path.join(APKA, 'OtakOs_Fashion', 'powiazania.json');
const PUBLICZNE = path.join(APKA, 'public', 'kadry');

/** Numer sceny z tytułu kadru: „#2.11 Glitch Wzrostu" → 2.011 (do sortowania). */
function numerSceny(tytul) {
    const m = String(tytul || '').match(/#(\d+)\.(\d+)/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return Number(m[1]) * 1000 + Number(m[2]);
}

const indeks = JSON.parse(await fs.readFile(KATALOG_OBRAZOW, 'utf8'));
const surowe = JSON.parse(await fs.readFile(KONCEPCJE, 'utf8'));
const koncepcje = Array.isArray(surowe) ? surowe : Object.values(surowe);

// Obrazy w kolejności fabularnej — nie alfabetycznej, bo alfabetyczna
// wrzuca #1.17 przed #1.2 i cały porządek się rozjeżdża.
const obrazy = [...(indeks.pozycje ?? [])].sort((a, b) => numerSceny(a.tytul) - numerSceny(b.tytul));

console.log(`koncepcji: ${koncepcje.length} | obrazow: ${obrazy.length}`);
if (koncepcje.length !== obrazy.length) {
    console.log('⚠️  RÓŻNA LICZBA — wiążę tyle, ile się da, resztę zostawiam bez pary.');
}

// Obrazy trafiają do public/, bo Vite serwuje tylko stamtąd.
await fs.mkdir(PUBLICZNE, { recursive: true });
const zrodlo = path.join(DZIAL, 'katalog', 'sollet-kadry-2026-09-09');

const pary = [];
for (let i = 0; i < Math.max(koncepcje.length, obrazy.length); i += 1) {
    const k = koncepcje[i] ?? null;
    const o = obrazy[i] ?? null;
    if (o) {
        // Kopiujemy, nie przenosimy — katalog działu zostaje źródłem prawdy.
        await fs.copyFile(path.join(zrodlo, o.plik), path.join(PUBLICZNE, o.plik)).catch(() => null);
    }
    pary.push({
        keyframe: k?.keyframe ?? (i + 1),
        idKoncepcji: k?.id ?? null,
        tytulKoncepcji: k?.title ?? null,
        plik: o ? `/kadry/${o.plik}` : null,
        tytulKadru: o?.tytul ?? null,
        opisKadru: o?.opis ?? null,
        szerokosc: o?.szerokosc ?? null,
        wysokosc: o?.wysokosc ?? null,
        // ⚠️ Mówi wprost, skąd wzięła się ta para. „kolejnosc" = domysł.
        skad: k && o ? 'kolejnosc' : 'brak pary',
    });
}

await fs.writeFile(POWIAZANIA, JSON.stringify({
    zwiazane: new Date().toISOString(),
    metoda: 'kolejność fabularna (numer sceny z tytułu kadru, rosnąco)',
    uwaga: 'To DOMYSŁ, nie fakt — koncepcje i kadry nie mają wspólnego identyfikatora. '
         + 'Popraw ręcznie pole `plik` przy dowolnej pozycji, jeśli para jest zła.',
    par: pary.filter((p) => p.plik && p.idKoncepcji).length,
    pozycje: pary,
}, null, 2), 'utf8');

console.log(`powiązanych par: ${pary.filter((p) => p.plik && p.idKoncepcji).length}`);
console.log(`obrazy skopiowane do: public/kadry/`);
console.log(`wiązania zapisane w: OtakOs_Fashion/powiazania.json`);
