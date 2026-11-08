/**
 * 🛍️🖨️ Bestsellery Printful (Suweren 2026-11-07: „naklejki, plakaty, canvas, magnesy, etui, czapka + 7 produktów All-Over Print”).
 *
 * Tabela produktów z PRAWDZIWEGO katalogu Printful (publiczne `GET https://api.printful.com/products/<id>`, 2026-11-07):
 * numer produktu, miejsca nadruku (`placement`) i numery wariantów; miejsca i wymiary sprawdzone 2026-11-07 na API z tokenem
 * (`/mockup-generator/printfiles`). Tabela = zapas: wymiary px są ORIENTACYJNE
 * (`zrodlo: 'orientacyjne'`) — dokładne podaje dopiero `GET /mockup-generator/printfiles/<id>` z tokenem
 * (most → `/api/printful/printfiles/<id>`); generator rysuje każdy plik od nowa w tym rozmiarze.
 *
 * All-Over Print (`aop: true`) Printful szyje z BIAŁEJ belki — plik nie może mieć przezroczystości: każdy arkusz
 * wypełnia ciemne katedralne tło #0b0c10 ze złotą siatką/konstelacją 0.00G, postać na środku panelu głównego.
 */
import { aureola, losowe, plotno, postac, rozlej, tekstSrodek, zawin, naszywkaPostaci, plecy, type Paleta, type TekstKolekcji } from './kompozycja360';

export const TLO = '#0b0c10', ZLOTO = '#d4a853', KREM = '#f4f1ea';
const PAL: Paleta = { tusz: KREM, zloto: ZLOTO, akcent: '#34d399', cien: 'rgba(212,168,83,0.30)' };

export type Rysunek = 'naklejka-postac' | 'naklejka-naszywka' | 'plakat' | 'magnes' | 'zderzak' | 'etui' | 'czapka' | 'aop-glowny' | 'aop-plecak' | 'aop-tyl' | 'aop-pas' | 'aop-tlo';
export interface MiejsceDruku { placement: string; nazwa: string; w: number; h: number; rysunek: Rysunek }
export interface WariantPF { wartosc: string; variantId: number; cenaEur: number; miejsca?: MiejsceDruku[] }
export interface ProduktPF {
  klucz: string; katalogId: number; nazwaPrintful: string; nazwa: string; typ: string; aop: boolean;
  opcja: 'Size' | 'Color' | 'Model' | 'Title'; miejsca: MiejsceDruku[]; warianty: WariantPF[]; uwaga?: string;
}

const m = (placement: string, nazwa: string, w: number, h: number, rysunek: Rysunek): MiejsceDruku => ({ placement, nazwa, w, h, rysunek });
const rozm = (pary: [string, number][], cena: (r: string) => number): WariantPF[] => pary.map(([wartosc, variantId]) => ({ wartosc, variantId, cenaEur: cena(wartosc) }));

