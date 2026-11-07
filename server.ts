import express from 'express';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { zaprojektuj as zaprojektujLokalnie, stanKrawca } from './krawiec-lokalny';
import { kadry as kadryProdukcji, projekty as projektyKatedry, wykuj, kreacje as wczytajKreacje } from './jajo-mody';
import { narysuj, lista as wczytajWizualizacje, usun as usunWizualizacje } from './wizualizacje';
import * as Kolekcje from './kolekcje';
import { lista as wczytajNadruki, motywy as motywyNadrukow, makieta as makietaUbioru, nadrukuj, usun as usunNadruk, UBIORY, KOLORY } from './nadruki';
import { przeglad } from './dozorca';
import { obroc, lista as wczytajObroty, wariantyWzoru, DLUGOSCI as DLUGOSCI_OBROTU } from './obrot';
import { lista as wczytajMarki, zapisz as zapiszMarke, usun as usunMarke, wgrajLogo, nalozLogo, wycen, ROGI } from './marki';

/**
 * ⚠️ CHMURA JEST WYŁĄCZONA DOMYŚLNIE.
 *
 * Szablon z AI Studio wołał `gemini-3.8-flash` jako PIERWSZĄ drogę. To wprost
 * kłóci się z pierwszą zasadą Katedry: „Suwerenność i lokalność. Wszystko
 * działa lokalnie, na sprzęcie Suwerena. Zero chmury jako domyślne”. Dział mody
 * nie może być wyjątkiem — tym bardziej że wysyłałby do Google opisy
 * niewydanych kolekcji.
 *
 * Chmura zostaje jako świadomy wybór: OTAKOS_FASHION_CHMURA=1 plus klucz — albo przełącznik w locie
 * (Suweren 2026-10-07: „lokalnie, a z chmury będzie korzystał, jak się przełączy na chmurę"): Hub w trybie
 * CLOUD otwiera studio z `?tryb=chmura`, panel woła POST /api/krawiec/tryb. Klucz: GEMINI_API_KEY z .env
 * albo klucz Gemini udostępniony mostowi w Kiblu (_OtakOs_Wymiar/kibel_gemini.txt Katedry obok).
 */
let CHMURA_WLACZONA = process.env.OTAKOS_FASHION_CHMURA === '1';

/** Klucz Gemini: .env studia, potem Kibel Katedry (czytany za każdym razem — nowy klucz działa bez restartu). */
function kluczGemini(): string | null {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const plik = process.env.OTAKOS_KIBEL_GEMINI || path.resolve(process.cwd(), '..', 'TeO_Genesis', '_OtakOs_Wymiar', 'kibel_gemini.txt');
  try {
    const m = fs.readFileSync(plik, 'utf8').match(/(AIza[\w-]{30,}|AQ\.[\w-]{30,})/);
    return m ? m[1] : null;
  } catch { return null; }
}
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client initialization
let genAIClient: GoogleGenAI | null = null;
let kluczKlienta: string | null = null;
function getGenAI(): GoogleGenAI | null {
  const klucz = kluczGemini();
  if (!klucz) return null;
  if (!genAIClient || kluczKlienta !== klucz) {
    kluczKlienta = klucz;
    genAIClient = new GoogleGenAI({
      apiKey: klucz,
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
    hasApiKey: Boolean(kluczGemini()),
  });
});

// 2. Fetch full SOLLET catalog
/**
 * Czym dziś projektujemy — żeby panel nie obiecywał kreacji, której nie ma jak policzyć.
 */
// ── 🧠 AI — DOZORCA ────────────────────────────────────────

/**
 * Przeglad zycia produktu.
 *
 * ⚠️ Dozorca NIC NIE URUCHAMIA — czyta stan i mówi, co stoi. Agent, który
 * sam rusza sto renderów, potrafi zająć kartę na dobę bez pytania.
 */
app.get('/api/ai/przeglad', async (_req, res) => {
  try { res.json(await przeglad()); }
  catch (err: any) { res.status(500).json({ error: String(err?.message ?? err) }); }
});

