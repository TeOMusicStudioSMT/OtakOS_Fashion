/**
 * ✂️ KRAWIEC LOKALNY — projektuje ubiór na sprzęcie Suwerena, bez chmury.
 *
 * PO CO. Szablon przyszedł z AI Studio i wołał `gemini-3.8-flash` z kluczem
 * `GEMINI_API_KEY`. To wprost kłóci się z pierwszą zasadą Katedry:
 * „Suwerenność i lokalność. Wszystko działa lokalnie, na sprzęcie Suwerena.
 * Zero chmury jako domyślne". Dział mody nie może być wyjątkiem — tym bardziej
 * że wysyłałby do Google opisy niewydanych kolekcji.
 *
 * ⚠️ `think: false` JEST OBOWIĄZKOWE. Zmierzone w tej Katedrze: bez tego pola
 * model przepala cały budżet tokenów na blok myślenia i oddaje PUSTĄ treść
 * (eval_count 60, response ""). Panel pokazuje wtedy sukces bez zawartości —
 * pułapka klasy „atrapa".
 *
 * ⚠️ ODMAWIAMY ZAMIAST ODDAWAĆ POŁOWĘ. Model potrafi zwrócić JSON bez
 * `garmentMechanics` albo z pustymi polami. Taka kreacja wygląda w galerii jak
 * gotowa, a nie da się jej uszyć ani narysować. Lepiej powiedzieć, czego
 * zabrakło.
 */

const OLLAMA = process.env.OTAKOS_OLLAMA || 'http://127.0.0.1:11434';

/**
 * Model domyślny.
 *
 * ⚠️ NIE `gemma4:e2b`. Projekt ubioru to długi, ustrukturyzowany JSON z sześcioma
 * polami mechaniki — mały model gubi pola albo psuje składnię. `qwen3.5:9b`
 * sprawdził się w tej Katedrze przy zadaniach wymagających wierności szczegółom.
 */
const MODEL = process.env.OTAKOS_MODEL_MODY || 'qwen3.5:9b';

export interface MechanikaUbioru {
    materials: string;
    cutsAndSilhouette: string;
    lightReflection: string;
    cyberneticWeaving: string;
    structuralTension: string;
    colorway: string;
}

export interface Kreacja {
    title: string;
    archetype: string;
    anomalyType: string;
    fashionConcept: string;
    garmentMechanics: MechanikaUbioru;
    imagePrompt: string;
    /** Kto to policzył — jawny podpis, żeby nie było wątpliwości, czy poszło w chmurę. */
    silnik: string;
}

const INSTRUKCJA = [
    'You are the Chief Digital Stylist for "OtakOS Fashion" — cyber-alchemical haute couture',
    'born inside the 0.00G OtakOS Cathedral.',
    '',
    'Visual language:',
    '- Dynamic physics glitches: wavy lines, green and blue digital anomalies, spatial cracks',
    '- Deep absorption black against surgical neon green (#00FF66), sharp blue (#0055FF),',
    '  warm alchemical orange (#FF5500)',
    '- Solita = rigid, architectural, tension drapes, crystalline.',
    '  Molita = amorphous, liquid mercury, fluid, dissolved boundary.',
    '- No generic corporate fashion buzzwords. No "elevated", no "curated", no "timeless".',
    '',
    'You answer with a SINGLE JSON object and nothing else — no commentary, no backtick fence.',
].join('\n');

function pytanie({ scenePrompt, archetype, anomalyType, customNotes }: {
    scenePrompt: string; archetype: string; anomalyType: string; customNotes?: string;
}) {
    return [
        `INPUT SCENE PHYSICS: "${scenePrompt}"`,
        `TARGET ARCHETYPE: ${archetype}`,
        `ANOMALY FOCUS: ${anomalyType}`,
        `ADDITIONAL NOTES: ${customNotes || 'None'}`,
        '',
        'Translate this into one OtakOS Fashion couture piece. Return exactly this shape:',
        '{',
        '  "title": "avant-garde piece title",',
        `  "archetype": "${archetype}",`,
        `  "anomalyType": "${anomalyType}",`,
        '  "fashionConcept": "how the scene physics becomes garment philosophy, 2-4 sentences",',
        '  "garmentMechanics": {',
        '    "materials": "specific high-tech, cyber-alchemical textiles",',
        '    "cutsAndSilhouette": "0.00G tailoring, proportions, floating elements",',
        '    "lightReflection": "specular properties, absorption, luminescent piping",',
        '    "cyberneticWeaving": "micro-electronics, piezoelectric fibers, conductive yarns",',
        '    "structuralTension": "tension wires, magnetic rings, zero-G counter-balances",',
        '    "colorway": "exact colorway with hex values"',
        '  },',
        '  "imagePrompt": "runway/lookbook prompt for FLUX — CLOTHING, FABRIC, LIGHT only, no story"',
        '}',
        '',
        'Every field must be filled. An empty field is a failed answer.',
    ].join('\n');
}

