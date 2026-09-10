/**
 * 🥚 JAJO MODY — patrzy na kadr z produkcji i kuje z niego kreację.
 *
 * PO CO. Suweren: „można by połączyć katalog produkcyjny ze Story, tak by AI
 * z Fashion widziały KADRY — zawsze mają z czego robić. Dodaj Jajo
 * odpowiedzialne za Fashion, które będzie mogło kuć coś z tych kadrów".
 *
 * Dział filmowy Katedry ma dziś 217 policzonych kadrów w SOLLET i 156
 * w alchemicznej fluktuacji. To gotowy, darmowy materiał wyjściowy — do dziś
 * niewidoczny dla mody.
 *
 * ⚠️ DWA KROKI, NIE JEDEN. Jajo najpierw PATRZY (model widzenia opisuje, co
 * jest na kadrze), potem PROJEKTUJE (krawiec robi z tego ubiór). Zlanie tego
 * w jedno pytanie daje projekt oparty na tytule karty zamiast na obrazie —
 * a tytuł „#3.17 Wewnętrzny glitch" nie mówi nic o sylwetce ani o świetle.
 *
 * ⚠️ `think: false` OBOWIĄZKOWE. Zmierzone w tej Katedrze: bez tego model
 * przepala budżet tokenów na blok myślenia i oddaje PUSTĄ treść.
 *
 * ⚠️ MODEL MUSI NAPRAWDĘ WIDZIEĆ. Zmierzone na Tim/aktor.png: qwen3.5:9b
 * opisał wszystko zgodnie z prawdą, gemma4:e2b pomyliła kolor oczu,
 * a gemma4:latest twierdziła, że obrazu nie dostała — choć tokeny dowodziły,
 * że dostała. Dlatego okiem jest qwen3.5:9b.
 */

import fs from 'fs/promises';
import path from 'path';
import { zaprojektuj, type Kreacja } from './krawiec-lokalny';

const MOST = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';
const OLLAMA = process.env.OTAKOS_OLLAMA || 'http://127.0.0.1:11434';
const MODEL_WZROKU = process.env.OTAKOS_MODEL_WZROKU || 'qwen3.5:9b';

const PLIK_KREACJI = path.join(process.cwd(), 'OtakOs_Fashion', 'kreacje.json');

export interface KadrProdukcji {
    id: string;
    tytul: string;
    opis: string;
    etap: string;
    obraz: boolean;
    nazwaPliku: string;
    /** Adres W MOŚCIE, nie ścieżka dyskowa. */
    plik: string;
    kwestie: { kto: string; tekst: string }[];
}

export interface KreacjaZKadru extends Kreacja {
    id: string;
    /** Skąd to się wzięło — kadr, nie wyobraźnia. */
    zKadru: { projekt: string; id: string; tytul: string; plik: string };
    /** Co OKO zobaczyło na kadrze. Zapisane, bo to ono karmiło projekt. */
    coWidac: string;
    wykute: string;
}

/** Kadry z obrazem dla danego projektu — prosto z mostu Katedry. */
export async function kadry(projekt: string): Promise<KadrProdukcji[]> {
    const r = await fetch(`${MOST}/api/produkcja/kadry-z-obrazem?projekt=${encodeURIComponent(projekt)}`, {
        signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`Most Katedry odpowiedział HTTP ${r.status}. Odpal Katedrę (START_KATEDRA.bat).`);
    const d = await r.json() as { success?: boolean; message?: string; kadry?: KadrProdukcji[] };
    if (d.success === false) throw new Error(d.message ?? 'Most odmówił.');
    return d.kadry ?? [];
}

/**
 * Projekty widziane przez most — żeby panel nie zgadywał nazw.
 *
 * ⚠️ Trasa nazywa się `/api/rezyser/projekty`, nie `/api/produkcja/projekty`.
 * Sprawdzone na żywym moście — pierwsza wersja zgadła nazwę i cicho oddawała
 * pustą listę, co w panelu wyglądało jak „Katedra nie ma projektów”.
 */
export async function projekty(): Promise<string[]> {
    const r = await fetch(`${MOST}/api/rezyser/projekty`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!r || !r.ok) return [];
    const d = await r.json() as { projekty?: (string | { nazwa?: string })[] };
    return (d.projekty ?? []).map((p) => (typeof p === 'string' ? p : p?.nazwa ?? '')).filter(Boolean);
}

/**
 * KROK 1 — Jajo patrzy.
 *
 * Pytamy o rzeczy przydatne KRAWCOWI: sylwetkę, materiały widoczne na postaci,
 * światło i kolory. Nie o fabułę — od fabuły jest opis karty.
 */
async function coWidacNaKadrze(obrazBase64: string): Promise<string> {
    const r = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_WZROKU,
            messages: [{
                role: 'user',
                content: 'You are a fashion scout looking at a film frame. Describe ONLY what a tailor needs: '
                    + 'the figure and pose, what the person is wearing (fabric, cut, layers, closures), '
                    + 'the light (direction, colour, hard or soft) and the dominant colours of the frame. '
                    + '3-5 sentences, English, facts visible in the image only. '
                    + 'Do NOT invent a story, a name, or a brand.',
                images: [obrazBase64],
            }],
            stream: false,
            think: false,                    // ⚠️ patrz nagłówek pliku
            options: { num_predict: 400, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(8 * 60 * 1000),
    });
    if (!r.ok) throw new Error(`Oko nie odpowiedziało: Ollama HTTP ${r.status}`);
    const d = await r.json() as { message?: { content?: string }; error?: string };
    const opis = String(d.message?.content ?? '').trim();
    if (!opis) {
        throw new Error(d.error
            ? `Oko odmówiło: ${d.error}`
            : `Model „${MODEL_WZROKU}" oddał pusty opis kadru — sprawdź, czy w ogóle widzi obrazy.`);
    }
    return opis;
}

