/**
 * 🛍️🖨️ Bestsellery Printful i 🏷️ marka sklepu — zapis plików, które rysuje przeglądarka (src/utils/bestsellery.ts).
 *
 *   public/nadruki/bestsellery/<postać>/<produkt>/<placement>-<w>x<h>.png   pliki druku
 *   public/nadruki/bestsellery/<postać>/produkty.json                       manifest (numery Printful, warianty, ceny, pliki)
 *   public/nadruki/bestsellery/<postać>/CZYTAJ.txt
 *   public/nadruki/brand/<plik>.png                                          logo i baner sklepu
 *
 * Most Katedry (Stół Produktowy) kopiuje to do `_OtakOs_Wymiar/sklep-shopify/<postać>/3-BESTSELLERY-PRINTFUL-I-ALL-OVER/`
 * i `sklep-shopify/brand/`, pisze `shopify-import-bestsellery.csv` i synchronizuje warianty z Printful (po SKU).
 */
import fsp from 'fs/promises';
import path from 'path';

const BAZA = path.resolve(process.cwd(), 'public', 'nadruki');
const KAT = path.join(BAZA, 'bestsellery');
const BRAND = path.join(BAZA, 'brand');
const POSTAC = /^[a-z0-9][a-z0-9-]{0,40}$/;
const PRODUKT = /^[a-z0-9][a-z0-9-]{1,40}$/;
const PLIK = /^[a-z_]{3,40}-\d{2,5}x\d{2,5}\.png$/;
const PLIK_BRAND = /^(logo-0\.00g-style(-poziome)?(-czarne)?|baner-seo-social-1200x628(@2x)?)\.png$/;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const blad = (m: string) => new Error(m);
const czyPng = (b: unknown): b is Buffer => Buffer.isBuffer(b) && b.length > 8 && b.subarray(0, 4).equals(PNG);

export async function zapiszPlik(postac: string, produkt: string, nazwa: string, dane: unknown) {
  if (!POSTAC.test(postac) || !PRODUKT.test(produkt) || !PLIK.test(nazwa)) throw blad('Zła nazwa postaci, produktu albo pliku.');
  if (!czyPng(dane)) throw blad('To nie jest PNG.');
  const kat = path.join(KAT, postac, produkt);
  await fsp.mkdir(kat, { recursive: true });
  await fsp.writeFile(path.join(kat, nazwa), dane);
  return { plik: `${produkt}/${nazwa}`, bajtow: dane.length };
}

interface WariantM { wartosc: string; variantId: number; cenaEur: number; sku: string; pliki: Record<string, string> }
interface ProduktM { klucz: string; katalogId: number; nazwaPrintful: string; tytul: string; typ: string; aop: boolean; opcja: string; uwaga?: string; warianty: WariantM[] }

/** Manifest postaci po narysowaniu: każdy plik, na który wskazuje wariant, musi leżeć na dysku. */
export async function zapiszManifest(postac: string, m: { imie?: string; zrodloWymiarow?: Record<string, string>; produkty?: ProduktM[]; kolekcja?: string }) {
  if (!POSTAC.test(postac)) throw blad('Zła nazwa postaci.');
  const produkty = Array.isArray(m?.produkty) ? m.produkty : [];
  if (!produkty.length) throw blad('Manifest bez produktów.');
  const braki: string[] = [];
  for (const p of produkty) {
    if (!PRODUKT.test(p.klucz) || !Number.isInteger(p.katalogId) || !Array.isArray(p.warianty) || !p.warianty.length) throw blad(`Zły produkt w manifeście: ${p?.klucz}`);
    for (const w of p.warianty) {
      if (!Number.isInteger(w.variantId) || !(w.cenaEur > 0) || !/^[A-Z0-9-]{3,80}$/.test(w.sku)) throw blad(`Zły wariant ${p.klucz} / ${w?.wartosc}`);
      for (const f of Object.values(w.pliki ?? {})) {
        const [prod, plik] = String(f).split('/');
        if (prod !== p.klucz || !PLIK.test(plik ?? '')) throw blad(`Zła ścieżka pliku ${f}`);
        try { await fsp.access(path.join(KAT, postac, prod, plik)); } catch { braki.push(String(f)); }
      }
    }
  }
  if (braki.length) throw blad(`Brakuje plików: ${[...new Set(braki)].slice(0, 6).join(', ')}`);
  const kat = path.join(KAT, postac);
  // narysowana część produktów = dołącz do istniejącego manifestu (pozostałe produkty zostają)
  let stary: { produkty?: ProduktM[]; zrodloWymiarow?: Record<string, string> } | null = null;
  try { stary = JSON.parse(await fsp.readFile(path.join(kat, 'produkty.json'), 'utf8')); } catch { stary = null; }
  const nowe = new Set(produkty.map((p) => p.klucz));
  const wszystkie = [...(stary?.produkty ?? []).filter((p) => !nowe.has(p.klucz)), ...produkty];
  const manifest = { postac, imie: m.imie ?? postac, kolekcja: m.kolekcja ?? null, kiedy: new Date().toISOString(), zrodloWymiarow: { ...(stary?.zrodloWymiarow ?? {}), ...(m.zrodloWymiarow ?? {}) }, produkty: wszystkie };
  await fsp.writeFile(path.join(kat, 'produkty.json'), JSON.stringify(manifest, null, 1));
  await fsp.writeFile(path.join(kat, 'CZYTAJ.txt'), czytaj(manifest), 'utf8');
  // pliki po starszych rozmiarach (np. orientacyjne → z Printful) — tylko te, na które manifest już nie wskazuje
  const uzyte = new Set(wszystkie.flatMap((p) => p.warianty.flatMap((w) => Object.values(w.pliki))));
  for (const d of await fsp.readdir(kat, { withFileTypes: true })) {
    if (!d.isDirectory() || !nowe.has(d.name)) continue;
    for (const f of await fsp.readdir(path.join(kat, d.name))) if (PLIK.test(f) && !uzyte.has(`${d.name}/${f}`)) await fsp.rm(path.join(kat, d.name, f), { force: true });
  }
  return manifest;
}