/** ⚠️ Modele lubią obudować JSON zdaniem albo płotem. Bierzemy pierwszy `{` i ostatni `}`. */
function wylusz(surowe: string): unknown {
    const t = String(surowe || '');
    const start = t.indexOf('{');
    const koniec = t.lastIndexOf('}');
    if (start < 0 || koniec <= start) {
        throw new Error(`Model nie oddał obiektu JSON. Dostałem: ${t.slice(0, 200)}`);
    }
    try {
        return JSON.parse(t.slice(start, koniec + 1));
    } catch (e) {
        throw new Error(`Kreacja jest niepoprawnym JSON-em: ${(e as Error).message}`);
    }
}

const POLA_MECHANIKI: (keyof MechanikaUbioru)[] = [
    'materials', 'cutsAndSilhouette', 'lightReflection',
    'cyberneticWeaving', 'structuralTension', 'colorway',
];

/**
 * Sprawdź, czy to kompletna kreacja.
 *
 * ⚠️ Puste pole to NIE drobiazg. `imagePrompt` jest tym, co pojedzie do FLUX-a;
 * bez niego kreacja nigdy się nie narysuje, a w galerii wygląda jak gotowa.
 */
function sprawdz(d: Record<string, unknown>, silnik: string): Kreacja {
    const braki: string[] = [];
    const tekst = (v: unknown) => String(v ?? '').trim();

    for (const pole of ['title', 'fashionConcept', 'imagePrompt']) {
        if (tekst(d[pole]).length < 3) braki.push(pole);
    }
    const m = (d.garmentMechanics ?? {}) as Record<string, unknown>;
    for (const pole of POLA_MECHANIKI) {
        if (tekst(m[pole]).length < 3) braki.push(`garmentMechanics.${pole}`);
    }
    if (braki.length) {
        throw new Error(`Model oddał kreację bez pól: ${braki.join(', ')}. Spróbuj ponownie albo zmień silnik.`);
    }

    return {
        title: tekst(d.title),
        archetype: tekst(d.archetype),
        anomalyType: tekst(d.anomalyType),
        fashionConcept: tekst(d.fashionConcept),
        garmentMechanics: Object.fromEntries(
            POLA_MECHANIKI.map((p) => [p, tekst(m[p])]),
        ) as unknown as MechanikaUbioru,
        imagePrompt: tekst(d.imagePrompt),
        silnik,
    };
}

/** Czy Ollama w ogóle stoi i zna ten model. Sprawdzane ZANIM obiecamy kreację. */
export async function stanKrawca(): Promise<{ zywy: boolean; model: string; modele: string[]; powod?: string }> {
    try {
        const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return { zywy: false, model: MODEL, modele: [], powod: `Ollama HTTP ${r.status}` };
        const d = await r.json() as { models?: { name: string }[] };
        const modele = (d.models ?? []).map((m) => m.name);
        if (!modele.includes(MODEL)) {
            return {
                zywy: false, model: MODEL, modele,
                powod: `Ollama nie ma modelu „${MODEL}". Ma: ${modele.slice(0, 6).join(', ')}. `
                     + 'Pobierz go (`ollama pull ' + MODEL + '`) albo wskaż inny przez OTAKOS_MODEL_MODY.',
            };
        }
        return { zywy: true, model: MODEL, modele };
    } catch (e) {
        return {
            zywy: false, model: MODEL, modele: [],
            powod: `Ollama nie odpowiada na ${OLLAMA} — odpal Katedrę. (${(e as Error).message})`,
        };
    }
}

/** Zaprojektuj kreację LOKALNIE. Rzuca wyjątkiem z powodem, gdy się nie udało. */
export async function zaprojektuj(wejscie: {
    scenePrompt: string; archetype?: string; anomalyType?: string; customNotes?: string;
}): Promise<Kreacja> {
    const stan = await stanKrawca();
    if (!stan.zywy) throw new Error(stan.powod ?? 'Krawiec lokalny nie jest gotowy.');

    const r = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: INSTRUKCJA },
                {
                    role: 'user',
                    content: pytanie({
                        scenePrompt: wejscie.scenePrompt,
                        archetype: wejscie.archetype || 'Solita',
                        anomalyType: wejscie.anomalyType || 'Spatial Crack',
                        customNotes: wejscie.customNotes,
                    }),
                },
            ],
            stream: false,
            think: false,                     // ⚠️ patrz nagłówek pliku
            format: 'json',                   // Ollama wymusza wtedy poprawną składnię
            options: { num_predict: 1600, temperature: 0.8, num_ctx: 8192 },
        }),
        // Projekt ubioru to długi JSON — na 6 GB karty z offloadem to minuty, nie sekundy.
        signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);

    const d = await r.json() as { message?: { content?: string } };
    const obiekt = wylusz(d.message?.content ?? '') as Record<string, unknown>;
    return sprawdz(obiekt, `${MODEL} (lokalnie)`);
}
