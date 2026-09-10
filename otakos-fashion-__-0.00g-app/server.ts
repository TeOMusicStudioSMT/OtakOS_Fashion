import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { zaprojektuj as zaprojektujLokalnie, stanKrawca } from './krawiec-lokalny';
import { kadry as kadryProdukcji, projekty as projektyKatedry, wykuj, kreacje as wczytajKreacje } from './jajo-mody';

/**
 * ⚠️ CHMURA JEST WYŁĄCZONA DOMYŚLNIE.
 *
 * Szablon z AI Studio wołał `gemini-3.8-flash` jako PIERWSZĄ drogę. To wprost
 * kłóci się z pierwszą zasadą Katedry: „Suwerenność i lokalność. Wszystko
 * działa lokalnie, na sprzęcie Suwerena. Zero chmury jako domyślne”. Dział mody
 * nie może być wyjątkiem — tym bardziej że wysyłałby do Google opisy
 * niewydanych kolekcji.
 *
 * Chmura zostaje jako świadomy wybór: OTAKOS_FASHION_CHMURA=1 plus klucz.
 */
const CHMURA_WLACZONA = process.env.OTAKOS_FASHION_CHMURA === '1';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: '0.00G OtakOS Cathedral',
    collection: 'SOLLET',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Fetch full SOLLET catalog
/**
 * Czym dziś projektujemy — żeby panel nie obiecywał kreacji, której nie ma jak policzyć.
 */
// ── 🥚 JAJO MODY — okno na kadry produkcji ─────────────────────────

/** Projekty widziane przez most Katedry. */
app.get('/api/projekty', async (_req, res) => {
  try {
    res.json({ projekty: await projektyKatedry() });
  } catch (err: any) {
    res.status(502).json({ error: String(err?.message ?? err) });
  }
});

/**
 * Kadry z obrazem — materiał, z którego moda ma co robić.
 *
 * ⚠️ Gdy most milczy, mówimy to WPROST. Pusta lista wyglądałaby jak „projekt
 * nie ma kadrów”, a znaczyłaby „Katedra nie jest odpalona” — to dwie zupełnie
 * różne rzeczy do zrobienia.
 */
app.get('/api/kadry', async (req, res) => {
  const projekt = String(req.query.projekt || '');
  if (!projekt.trim()) return res.status(400).json({ error: 'Podaj projekt.' });
  try {
    res.json({ projekt, kadry: await kadryProdukcji(projekt) });
  } catch (err: any) {
    res.status(502).json({ error: String(err?.message ?? err) });
  }
});

/** Co Jajo wykulo do tej pory. */
app.get('/api/kreacje', async (_req, res) => {
  res.json({ kreacje: await wczytajKreacje() });
});

/**
 * WYKUJ kreację z kadru.
 *
 * ⚠️ Trwa minuty: Jajo najpierw PATRZY (model widzenia), potem PROJEKTUJE
 * (krawiec). Na 6 GB karty z offloadem to łącznie kilka minut na sztukę.
 */
app.post('/api/wykuj', async (req, res) => {
  const { projekt, kadrId } = req.body ?? {};
  if (!projekt || !kadrId) return res.status(400).json({ error: 'Podaj projekt i kadrId.' });
  try {
    res.json(await wykuj({ projekt, kadrId }));
  } catch (err: any) {
    console.warn('[Jajo mody] nie dało rady:', err?.message);
    res.status(422).json({ error: String(err?.message ?? err) });
  }
});

app.get('/api/krawiec/stan', async (_req, res) => {
  const lokalny = await stanKrawca();
  res.json({
    lokalny,
    chmura: { wlaczona: CHMURA_WLACZONA, maKlucz: Boolean(process.env.GEMINI_API_KEY) },
    // ⚠️ Szablon NIE jest silnikiem AI i tak jest opisany.
    szablon: { zawszeDostepny: true, uwaga: 'Składanka z gotowych zwrotów, nie projekt AI.' },
  });
});

app.get('/api/katalog', (req, res) => {
  try {
    const katalogPath = path.resolve(process.cwd(), 'OtakOs_Fashion', 'katalog.json');
    if (fs.existsSync(katalogPath)) {
      const data = fs.readFileSync(katalogPath, 'utf8');
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: 'Katalog not found on server' });
  } catch (err: any) {
    console.error('Error reading katalog:', err);
    return res.status(500).json({ error: 'Failed to read catalog' });
  }
});