// ── 🏷️ MARKI ────────────────────────────────────────────

/**
 * Marki wraz z WYCENĄ rozbitą na składniki.
 *
 * ⚠️ Portfolio liczymy z REALNYCH plików, nie z deklaracji: ile kreacji jest
 * w katalogu, ile ma rysunek, ile jest ofirmowanych. Wycena bez policzonej
 * podstawy to liczba, w którą trzeba wierzyć.
 */
app.get('/api/marki', async (_req, res) => {
  try {
    const marki = await wczytajMarki();
    const wiz = await wczytajWizualizacje();
    const kreacje = await wczytajKreacje();

    let ofirmowanych = 0;
    try {
      const pliki = await fsp.readdir(path.join(process.cwd(), 'public', 'ofirmowane'));
      ofirmowanych = pliki.filter((f) => /\.png$/i.test(f)).length;
    } catch { /* katalog jeszcze nie istnieje — zero */ }

    const portfolio = {
      kreacji: 62 + kreacje.length,   // katalog Rady + wykute przez Krawcowa
      narysowanych: wiz.length,
      ofirmowanych,
    };

    res.json({
      marki: marki.map((m) => ({ ...m, wycena: wycen(m, portfolio) })),
      portfolio,
      rogi: Object.keys(ROGI),
    });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

app.post('/api/marki', async (req, res) => {
  try { res.json(await zapiszMarke(req.body ?? {})); }
  catch (err: any) { res.status(400).json({ error: String(err?.message ?? err) }); }
});

app.delete('/api/marki/:id', async (req, res) => {
  try { res.json(await usunMarke(req.params.id)); }
  catch (err: any) { res.status(400).json({ error: String(err?.message ?? err) }); }
});

/** Wgraj logo. Plik idzie DANYMI (base64), nie sciezka — typ rozpoznajemy po zawartosci. */
app.post('/api/marki/:id/logo', async (req, res) => {
  const { base64, nazwaPliku } = req.body ?? {};
  if (!base64) return res.status(400).json({ error: 'Brak pliku.' });
  try { res.json(await wgrajLogo(req.params.id, base64, nazwaPliku)); }
  catch (err: any) { res.status(400).json({ error: String(err?.message ?? err) }); }
});

/**
 * Nałóż logo marki na kreację — Z AUTOMATU.
 *
 * ⚠️ ORYGINAŁ ZOSTAJE NIETKNIĘTY. Wynik to nowy plik w public/ofirmowane/.
 */
/**
 * Podglad logo marki.
 *
 * ⚠️ SAMA NAZWA, nie sciezka — path.basename ucina wszystko poza nazwa pliku.
 * Sciezka z zewnatrz to zaproszenie do `../../`.
 */
app.get('/api/marki/logo/:nazwa', (req, res) => {
  const nazwa = path.basename(req.params.nazwa);
  const cel = path.join(process.cwd(), 'OtakOs_Fashion', 'logo', nazwa);
  if (!fs.existsSync(cel)) return res.status(404).send('Nie ma takiego logo.');
  res.sendFile(cel);
});

app.post('/api/marki/naloz', async (req, res) => {
  const { markaId, zrodloUrl, nazwa } = req.body ?? {};
  if (!markaId || !zrodloUrl) return res.status(400).json({ error: 'Podaj markaId i zrodloUrl.' });
  try {
    const marka = (await wczytajMarki()).find((m) => m.id === markaId);
    if (!marka) throw new Error('Nie ma takiej marki.');

    const tmp = path.join(process.cwd(), 'OtakOs_Fashion', `_tmp_${Date.now()}.png`);
    await fsp.mkdir(path.dirname(tmp), { recursive: true });
    // 👕 podgląd żywej Kolekcji 360° leży tutaj (public/nadruki/kolekcje/<id>/podglad-*.png) — bez mostu
    const lokalna = /^\/nadruki\/kolekcje\/k-[0-9a-f]{8}\/podglad-(przod|tyl)\.png$/.exec(String(zrodloUrl));
    if (lokalna) await fsp.copyFile(path.join(process.cwd(), 'public', String(zrodloUrl)), tmp);
    else {
      // Stary szkic żyje w Katedrze — ściągamy go przez most do pliku tymczasowego.
      const most = process.env.OTAKOS_MOST || 'http://127.0.0.1:3001';
      const r = await fetch(`${most}${zrodloUrl}`, { signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`Nie pobrałem kreacji: HTTP ${r.status}`);
      await fsp.writeFile(tmp, Buffer.from(await r.arrayBuffer()));
    }

    try {
      res.json(await nalozLogo({ marka, zrodlo: tmp, nazwaWynikowa: nazwa || 'kreacja' }));
    } finally {
      await fsp.unlink(tmp).catch(() => {});
    }
  } catch (err: any) {
    console.warn('[Marki] logo się nie nałożyło:', err?.message);
    res.status(422).json({ error: String(err?.message ?? err) });
  }
});

// ── 👕 NADRUKI — motywy Teterhii i Mini z Pracowni Katedry na ubraniach (nadruki.ts) ──
app.get('/api/nadruki', async (_req, res) => {
  res.json({ nadruki: await wczytajNadruki(), ubiory: UBIORY, kolory: KOLORY });
});
app.get('/api/nadruki/motywy', async (_req, res) => {
  try { res.json({ motywy: await motywyNadrukow() }); }
  catch (err: any) { res.status(502).json({ error: String(err?.message ?? err) }); }
});
/** Pusta makieta ubioru (FLUX raz, potem z pamięci) — czeka na rysunek do 20 min. */
app.post('/api/nadruki/makieta', async (req, res) => {
  try { res.json({ makieta: await makietaUbioru(req.body?.ubior, req.body?.kolor, { odNowa: req.body?.odNowa === true, strona: req.body?.strona === 'tyl' ? 'tyl' : 'przod', ziarno: Number.isInteger(req.body?.ziarno) ? req.body.ziarno : 4242 }) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.post('/api/nadruki', async (req, res) => {
  try { res.json({ nadruk: await nadrukuj(req.body ?? {}) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
// 👕🌀 Kolekcje 360° (kolekcje.ts): strefy rysuje przeglądarka (Canvas), serwer: makiety PRZÓD/TYŁ, pliki druku, arkusz, opowieść
/** Obraz motywu z Pracowni Katedry — z tego samego originu, żeby Canvas nie był „skażony” (CORS). */
app.get('/api/nadruki/motyw/:id', async (req, res) => {
  try {
    const m = (await motywyNadrukow()).find((x) => x.id === req.params.id);
    if (!m) return res.status(404).end();
    const r = await fetch(`${process.env.OTAKOS_MOST || 'http://127.0.0.1:3001'}${m.plik}`, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) return res.status(502).end();
    res.type(r.headers.get('content-type') || 'image/png').send(Buffer.from(await r.arrayBuffer()));
  } catch { res.status(502).end(); }
});
app.post('/api/nadruki/opowiesc', async (req, res) => {
  try { res.json({ tekst: await Kolekcje.opowiesc(String(req.body?.obraz ?? ''), String(req.body?.jezyk ?? 'pl'), { wzor: String(req.body?.wzor ?? ''), inne: Array.isArray(req.body?.inne) ? req.body.inne.map(String).slice(0, 12) : [] }) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.get('/api/nadruki/historia', async (req, res) => { res.json({ historia: await Kolekcje.historiaPostaci(String(req.query.imie ?? '')) }); });
// 🛍️ link kolekcji w sklepie → most Katedry (Kronikarz dokleja go do opisu filmów z tą postacią); serwer woła most bez przeglądarki = maszyna
app.put('/api/nadruki/link-sklepu', async (req, res) => {
  try {
    const r = await fetch(`${process.env.OTAKOS_MOST || 'http://127.0.0.1:3001'}/api/sklep-linki`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imie: req.body?.imie, url: req.body?.url ?? null }), signal: AbortSignal.timeout(10000) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.success === false) return res.status(r.status === 200 ? 422 : r.status).json({ error: d.message ?? `most: HTTP ${r.status}` });
    res.json(d);
  } catch (err: any) { res.status(502).json({ error: `Most Katedry nie odpowiada: ${err?.message ?? err}` }); }
});
// 🔄 Żywa paczka sklepu: po uszyciu / przeszyciu / usunięciu kolekcji paczki postaci budują się od nowa (z opóźnieniem 5 s —
// seria szycia to jedno odświeżenie), a most Katedry (Stół Produktowy) dostaje sygnał i przepisuje _OtakOs_Wymiar/sklep-shopify.
let czasOdswiezenia: ReturnType<typeof setTimeout> | null = null;
let ostatnieOdswiezenie: unknown = null;
function zaplanujOdswiezenieSklepu() {
  if (czasOdswiezenia) clearTimeout(czasOdswiezenia);
  czasOdswiezenia = setTimeout(() => {
    czasOdswiezenia = null;
    Kolekcje.odswiezSklep().then((w) => {
      ostatnieOdswiezenie = w;
      return fetch(`${process.env.OTAKOS_MOST || 'http://127.0.0.1:3001'}/api/stol-produktowy/synchronizuj`, { method: 'POST', signal: AbortSignal.timeout(60000) });
    }).catch((e) => { ostatnieOdswiezenie = { blad: String(e?.message ?? e) }; });
  }, 5000);
}
app.post('/api/nadruki/sklep/odswiez', async (_req, res) => {
  try { const w = await Kolekcje.odswiezSklep(); ostatnieOdswiezenie = w; res.json(w); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.get('/api/nadruki/sklep/stan', async (_req, res) => {
  const lista = await Kolekcje.lista();
  res.json({ postacie: Kolekcje.zywePostacie(lista).map((p) => ({ imie: p.imie, katalog: p.katalog, aktualne: p.aktualne.map((k) => ({ id: k.id, ubior: k.ubior, kolor: k.kolor, tytul: k.tekst?.tytul })), starsze: p.starsze.map((k) => ({ id: k.id, ubior: k.ubior, tytul: k.tekst?.tytul })) })),
    ceny: await Kolekcje.cenySklepu(), ostatnieOdswiezenie });
});
app.post('/api/nadruki/pakiet-sklepu', async (req, res) => {
  try { if (req.body?.ceny) await Kolekcje.zapiszCeny(req.body.ceny); res.json(await Kolekcje.pakietSklepu(req.body ?? {})); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.post('/api/nadruki/przetlumacz', async (req, res) => {
  try { res.json({ tekst: await Kolekcje.przetlumacz(req.body?.tekst, String(req.body?.jezyk ?? 'en')) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.get('/api/nadruki/kolekcje', async (_req, res) => { res.json({ kolekcje: await Kolekcje.lista(), uklady: Kolekcje.UKLADY_PRZODU, jezyki: Kolekcje.JEZYKI }); });
app.post('/api/nadruki/kolekcje', async (req, res) => {
  try { res.json({ kolekcja: await Kolekcje.nowa(req.body ?? {}) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.put('/api/nadruki/kolekcje/:id/tekst', async (req, res) => {
  try { res.json({ kolekcja: await Kolekcje.ustawTekst(req.params.id, req.body?.tekst) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.post('/api/nadruki/kolekcje/:id/strefa/:strefa', express.raw({ type: 'image/png', limit: '60mb' }), async (req, res) => {
  try { res.json({ kolekcja: await Kolekcje.wgrajStrefe(req.params.id, req.params.strefa, req.body) }); }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.post('/api/nadruki/kolekcje/:id/zloz', async (req, res) => {
  try {
    const kolekcja = await Kolekcje.zloz(req.params.id);
    // 🧵 QC szwalni poprawiła naszywki → Krawcowa melduje kanałem Mistrza (Orbita); most śpi = bez meldunku
    const qc = kolekcja.qc;
    if (qc?.poprawki.length) {
      const imie = (/[„"]([^"”]{2,30})[”"]/.exec(kolekcja.opisMotywu)?.[1] ?? '').trim();
      const nazwa = (Kolekcje.UBIORY_EN as Record<string, string>)[kolekcja.ubior] ?? kolekcja.ubior;
      const tresc = `🧵 QC szwalni: ${imie || 'kolekcja'} · ${nazwa} — poprawione strefy: ${qc.poprawki.length - qc.nieMieszcza.length} (nic poza materiałem)${qc.nieMieszcza.length ? `; nie mieszczą się: ${qc.nieMieszcza.join(', ')}` : ''}.`;
      fetch(`${process.env.OTAKOS_MOST || 'http://127.0.0.1:3001'}/api/mistrz/wiesc`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tresc, skad: 'Krawcowa · QC szwalni' }), signal: AbortSignal.timeout(5000) }).catch(() => {});
    }
    zaplanujOdswiezenieSklepu();
    res.json({ kolekcja });
  }
  catch (err: any) { res.status(422).json({ error: String(err?.message ?? err) }); }
});
app.delete('/api/nadruki/kolekcje/:id', async (req, res) => {
  try { const w = await Kolekcje.usun(req.params.id); zaplanujOdswiezenieSklepu(); res.json(w); }
  catch (err: any) { res.status(404).json({ error: String(err?.message ?? err) }); }
});
app.delete('/api/nadruki/:id', async (req, res) => {
  try { res.json({ usuniety: await usunNadruk(req.params.id) }); }
  catch (err: any) { res.status(404).json({ error: String(err?.message ?? err) }); }
});

// ── 🖌️ KREACJA — narysowana sztuka odzieży ───────────────────────

/** Co już narysowane. */
app.get('/api/wizualizacje', async (_req, res) => {
  res.json({ wizualizacje: await wczytajWizualizacje() });
});
app.post('/api/wizualizacje/usun', async (req, res) => {
  try { res.json(await usunWizualizacje(Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [])); }
  catch (err: any) { res.status(400).json({ error: String(err?.message ?? err) }); }
});

/**
 * 🏷️ Marka publicznie (dla wizytówki Katedry i teo.center): pierwsza marka z logo — nazwa, opis, adres logo.
 * Most Katedry czyta to i podaje dalej; samego pliku logo nie ma w wizytówce bez tej trasy.
 */
app.get('/api/marki/publiczna', async (_req, res) => {
  const m = (await wczytajMarki()).find((x) => x.logo);
  res.json({ marka: m ? { id: m.id, nazwa: m.nazwa, opis: m.opis, logo: `/api/marki/logo/${encodeURIComponent(path.basename(m.logo!))}` } : null });
});

// ── 🔄 OBRÓT KREACJI — prezentacja produktu, nie pokaz mody ──────────

/** Co już obrócone. */
app.get('/api/obroty', async (_req, res) => {
  res.json({ obroty: await wczytajObroty(), dlugosci: DLUGOSCI_OBROTU });
});

/**
 * Obróć narysowaną kreację (Wan 2.2 TI2V-5B, i2v).
 *
 * ⚠️ TRWA MINUTY i to POŁĄCZENIE CZEKA — tak samo jak rysowanie. Zmierzone
 * na tym sprzęcie: 49 klatek w 704×480 to ~171 s, obrót na testach 257 s.
 */
app.post('/api/obroc', async (req, res) => {
  const { id, nazwa, pod, klatek, opis } = req.body ?? {};
  if (!id || !nazwa) return res.status(400).json({ error: 'Podaj id kreacji i nazwę narysowanego pliku.' });
  try {
    res.json(await obroc({ id, nazwa, pod, klatek, opis }));
  } catch (err: any) {
    console.warn('[Obrót] nie obróciło się:', err?.message);
    res.status(422).json({ error: String(err?.message ?? err) });
  }
});

/**
 * Warianty wzoru — dalsza obróbka skupiona na SAMYM UBRANIU.
 *
 * ⚠️ NIC TU NIE LICZY. Zwracamy przepisane opisy, które front podaje potem
 * zwykłemu rysowaniu. Gdyby ta trasa udawała osobny silnik, byłaby atrapą.
 */
app.post('/api/warianty', (req, res) => {
  const { prompt, ile } = req.body ?? {};
  if (!prompt) return res.status(400).json({ error: 'Podaj opis kreacji, z którego mam zdjąć inscenizację.' });
  res.json({ warianty: wariantyWzoru(String(prompt), Number(ile) || 3), silnik: 'przepisanie opisu (NIE AI)' });
});

/**
 * Narysuj kreację z jej `imagePrompt`.
 *
 * ⚠️ TRWA MINUTY i to POLACZENIE CZEKA. Zmierzone na FLUX.2 klein: 57–407 s
 * zależnie od wolnego VRAM-u. Odpytywanie z przeglądarki co sekundę przez
 * siedem minut to setki zapytań; jedno długie połączenie jest prostsze
 * i nie gubi wyniku przy odświeżeniu karty.
 */
app.post('/api/narysuj', async (req, res) => {
  const { id, prompt, silnik, szerokosc, wysokosc, ziarno } = req.body ?? {};
  if (!id || !prompt) return res.status(400).json({ error: 'Podaj id i prompt.' });
  try {
    res.json(await narysuj({ id, prompt, silnik, szerokosc, wysokosc, ziarno }));
  } catch (err: any) {
    console.warn('[Kreacja] nie narysowało się:', err?.message);
    res.status(422).json({ error: String(err?.message ?? err) });
  }
});

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

/** Przełącznik chmury w locie (Hub w trybie CLOUD → ?tryb=chmura). Bez klucza — uczciwie: lokalnie dalej. */
app.post('/api/krawiec/tryb', (req, res) => {
  const chce = req.body?.chmura === true;
  const maKlucz = Boolean(kluczGemini());
  CHMURA_WLACZONA = chce && maKlucz;
  res.json({ wlaczona: CHMURA_WLACZONA, maKlucz, ...(chce && !maKlucz ? { powod: 'Brak klucza Gemini — wklej go w Hubie: TeO Kibel → „🔗 Udostępnij mostowi”. Projektuje dalej lokalnie.' } : {}) });
});

app.get('/api/krawiec/stan', async (_req, res) => {
  const lokalny = await stanKrawca();
  res.json({
    lokalny,
    chmura: { wlaczona: CHMURA_WLACZONA, maKlucz: Boolean(kluczGemini()) },
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
  // Przy przełączonej chmurze (Hub w trybie CLOUD, 2026-10-07) kolejność się odwraca: chmura pierwsza,
  // lokalny krawiec jako zapas, gdy chmura padnie. Bez chmury — jak dawniej: lokalnie, potem szablon.
  const sprobujLokalnie = async (): Promise<boolean> => {
    try {
      const k = await zaprojektujLokalnie({ scenePrompt, archetype, anomalyType, customNotes });
      res.json({
        id: `SOLLET-SYNTH-${Date.now().toString().slice(-4)}`,
        keyframe: 0,
        phase: 'Synthesized Couture Extension',
        scenePrompt,
        ...k,
        tags: [archetype, anomalyType, 'AI-Synthesized', '0.00G', 'SOLLET'],
      });
      return true;
    } catch (err: any) {
      // ⚠️ Powód ZAPISUJEMY i oddajemy dalej. Cicha ucieczka do szablonu sprawia,
      // że Suweren nie wie, czy dostał projekt, czy składankę z gotowych zwrotów.
      console.warn('[Krawiec lokalny] nie dał rady:', err?.message);
      (res.locals as Record<string, unknown>).powodLokalny = String(err?.message ?? err);
      return false;
    }
  };
  const ai = CHMURA_WLACZONA ? getGenAI() : null;
  if (!ai && await sprobujLokalnie()) return;

  // ── 2. CHMURA — tylko na wyraźny wybór ─────────────────────────
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
    }
    // Chmura padła (np. brak kredytów na koncie) — zanim szablon, lokalny krawiec.
    if (await sprobujLokalnie()) return;
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