/** 13 bestsellerów + naklejki z naszywką. Ceny = PROPOZYCJA Katedry (EUR, do zmiany przed importem) — koszt Printful w USD jest w katalogu. */
export const PRODUKTY_PF: ProduktPF[] = [
  { klucz: 'naklejki', katalogId: 358, nazwaPrintful: 'Kiss-Cut Stickers', nazwa: 'Kiss-Cut Sticker', typ: 'Stickers', aop: false, opcja: 'Size',
    miejsca: [m('default', 'naklejka (postać, wycięta)', 1650, 1650, 'naklejka-postac')],
    warianty: rozm([['3″×3″', 10163], ['4″×4″', 10164], ['5.5″×5.5″', 10165]], (r) => ({ '3″×3″': 5.9, '4″×4″': 6.9 } as Record<string, number>)[r] ?? 7.9) },
  { klucz: 'naklejki-naszywka', katalogId: 358, nazwaPrintful: 'Kiss-Cut Stickers', nazwa: 'Patch Sticker', typ: 'Stickers', aop: false, opcja: 'Size',
    miejsca: [m('default', 'naklejka (naszywka chenille)', 1650, 1650, 'naklejka-naszywka')],
    warianty: rozm([['3″×3″', 10163], ['4″×4″', 10164], ['5.5″×5.5″', 10165]], (r) => ({ '3″×3″': 5.9, '4″×4″': 6.9 } as Record<string, number>)[r] ?? 7.9) },
  { klucz: 'plakat', katalogId: 1, nazwaPrintful: 'Enhanced Matte Paper Poster (in)', nazwa: 'Story Poster', typ: 'Posters', aop: false, opcja: 'Size',
    miejsca: [m('default', 'plakat 18×24″', 5400, 7200, 'plakat')],
    warianty: [{ wartosc: '18″×24″', variantId: 1, cenaEur: 39 },
      { wartosc: 'A2 (16.5″×23.3″)', variantId: 19528, cenaEur: 37, miejsca: [m('default', 'plakat A2', 4950, 6990, 'plakat')] }] },
  { klucz: 'canvas', katalogId: 3, nazwaPrintful: 'Canvas (in)', nazwa: 'Story Canvas', typ: 'Wall Art', aop: false, opcja: 'Size',
    miejsca: [m('default', 'canvas 18×24″ (z zawinięciem — tło do brzegu)', 5400, 7200, 'plakat')],
    warianty: [{ wartosc: '18″×24″', variantId: 7, cenaEur: 89 }] },
  { klucz: 'magnes', katalogId: 874, nazwaPrintful: 'Car Magnets', nazwa: 'Car Magnet', typ: 'Car Magnets', aop: false, opcja: 'Size',
    uwaga: 'Naklejek na zderzak (Bumper Stickers) nie ma w katalogu Printful 2026-11-07 — format zderzakowy to magnes 10″×3″.',
    miejsca: [m('front', 'magnes 7.5×4.5″', 2475, 1575, 'magnes')],
    warianty: [{ wartosc: '7.5″×4.5″', variantId: 22712, cenaEur: 14.9 },
      { wartosc: '10″×3″', variantId: 22711, cenaEur: 14.9, miejsca: [m('front', 'magnes zderzakowy 10×3″', 3000, 900, 'zderzak')] }] },
  { klucz: 'etui-iphone', katalogId: 181, nazwaPrintful: 'Clear Case for iPhone®', nazwa: 'Clear iPhone Case', typ: 'Phone Cases', aop: false, opcja: 'Model',
    uwaga: 'Jeden pionowy plik na wszystkie modele; Printful dopasowuje go do szablonu modelu (dokładne wymiary z tokenem).',
    miejsca: [m('default', 'plecki etui (pion)', 879, 1830, 'etui')],
    warianty: rozm([['iPhone 15', 17616], ['iPhone 15 Pro', 17618], ['iPhone 16', 20290], ['iPhone 16 Pro', 20292], ['iPhone 17', 33993], ['iPhone 17 Pro', 33995]], () => 29) },
  { klucz: 'czapka-trucker', katalogId: 252, nazwaPrintful: 'Retro Trucker Hat | Yupoong 6606', nazwa: 'Retro Trucker Hat', typ: 'Hats', aop: false, opcja: 'Color',
    uwaga: 'Haft: płaskie kolory (złoto + krem), bez zdjęcia postaci — maszyna hafciarska nie wyszyje fotografii.',
    miejsca: [m('embroidery_front_large', 'haft z przodu', 1770, 600, 'czapka')],
    warianty: rozm([['Black', 8747], ['Charcoal/ Black', 16709]], () => 34) },
  { klucz: 'aop-plecak', katalogId: 279, nazwaPrintful: 'All-Over Print Backpack', nazwa: 'All-Over Backpack', typ: 'Bags', aop: true, opcja: 'Title',
    miejsca: [m('front', 'przód z kieszenią', 2175, 3075, 'aop-plecak'), m('top', 'góra', 4200, 1200, 'aop-tlo'), m('bottom', 'dół', 4200, 750, 'aop-tlo'), m('pocket', 'kieszeń', 1950, 1200, 'aop-pas')],
    warianty: [{ wartosc: 'One size', variantId: 9063, cenaEur: 89 }] },
  { klucz: 'aop-sukienka', katalogId: 896, nazwaPrintful: 'All-Over Print Slip Dress', nazwa: 'All-Over Slip Dress', typ: 'Dresses', aop: true, opcja: 'Size',
    miejsca: [m('front', 'przód', 5100, 6900, 'aop-glowny'), m('back', 'tył', 5100, 6900, 'aop-tyl')],
    warianty: rozm([['XS', 22904], ['S', 22906], ['M', 22908], ['L', 22910], ['XL', 22912], ['2XL', 22914]], (r) => (r === '2XL' ? 82 : 79)) },
  { klucz: 'aop-koszulka', katalogId: 257, nazwaPrintful: "All-Over Print Men's Crew Neck T-Shirt", nazwa: 'All-Over Tee', typ: 'T-Shirts', aop: true, opcja: 'Size',
    miejsca: [m('default', 'przód', 4200, 5400, 'aop-glowny'), m('back', 'tył', 4200, 5400, 'aop-tyl'), m('sleeve_left', 'rękaw lewy', 3000, 1800, 'aop-pas'), m('sleeve_right', 'rękaw prawy', 3000, 1800, 'aop-pas')],
    warianty: rozm([['XS', 8850], ['S', 8851], ['M', 8852], ['L', 8853], ['XL', 8854], ['2XL', 8855]], (r) => (r === '2XL' ? 52 : 49)) },
  { klucz: 'aop-bomber', katalogId: 390, nazwaPrintful: 'All-Over Print Unisex Bomber Jacket', nazwa: 'All-Over Bomber Jacket', typ: 'Jackets', aop: true, opcja: 'Size',
    miejsca: [m('front', 'przód', 4650, 5400, 'aop-glowny'), m('back', 'tył', 4650, 5400, 'aop-tyl'), m('sleeve_left', 'rękaw lewy', 4650, 5400, 'aop-pas'), m('sleeve_right', 'rękaw prawy', 4650, 5400, 'aop-pas'), m('details', 'ściągacze i kołnierz', 7950, 2700, 'aop-tlo')],
    warianty: rozm([['XS', 10877], ['S', 10878], ['M', 10879], ['L', 10880], ['XL', 10881], ['2XL', 10882], ['3XL', 10883]], (r) => (r === '2XL' || r === '3XL' ? 125 : 119)) },
  { klucz: 'aop-torba', katalogId: 84, nazwaPrintful: 'All-Over Print Tote Bag', nazwa: 'All-Over Tote Bag', typ: 'Bags', aop: true, opcja: 'Title',
    miejsca: [m('default', 'obie strony torby', 2550, 2475, 'aop-glowny')],
    warianty: [{ wartosc: '15″×15″', variantId: 4533, cenaEur: 39 }] },
  { klucz: 'aop-poduszka', katalogId: 214, nazwaPrintful: 'All-Over Print Premium Pillow', nazwa: 'Premium Pillow', typ: 'Home Decor', aop: true, opcja: 'Size',
    miejsca: [m('front', 'przód', 2850, 2850, 'aop-glowny'), m('back', 'tył', 2850, 2850, 'aop-tyl')],
    warianty: [{ wartosc: '18″×18″', variantId: 9515, cenaEur: 49 }] },
  { klucz: 'aop-flaga', katalogId: 490, nazwaPrintful: 'All-Over Print Flag', nazwa: 'Cathedral Flag', typ: 'Home Decor', aop: true, opcja: 'Title',
    miejsca: [m('front', 'flaga (poziom)', 9150, 5700, 'aop-glowny')],
    warianty: [{ wartosc: 'One size', variantId: 12584, cenaEur: 49 }] },
];