function czytaj(m: { imie: string; kiedy: string; zrodloWymiarow: Record<string, string>; produkty: ProduktM[] }) {
  const L = [
    `🛍️ 0.00G Style — bestsellery Printful dla postaci ${m.imie} (${m.kiedy.slice(0, 10)})`,
    '',
    'Każdy folder = jeden produkt Printful. Plik `<placement>-<szer>x<wys>.png` idzie w MIEJSCE NADRUKU o tej nazwie',
    '(default = przód / główne pole). Numer produktu Printful podany przy nazwie (katalog: api.printful.com/products/<numer>).',
    '',
    'ALL-OVER PRINT: pliki mają pełne ciemne tło #0b0c10 (bez przezroczystości) — Printful szyje z białej belki,',
    'przezroczyste miejsca wyszłyby białe.',
    '',
    'WYMIARY: „printful” = z API Printful (token w Skarbcu), „orientacyjne” = przed tokenem — po wklejeniu tokenu',
    'narysuj bestsellery jeszcze raz w TeO Fashion Studio, pliki dostaną dokładny rozmiar szablonu.',
    '',
    'CENY = PROPOZYCJA Katedry w EUR (koszt Printful jest w USD) — zmień w Shopify przed publikacją.',
    '',
  ];
  for (const p of m.produkty) {
    L.push(`■ ${p.tytul}  —  Printful #${p.katalogId} „${p.nazwaPrintful}”  [${m.zrodloWymiarow[String(p.katalogId)] ?? 'orientacyjne'}]`);
    if (p.uwaga) L.push(`   ⚠ ${p.uwaga}`);
    for (const w of p.warianty) L.push(`   • ${w.wartosc} · wariant ${w.variantId} · ${w.cenaEur.toFixed(2)} EUR · SKU ${w.sku} · ${Object.entries(w.pliki).map(([k, v]) => `${k}=${v.split('/')[1]}`).join(', ')}`);
    L.push('');
  }
  return L.join('\n');
}

export async function lista() {
  const out: unknown[] = [];
  for (const d of await fsp.readdir(KAT, { withFileTypes: true }).catch(() => [])) {
    if (!d.isDirectory() || !POSTAC.test(d.name)) continue;
    try { const m = JSON.parse(await fsp.readFile(path.join(KAT, d.name, 'produkty.json'), 'utf8')); out.push({ postac: d.name, imie: m.imie, kiedy: m.kiedy, produktow: m.produkty.length, zrodloWymiarow: m.zrodloWymiarow }); }
    catch { out.push({ postac: d.name, blad: 'bez manifestu (rysowanie przerwane?)' }); }
  }
  const brand = (await fsp.readdir(BRAND).catch(() => [])).filter((f) => PLIK_BRAND.test(f));
  return { bestsellery: out, brand };
}

export async function zapiszBrand(nazwa: string, dane: unknown) {
  if (!PLIK_BRAND.test(nazwa)) throw blad('Zła nazwa pliku marki.');
  if (!czyPng(dane)) throw blad('To nie jest PNG.');
  await fsp.mkdir(BRAND, { recursive: true });
  await fsp.writeFile(path.join(BRAND, nazwa), dane);
  return { plik: nazwa, bajtow: dane.length };
}