async function wczytajKreacje(): Promise<KreacjaZKadru[]> {
    try {
        const j = JSON.parse(await fs.readFile(PLIK_KREACJI, 'utf8'));
        return Array.isArray(j) ? j : (j.kreacje ?? []);
    } catch {
        return [];
    }
}

/** Zapis atomowy: tmp → rename. Przerwany zapis nie zostawia połowy pliku. */
async function zapiszKreacje(lista: KreacjaZKadru[]) {
    await fs.mkdir(path.dirname(PLIK_KREACJI), { recursive: true });
    const tmp = `${PLIK_KREACJI}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ kreacje: lista }, null, 2), 'utf8');
    await fs.rename(tmp, PLIK_KREACJI);
}

export const kreacje = wczytajKreacje;

/**
 * WYKUJ — z kadru robi kreację.
 *
 * ⚠️ ZAPISUJEMY, CO OKO ZOBACZYŁO. Bez tego nie da się później rozstrzygnąć,
 * czy dziwny projekt wziął się ze złego widzenia, czy ze złego projektowania.
 */
export async function wykuj({ projekt, kadrId }: { projekt: string; kadrId: string }): Promise<KreacjaZKadru> {
    const lista = await kadry(projekt);
    const kadr = lista.find((k) => k.id === kadrId);
    if (!kadr) throw new Error(`Nie ma kadru „${kadrId}" w projekcie „${projekt}".`);
    if (!kadr.obraz) {
        throw new Error(`„${kadr.tytul}" to ujęcie wideo, nie obraz. Jajo patrzy na klatki — policz ten kadr na etapie KADR.`);
    }

    // Obraz ciągniemy przez most — Fashion nie ma dostępu do dysku Katedry
    // i nie powinien go mieć.
    const ro = await fetch(`${MOST}${kadr.plik}`, { signal: AbortSignal.timeout(60000) });
    if (!ro.ok) throw new Error(`Nie pobrałem obrazu kadru: HTTP ${ro.status}`);
    const bufor = Buffer.from(await ro.arrayBuffer());
    if (bufor.length < 1024) throw new Error('Most oddał pusty plik zamiast obrazu.');

    const coWidac = await coWidacNaKadrze(bufor.toString('base64'));

    // KROK 2 — krawiec projektuje. Karmimy go TYM, CO WIDAĆ, a nie samym tytułem.
    const kreacja = await zaprojektuj({
        scenePrompt: `${kadr.opis}\n\nWHAT IS ACTUALLY IN THE FRAME: ${coWidac}`,
        archetype: /molita/i.test(`${kadr.tytul} ${kadr.opis}`) ? 'Molita' : 'Solita',
        anomalyType: 'Sine-Wave Distortion',
        customNotes: kadr.kwestie.length
            ? `The character says: ${kadr.kwestie.map((q) => `${q.kto}: "${q.tekst}"`).join(' | ')}`
            : undefined,
    });

    const wpis: KreacjaZKadru = {
        ...kreacja,
        id: `KUTA-${Date.now().toString(36)}`,
        zKadru: { projekt, id: kadr.id, tytul: kadr.tytul, plik: kadr.plik },
        coWidac,
        wykute: new Date().toISOString(),
    };

    const wszystkie = await wczytajKreacje();
    wszystkie.unshift(wpis);
    await zapiszKreacje(wszystkie);
    return wpis;
}