/** Miejsca druku wariantu (własne wariantu albo produktu). */
export const miejscaWariantu = (p: ProduktPF, w: WariantPF) => w.miejsca ?? p.miejsca;
/** Nazwa pliku: `<placement>-<w>x<h>.png` — ten sam plik dla wariantów o tym samym miejscu i rozmiarze. */
export const nazwaPliku = (mi: MiejsceDruku) => `${mi.placement}-${mi.w}x${mi.h}.png`;

// ══════════ RYSOWANIE ══════════

/** Ciemne katedralne tło: poświata, złota siatka, konstelacje i runy — pełne krycie (All-Over Print). */
export function tloKatedry(g: CanvasRenderingContext2D, W: number, H: number, ziarno: string) {
  const los = losowe(`${ziarno}-tlo`), S = Math.max(W, H), krok = S / 14;
  g.fillStyle = TLO; g.fillRect(0, 0, W, H);
  const pg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, S * 0.7);
  pg.addColorStop(0, 'rgba(212,168,83,0.10)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = pg; g.fillRect(0, 0, W, H);
  // siatka (romby) — cienka złota nić
  g.strokeStyle = ZLOTO; g.globalAlpha = 0.13; g.lineWidth = Math.max(1, S * 0.0009);
  g.beginPath();
  for (let k = -H; k < W + H; k += krok) { g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k, H); g.lineTo(k + H, 0); }
  g.stroke();
  // konstelacje
  g.globalAlpha = 1;
  const n = Math.round((W * H) / (krok * krok) * 1.4);
  let poprz: [number, number] | null = null;
  for (let i = 0; i < n; i++) {
    const x = los() * W, y = los() * H, r = S * (0.0012 + los() * 0.0022);
    g.fillStyle = los() > 0.75 ? KREM : ZLOTO; g.globalAlpha = 0.45 + los() * 0.45;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (poprz && los() > 0.55 && Math.hypot(x - poprz[0], y - poprz[1]) < krok * 2.2) {
      g.strokeStyle = ZLOTO; g.globalAlpha = 0.28; g.lineWidth = Math.max(1, S * 0.0007);
      g.beginPath(); g.moveTo(...poprz); g.lineTo(x, y); g.stroke();
    }
    poprz = [x, y];
  }
  // rzadkie znaki 0.00G
  g.globalAlpha = 0.16; g.fillStyle = ZLOTO; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${Math.round(krok * 0.32)}px Cinzel, Georgia, serif`;
  for (let y = krok; y < H; y += krok * 2.5) for (let x = (y / krok) % 2 ? krok : krok * 2.2; x < W; x += krok * 2.5) g.fillText('0.00G', x, y);
  g.globalAlpha = 1;
}

/** Ten sam rozmiar kanwy co plik — postać zawsze mieści się w polu (wycentrowana). */
function plakatPelny(m: HTMLCanvasElement, t: TekstKolekcji, ziarno: string, W: number, H: number) {
  const c = plotno(W, H), g = c.getContext('2d')!;
  tloKatedry(g, W, H, ziarno);
  // `plecy()` ma układ 4:5 — rysujemy go w polu o tych proporcjach, wyśrodkowanym (plakat 3:4, A2 ~0.71)
  const pw = Math.min(W, H * 0.8), ph = pw / 0.8;
  const p = plecy(m, t, PAL, ziarno, Math.round(pw), Math.round(ph));
  g.drawImage(p, (W - pw) / 2, (H - ph) / 2);
  return c;
}

function naklejkaPostaci(m: HTMLCanvasElement, W: number, H: number) {
  const c = plotno(W, H), g = c.getContext('2d')!;
  const S = Math.min(W, H), s = Math.min((S * 0.82) / m.width, (S * 0.82) / m.height);
  const p = plotno(Math.round(m.width * s), Math.round(m.height * s));
  const pg = p.getContext('2d')!; pg.imageSmoothingQuality = 'high'; pg.drawImage(m, 0, 0, p.width, p.height);
  // twarda alfa → czysta linia cięcia kiss-cut
  const d = pg.getImageData(0, 0, p.width, p.height); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; pg.putImageData(d, 0, 0);
  const r = Math.round(S * 0.035), biala = rozlej(p, r, '#ffffff');
  g.drawImage(biala, (W - biala.width) / 2, (H - biala.height) / 2);
  g.drawImage(p, (W - p.width) / 2, (H - p.height) / 2);
  return c;
}

function wpasuj(g: CanvasRenderingContext2D, src: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / src.width, h / src.height);
  g.drawImage(src, x + (w - src.width * s) / 2, y + (h - src.height * s) / 2, src.width * s, src.height * s);
}

/** Medalion postaci w aureoli (bez tła) — do magnesów, etui, paneli AOP. */
function medalion(m: HTMLCanvasElement, ziarno: string, S: number) {
  const c = plotno(S, S), g = c.getContext('2d')!;
  aureola(g, S / 2, S / 2, S * 0.44, PAL, losowe(ziarno));
  postac(g, m, S / 2, S * 0.52, S * 0.72, S * 0.8);
  return c;
}

export function rysujPlik(r: Rysunek, W: number, H: number, mot: HTMLCanvasElement, t: TekstKolekcji, imie: string, ziarno: string): HTMLCanvasElement {
  const IMIE = imie.toUpperCase();
  if (r === 'naklejka-postac') return naklejkaPostaci(mot, W, H);
  if (r === 'naklejka-naszywka') { const c = plotno(W, H); wpasuj(c.getContext('2d')!, naszywkaPostaci(mot, 2400), W * 0.04, H * 0.04, W * 0.92, H * 0.92); return c; }
  if (r === 'plakat') return plakatPelny(mot, t, ziarno, W, H);
  const c = plotno(W, H), g = c.getContext('2d')!;
  if (r === 'czapka') {
    // haft: przezroczyste tło, dwa kolory nici, grube litery
    tekstSrodek(g, '0.00G', W / 2, H * 0.4, `900 ${H * 0.62}px Graduate, Cinzel, serif`, ZLOTO, W * 0.01, W * 0.96);
    tekstSrodek(g, `${IMIE} · STYLE`, W / 2, H * 0.86, `800 ${H * 0.2}px Cinzel, Georgia, serif`, KREM, W * 0.006, W * 0.9);
    return c;
  }
  tloKatedry(g, W, H, ziarno);
  if (r === 'aop-tlo') return c;
  if (r === 'magnes' || r === 'zderzak') {
    // margines bezpieczeństwa: Printful przycina brzeg magnesu (2026-11-07 mockup: „0.00G STYLE” ucięte z prawej) — treść ≥ 7 % od krawędzi
    const M = Math.max(W, H) * 0.07;
    const S = Math.min(H - M * 1.2, W * 0.4);
    g.drawImage(medalion(mot, ziarno, Math.round(S)), M, (H - S) / 2, S, S);
    const x0 = M + S + W * 0.03, sz = W - x0 - M, cx = x0 + sz / 2;
    if (r === 'zderzak') {
      tekstSrodek(g, `0.00G · ${IMIE}`, cx, H * 0.42, `900 ${H * 0.3}px Cinzel, Georgia, serif`, KREM, W * 0.004, sz);
      tekstSrodek(g, 'WEARABLE STORIES', cx, H * 0.74, `600 ${H * 0.14}px Cinzel, Georgia, serif`, ZLOTO, W * 0.006, sz);
    } else {
      tekstSrodek(g, '0.00G STYLE', cx, H * 0.3, `900 ${H * 0.16}px Cinzel, Georgia, serif`, ZLOTO, W * 0.004, sz);
      tekstSrodek(g, IMIE, cx, H * 0.52, `900 ${H * 0.2}px Cinzel, Georgia, serif`, KREM, W * 0.004, sz);
      tekstSrodek(g, (t.podtytul || 'Wearable Stories').toUpperCase(), cx, H * 0.74, `600 ${H * 0.065}px Cinzel, Georgia, serif`, ZLOTO, W * 0.002, sz);
    }
    return c;
  }
  if (r === 'etui') {
    const S = W * 0.92;
    g.drawImage(medalion(mot, ziarno, Math.round(S)), (W - S) / 2, H * 0.22, S, S);
    tekstSrodek(g, IMIE, W / 2, H * 0.76, `900 ${W * 0.13}px Cinzel, Georgia, serif`, KREM, W * 0.01, W * 0.86);
    tekstSrodek(g, '0.00G STYLE', W / 2, H * 0.83, `600 ${W * 0.06}px Cinzel, Georgia, serif`, ZLOTO, W * 0.01, W * 0.8);
    return c;
  }
  if (r === 'aop-pas') {
    // rękaw / kieszeń: pas z napisem wzdłuż dłuższego boku
    const pion = H > W;
    g.save(); g.translate(W / 2, H / 2); if (pion) g.rotate(-Math.PI / 2);
    const L = pion ? H : W, K = pion ? W : H;
    tekstSrodek(g, `0.00G STYLE  ✦  ${IMIE}`, 0, 0, `800 ${K * 0.16}px Cinzel, Georgia, serif`, ZLOTO, K * 0.03, L * 0.86);
    g.restore();
    return c;
  }
  if (r === 'aop-tyl') {
    // tył: opowieść w karcie, mniejszy medalion u góry
    // wszystko w pasach liczonych od wysokości: medalion 8–50 %, tytuł, opowieść do 84 %, cytat 91 % — nic się nie nakłada
    const k = Math.min(W, H * 0.78), S = Math.min(W * 0.6, H * 0.42);
    g.drawImage(medalion(mot, `${ziarno}-tyl`, Math.round(S)), (W - S) / 2, H * 0.08, S, S);
    const yT = H * 0.08 + S + k * 0.06;
    tekstSrodek(g, (t.tytul || IMIE).toUpperCase(), W / 2, yT, `900 ${k * 0.07}px Cinzel, Georgia, serif`, KREM, k * 0.008, W * 0.86);
    g.font = `400 ${k * 0.03}px "Plus Jakarta Sans", Georgia, serif`; g.fillStyle = KREM; g.textAlign = 'center'; g.textBaseline = 'middle';
    const krok = k * 0.042, y0 = yT + k * 0.08, miejsc = Math.max(1, Math.floor((H * 0.84 - y0) / krok) + 1);
    const linie = zawin(g, t.opowiesc || '', W * 0.7).slice(0, Math.min(6, miejsc));
    linie.forEach((l, i) => g.fillText(l, W / 2, y0 + i * krok));
    if (t.cytat) tekstSrodek(g, `„${t.cytat}”`, W / 2, H * 0.91, `italic 400 ${k * 0.03}px Georgia, serif`, ZLOTO, 0, W * 0.86);
    return c;
  }
  if (r === 'aop-plecak') {
    // „Front & Pocket” Printful: dolna część pliku to naszyta kieszeń z zamkiem — pas ok. 52–61 % wysokości chowa się
    // pod jej krawędzią (2026-11-08 mockup: Koralik bez nóg). Postać cała nad kieszenią, imię na kieszeni.
    const S = Math.min(W * 0.84, H * 0.45);
    g.drawImage(medalion(mot, ziarno, Math.round(S)), (W - S) / 2, H * 0.035, S, S);
    tekstSrodek(g, (t.tytul || IMIE).toUpperCase(), W / 2, H * 0.76, `900 ${W * 0.1}px Cinzel, Georgia, serif`, KREM, W * 0.01, W * 0.74);
    tekstSrodek(g, '0.00G STYLE', W / 2, H * 0.84, `600 ${W * 0.045}px Cinzel, Georgia, serif`, ZLOTO, W * 0.012, W * 0.6);
    return c;
  }
  // aop-glowny: wielka postać w aureoli na środku panelu
  const S = Math.min(W, H) * 0.86;
  g.drawImage(medalion(mot, ziarno, Math.round(S)), (W - S) / 2, (H - S) / 2 - H * 0.02, S, S);
  if (H >= W) tekstSrodek(g, (t.tytul || IMIE).toUpperCase(), W / 2, (H + S) / 2 + (H - S) / 4, `900 ${Math.min(W * 0.075, (H - S) * 0.2)}px Cinzel, Georgia, serif`, KREM, W * 0.008, W * 0.86);
  return c;
}

// ══════════ LOGO I BANER SKLEPU ══════════

/** Znak: podwójny złoty krąg + „0.00G”. */
function znak(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.strokeStyle = ZLOTO; g.lineWidth = r * 0.06; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.lineWidth = r * 0.02; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.fillStyle = ZLOTO; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, r * 0.025, 0, Math.PI * 2); g.fill(); }
  tekstSrodek(g, '0.00G', cx, cy + r * 0.04, `900 ${r * 0.55}px Cinzel, Georgia, serif`, ZLOTO, r * 0.02, r * 1.5);
}

export function logoKwadrat(S: number, tlo: string | null): HTMLCanvasElement {
  const c = plotno(S, S), g = c.getContext('2d')!;
  if (tlo) { g.fillStyle = tlo; g.fillRect(0, 0, S, S); }
  znak(g, S / 2, S * 0.42, S * 0.3);
  tekstSrodek(g, 'STYLE', S / 2, S * 0.81, `800 ${S * 0.085}px Cinzel, Georgia, serif`, KREM, S * 0.03, S * 0.86);
  tekstSrodek(g, 'TeO ShoP', S / 2, S * 0.91, `500 ${S * 0.045}px "JetBrains Mono", monospace`, ZLOTO, S * 0.01, S * 0.8);
  return c;
}

export function logoPoziome(W: number, H: number, tlo: string | null): HTMLCanvasElement {
  const c = plotno(W, H), g = c.getContext('2d')!;
  if (tlo) { g.fillStyle = tlo; g.fillRect(0, 0, W, H); }
  znak(g, H * 0.55, H / 2, H * 0.4);
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = KREM; g.font = `900 ${H * 0.36}px Cinzel, Georgia, serif`; g.fillText('0.00G Style', H * 1.1, H * 0.44);
  g.fillStyle = ZLOTO; g.font = `500 ${H * 0.14}px "JetBrains Mono", monospace`; (g as any).letterSpacing = `${H * 0.03}px`;
  g.fillText('· TeO ShoP ·', H * 1.12, H * 0.76); (g as any).letterSpacing = '0px';
  return c;
}

/** Baner Open Graph 1200×628 (×skala): logo, hasło, makiety kurtek z żywych kolekcji. */
export function baner(makiety: HTMLImageElement[], skala = 1): HTMLCanvasElement {
  const W = 1200 * skala, H = 628 * skala, c = plotno(W, H), g = c.getContext('2d')!;
  tloKatedry(g, W, H, 'baner-0g');
  const lewa = W * 0.46;
  g.drawImage(logoPoziome(Math.round(lewa * 0.92), Math.round(H * 0.2), null), W * 0.05, H * 0.2);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = KREM;
  g.font = `700 ${H * 0.075}px Cinzel, Georgia, serif`;
  const linie = zawin(g, 'Wearable Stories & Private AI Avatar Dance', lewa * 0.92);
  linie.forEach((l, i) => g.fillText(l, W * 0.055, H * 0.56 + i * H * 0.095));
  g.fillStyle = ZLOTO; g.font = `500 ${H * 0.032}px "JetBrains Mono", monospace`;
  g.fillText('teo.center · scan the tag, watch your character dance', W * 0.055, H * 0.9);
  // makiety: do 3 kart, lekko obrócone
  const karty = makiety.slice(0, 3), kw = W * 0.2, kh = kw * 1.25;
  karty.forEach((img, i) => {
    const cx = W * 0.62 + i * W * 0.135, cy = H * 0.5 + (i === 1 ? -H * 0.04 : H * 0.03);
    g.save(); g.translate(cx, cy); g.rotate((i - 1) * 0.06);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24 * skala;
    g.fillStyle = '#16171d'; g.beginPath(); (g as any).roundRect(-kw / 2, -kh / 2, kw, kh, 14 * skala); g.fill(); g.shadowBlur = 0;
    g.save(); g.beginPath(); (g as any).roundRect(-kw / 2 + 6 * skala, -kh / 2 + 6 * skala, kw - 12 * skala, kh - 12 * skala, 10 * skala); g.clip();
    const s = Math.max((kw - 12 * skala) / img.naturalWidth, (kh - 12 * skala) / img.naturalHeight);
    g.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
    g.restore();
    g.strokeStyle = ZLOTO; g.lineWidth = 2 * skala; g.beginPath(); (g as any).roundRect(-kw / 2, -kh / 2, kw, kh, 14 * skala); g.stroke();
    g.restore();
  });
  return c;
}