// 3. AI Garment Stylist & Prompt Synthesizer
app.post('/api/generate-garment', async (req, res) => {
  const { scenePrompt, archetype = 'Solita', anomalyType = 'Spatial Crack', customNotes } = req.body;

  if (!scenePrompt) {
    return res.status(400).json({ error: 'Scene prompt is required' });
  }

  // ── 1. KRAWIEC LOKALNY — droga domyślna ─────────────────────────────
  try {
    const k = await zaprojektujLokalnie({ scenePrompt, archetype, anomalyType, customNotes });
    return res.json({
      id: `SOLLET-SYNTH-${Date.now().toString().slice(-4)}`,
      keyframe: 0,
      phase: 'Synthesized Couture Extension',
      scenePrompt,
      ...k,
      tags: [archetype, anomalyType, 'AI-Synthesized', '0.00G', 'SOLLET'],
    });
  } catch (err: any) {
    // ⚠️ Powód ZAPISUJEMY i oddajemy dalej. Cicha ucieczka do szablonu sprawia,
    // że Suweren nie wie, czy dostał projekt, czy składankę z gotowych zwrotów.
    console.warn('[Krawiec lokalny] nie dał rady:', err?.message);
    (res.locals as Record<string, unknown>).powodLokalny = String(err?.message ?? err);
  }

  // ── 2. CHMURA — tylko na wyraźny wybór ─────────────────────────
  const ai = CHMURA_WLACZONA ? getGenAI() : null;

  if (ai) {
    try {
      const systemInstruction = `You are the Chief Digital Stylist and Visionary Architect for "OtakOS Fashion" — a high-concept, cyber-alchemical haute couture line born inside the 0.00G OtakOS Cathedral.
Your domain spans digital textiles, glitch aesthetic, spatial geometry, and reactive garments that respond to environmental physics.

The visual language is defined by:
- Dynamic physics glitches (wavy lines, green & blue digital anomalies, spatial cracks)
- Deep absorption black contrasted with surgical neon greens (#00FF66), sharp blues (#0055FF), and warm alchemical oranges (#FF5500)
- Fluid, shifting silhouettes (Solita = rigid, architectural, tension drapes, crystalline vs. Molita = amorphous, liquid mercury, fluid, dissolved boundary)
- 0.00G sovereign aesthetic. No generic corporate fashion buzzwords.

Translate the input scene description (environmental physics) into:
1. DESCRIPTIVE GARMENT ANALYSIS (materials, cuts, light reflection, cybernetic weaving, structural tension, colorway).
2. HIGH-FASHION IMAGE PROMPT for Flux / Midjourney v6 focusing strictly on the CLOTHING, OUTFITS, and FABRIC TEXTURES matching the OtakOS Fashion aesthetic.`;

      const promptContent = `INPUT SCENE PHYSICS: "${scenePrompt}"
TARGET ARCHETYPE: ${archetype}
ANOMALY FOCUS: ${anomalyType}
ADDITIONAL NOTES: ${customNotes || 'None'}

Translate this into an OtakOS Fashion couture masterpiece. Return structured JSON with:
- title: Avant-garde piece title
- archetype: "${archetype}"
- anomalyType: "${anomalyType}"
- fashionConcept: Deep aesthetic explanation translating the scene physics into garment philosophy
- garmentMechanics:
  - materials: specific high-tech, cyber-alchemical textiles
  - cutsAndSilhouette: structural 0.00G tailoring, proportions, floating elements
  - lightReflection: specular properties, light-absorption, luminescent piping
  - cyberneticWeaving: micro-electronics, piezoelectric fibers, conductive yarns
  - structuralTension: tension wires, magnetic rings, zero-G counter-balances
  - colorway: exact colorway with deep absorption black, surgical greens, sharp blues, or alchemical oranges
- imagePrompt: Ultra-detailed runway/lookbook prompt optimized for Midjourney v6 / Flux.1 focusing strictly on fashion, textures, materials, and lighting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              archetype: { type: Type.STRING },
              anomalyType: { type: Type.STRING },
              fashionConcept: { type: Type.STRING },
              garmentMechanics: {
                type: Type.OBJECT,
                properties: {
                  materials: { type: Type.STRING },
                  cutsAndSilhouette: { type: Type.STRING },
                  lightReflection: { type: Type.STRING },
                  cyberneticWeaving: { type: Type.STRING },
                  structuralTension: { type: Type.STRING },
                  colorway: { type: Type.STRING },
                },
                required: [
                  'materials',
                  'cutsAndSilhouette',
                  'lightReflection',
                  'cyberneticWeaving',
                  'structuralTension',
                  'colorway',
                ],
              },
              imagePrompt: { type: Type.STRING },
            },
            required: ['title', 'archetype', 'anomalyType', 'fashionConcept', 'garmentMechanics', 'imagePrompt'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        id: `SOLLET-SYNTH-${Date.now().toString().slice(-4)}`,
        keyframe: 0,
        phase: 'Synthesized Couture Extension',
        scenePrompt,
        ...parsed,
        silnik: 'gemini-3.8-flash (CHMURA)',
        tags: [archetype, anomalyType, 'AI-Synthesized', '0.00G', 'SOLLET'],
      });
    } catch (err: any) {
      console.error('Gemini synthesis error:', err);
      // Fall through to algorithmic synthesis engine
    }
  }

  // ── 3. SZABLON — OSTATNIA DESKA, I TAK OZNACZONA ───────────────────
  //
  // ⚠️ TO NIE JEST PROJEKT AI, tylko składanka z gotowych zwrotów. Szablon
  // z AI Studio nazywał to „guaranteed instant responsiveness” i oddawał
  // NIEODRÓŻNIALNIE od odpowiedzi modelu — więc nie dawało się poznać, czy
  // cokolwiek zaprojektowało. Pole `silnik` mówi teraz prawdę, a `powodLokalny`
  // niesie powód, dla którego krawiec nie dał rady.
  const syntheticId = `SOLLET-SYNTH-${Date.now().toString().slice(-4)}`;
  const isSolita = archetype === 'Solita';
  const isMolita = archetype === 'Molita';

  const synthesized = {
    // ⚠️ Jawny podpis — galeria ma pokazać, że to składanka, nie projekt AI.
    silnik: 'szablon (NIE AI)',
    id: syntheticId,
    keyframe: 0,
    title: `${archetype} ${anomalyType.toUpperCase()} Transmuted Kinetic Vestment`,
    archetype,
    phase: 'Synthesized Couture Extension',
    anomalyType,
    scenePrompt,
    fashionConcept: `Translating the input physics into a sovereign ${archetype} archetype: The garment deconstructs ${anomalyType} vectors through ${
      isSolita
        ? 'pre-stressed carbon fiber bones, cantilevered zero-G shoulder mandibles, and hyper-dense light-trapping micro-velvet'
        : isMolita
        ? 'liquid mercury micro-organza, continuous amorphous boundary dissolution, and wave-interference moiré gradients'
        : 'the dual harmonization of rigid tectonic breastplate armor with floating gossamer mist tendrils'
    }.`,
    garmentMechanics: {
      materials:
        'Vantablack carbon micro-velvet, liquid memory Nitinol wireframe, fluoropolymer glass organza, piezoelectric graphene yarn.',
      cutsAndSilhouette: `${
        isSolita
          ? 'Asymmetric origami column sheath with detached levitating shoulder horns suspended by negative-gravity polarity.'
          : 'Morphing amorphous capelet cascading into hundreds of individually levitating carbon-silk micro-streamers.'
      } Engineered for 0.00G suspension without hem droop.`,
      lightReflection:
        'Total light absorption on core panels contrasted with sharp surgical neon green specular glint along bias seams.',
      cyberneticWeaving:
        'Sub-dermal micro-coaxial conductive ribbons running along spine tension lines; 60Hz electrostatic pulse mesh.',
      structuralTension:
        'High-tensile fluorocarbon monofilaments maintaining floating collar geometry in zero-gravity equilibrium.',
      colorway:
        'Deep Absorption Black (#040508), Surgical Neon Green (#00FF66), Sharp Void Blue (#0055FF), Scorched Alchemical Calx Orange (#FF5500).',
    },
    imagePrompt: `Editorial haute couture runway photograph from OtakOS Fashion "SOLLET" collection, custom piece ${syntheticId} (${archetype} Archetype). Full-body avant-garde fashion showcase featuring a zero-gravity garment responding to ${anomalyType}: ${
      isSolita ? 'architectural asymmetric carbon sheath with levitating collar' : 'fluid undulating liquid-crystal organza robe'
    }. Constructed from Vantablack carbon micro-velvet, liquid memory Nitinol wireframe, fluoropolymer glass organza. Color palette strictly deep light-absorbing absorption black contrasted with surgical neon green and void blue anomalies. Hyper-detailed macro textile weave, liquid-metal reflections, zero-gravity levitating fabric layers floating in perfect suspension. Hasselblad H6D-100c, 85mm f/1.4 lens, dramatic chiaroscuro studio lighting, hyper-realistic, 8k resolution, Vogue Italia cyber-couture editorial. --ar 3:4 --style raw --v 6.0`,
    tags: [archetype, anomalyType, 'Algorithmic-Synthesized', '0.00G', 'SOLLET'],
  };

  return res.json(synthesized);
});

// Vite middleware in dev, static serving in prod
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OtakOS Fashion server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic();
