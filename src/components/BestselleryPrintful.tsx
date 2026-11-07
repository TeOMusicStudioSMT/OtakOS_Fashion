/**
 * 🛍️🖨️ Bestsellery Printful (13 produktów + naklejki z naszywką) i 🏷️ logo + baner sklepu.
 * Rysuje przeglądarka (src/utils/bestsellery.ts), serwer zapisuje (bestsellery.ts), most Katedry kopiuje do
 * `_OtakOs_Wymiar/sklep-shopify/<postać>/3-BESTSELLERY-PRINTFUL-I-ALL-OVER/` i `sklep-shopify/brand/`.
 * Wymiary: z Printful (token w Skarbcu → most `/api/printful/printfiles/<id>`), inaczej orientacyjne z tabeli.
 */
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doPng, type TekstKolekcji } from '../utils/kompozycja360';
import { PRODUKTY_PF, miejscaWariantu, nazwaPliku, rysujPlik, logoKwadrat, logoPoziome, baner, TLO, type MiejsceDruku, type ProduktPF, type WariantPF } from '../utils/bestsellery';

const slug = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kolekcja';
interface Printfiles { success: boolean; message?: string; printfiles?: { printfile_id: number; width: number; height: number }[]; warianty?: Record<string, Record<string, number>> }

async function wyslijPng(adres: string, c: HTMLCanvasElement) {
  const r = await fetch(adres, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: await doPng(c) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
}
const obraz = (src: string) => new Promise<HTMLImageElement>((ok, nie) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => nie(new Error(`nie wczytał się ${src}`)); i.src = src; });

/** Miejsca wariantu w rozmiarach z Printful (gdy przyszły); miejsca, których Printful dla wariantu nie ma, odpadają. */
function miejscaZPrintful(p: ProduktPF, w: WariantPF, pf: Printfiles | null): { miejsca: MiejsceDruku[]; zrodlo: 'printful' | 'orientacyjne' } {
  const baza = miejscaWariantu(p, w);
  const mapa = pf?.success ? pf.warianty?.[String(w.variantId)] : null;
  if (!mapa) return { miejsca: baza, zrodlo: 'orientacyjne' };
  const out: MiejsceDruku[] = [];
  for (const mi of baza) {
    const id = mapa[mi.placement]; const f = pf!.printfiles?.find((x) => x.printfile_id === id);
    if (f) out.push({ ...mi, w: f.width, h: f.height });
  }
  return { miejsca: out.length ? out : baza, zrodlo: out.length ? 'printful' : 'orientacyjne' };
}

export function BestselleryPrintful({ imie, wyciety, tekst, makiety, kolekcja, kolor }: { imie: string; wyciety: HTMLCanvasElement | null; tekst: TekstKolekcji; makiety: string[]; kolekcja: string | null; kolor: string }) {
  const [wybrane, setWybrane] = useState<string[]>(PRODUKTY_PF.map((p) => p.klucz));
  const [praca, setPraca] = useState('');
  const [wynik, setWynik] = useState('');
  const [blad, setBlad] = useState('');
  const postac = slug(imie);

  const czcionki = () => Promise.all(['900 40px Cinzel', '700 40px Cinzel', '40px Graduate', '500 20px "JetBrains Mono"', '400 20px "Plus Jakarta Sans"'].map((f) => document.fonts.load(f).catch(() => null)));

  const rysujBestsellery = async () => {
    if (!wyciety) return;
    setBlad(''); setWynik('');
    try {
      await czcionki();
      const zrodloWymiarow: Record<string, string> = {}, produkty: unknown[] = [];
      let plikow = 0;
      for (const p of PRODUKTY_PF.filter((x) => wybrane.includes(x.klucz))) {
        setPraca(`${p.nazwa}: wymiary szablonu…`);
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
              setPraca(`${p.nazwa} · ${mi.nazwa} (${mi.w}×${mi.h})…`);
              await new Promise((r) => setTimeout(r, 0));
              const c = rysujPlik(mi.rysunek, mi.w, mi.h, wyciety, tekst, imie, `${postac}-${p.klucz}-${mi.placement}`);
              await wyslijPng(`/api/nadruki/bestsellery/${postac}/plik?produkt=${p.klucz}&nazwa=${encodeURIComponent(nazwa)}`, c);
              gotowe.add(nazwa); plikow++;
            }
            pliki[mi.placement] = `${p.klucz}/${nazwa}`;
          }
          warianty.push({ wartosc: w.wartosc, variantId: w.variantId, cenaEur: w.cenaEur, sku: `${postac}-${p.klucz}-${w.wartosc}`.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80), pliki });
        }
        zrodloWymiarow[String(p.katalogId)] = zrodlo;
        produkty.push({ klucz: p.klucz, katalogId: p.katalogId, nazwaPrintful: p.nazwaPrintful, tytul: `${imie} — ${p.nazwa} · 0.00G Style`, typ: p.typ, aop: p.aop, opcja: p.opcja, uwaga: p.uwaga, warianty });
      }
      setPraca('Manifest i kopia do Stołu Produktowego…');
      const r = await fetch(`/api/nadruki/bestsellery/${postac}/manifest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imie, kolekcja, zrodloWymiarow, produkty }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      const dokladne = Object.values(zrodloWymiarow).filter((z) => z === 'printful').length;
      setWynik(`${produkty.length} produktów, ${plikow} plików → public/nadruki/bestsellery/${postac}/ · wymiary z Printful: ${dokladne}/${produkty.length}${dokladne < produkty.length ? ' (reszta orientacyjna — wklej token Printful w Stole Produktowym i narysuj ponownie)' : ''}${d.most?.success === false || d.most?.blad ? ` · ⚠ most: ${d.most.message ?? d.most.blad}` : d.most?.bestsellery ? ` · most skopiował do sklep-shopify/${postac}/3-BESTSELLERY-PRINTFUL-I-ALL-OVER` : ' · ⚠ most nie zna jeszcze bestsellerów (stara wersja) — po restarcie mostu skopiuje je przy najbliższej synchronizacji'}`);
    } catch (e) { setBlad((e as Error).message); }
    setPraca('');
  };

  const rysujMarke = async () => {
    setBlad(''); setWynik('');
    try {
      await czcionki();
      setPraca('Logo i baner…');
      const mak = (await Promise.all(makiety.slice(0, 3).map((s) => obraz(s).catch(() => null)))).filter(Boolean) as HTMLImageElement[];
      const pliki: [string, HTMLCanvasElement][] = [
        ['logo-0.00g-style.png', logoKwadrat(2048, null)],
        ['logo-0.00g-style-czarne.png', logoKwadrat(2048, TLO)],
        ['logo-0.00g-style-poziome.png', logoPoziome(2400, 600, null)],
        ['logo-0.00g-style-poziome-czarne.png', logoPoziome(2400, 600, TLO)],
        ['baner-seo-social-1200x628.png', baner(mak, 1)],
        ['baner-seo-social-1200x628@2x.png', baner(mak, 2)],
      ];
      for (const [n, c] of pliki) await wyslijPng(`/api/nadruki/brand/${encodeURIComponent(n)}`, c);
      const d = await fetch('/api/nadruki/brand-synchronizuj', { method: 'POST' }).then((r) => r.json()).catch(() => ({ success: false, message: 'most nie odpowiada' }));
      setWynik(`Logo (4 wersje) i baner 1200×628 (+@2x, makiety: ${mak.length}) → public/nadruki/brand/${d.success === false ? ` · ⚠ ${d.message}` : d.bestsellery ? ' · most skopiował do sklep-shopify/brand/' : ' · ⚠ most (stara wersja) jeszcze nie kopiuje marki — po restarcie mostu zrobi to sam'}`);
    } catch (e) { setBlad((e as Error).message); }
    setPraca('');
  };

  return (
    <div className="space-y-2 rounded border p-3 text-xs" style={{ borderColor: '#d4a853' }}>
      <b>🖨️ Bestsellery Printful — {imie} (pliki do 3-BESTSELLERY-PRINTFUL-I-ALL-OVER)</b>
      <p className="opacity-70">All-Over Print: pełne ciemne tło #0b0c10 ze złotą siatką — bez przezroczystości (Printful szyje z białej belki). Naklejki i haft czapki — przezroczyste tło. Ceny w EUR to propozycja Katedry.{kolor !== 'czarny' ? ' Grafika bierze motyw i opowieść tej kolekcji.' : ''}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {PRODUKTY_PF.map((p) => <label key={p.klucz} title={`Printful #${p.katalogId} ${p.nazwaPrintful}${p.uwaga ? ` — ${p.uwaga}` : ''}`}>
          <input type="checkbox" checked={wybrane.includes(p.klucz)} onChange={(e) => setWybrane(e.target.checked ? [...wybrane, p.klucz] : wybrane.filter((k) => k !== p.klucz))} /> {p.aop ? '🌌 ' : ''}{p.nazwa}
        </label>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => void rysujBestsellery()} disabled={!!praca || !wyciety || !wybrane.length} className="rounded border px-3 py-1 disabled:opacity-40" style={{ borderColor: '#d4a853' }}>🖨️ Narysuj {wybrane.length} produktów dla {imie}</button>
        <button onClick={() => void rysujMarke()} disabled={!!praca} className="rounded border px-3 py-1 disabled:opacity-40" style={{ borderColor: '#d4a853' }}>🏷️ Logo + baner SEO sklepu</button>
      </div>
      {praca && <p><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />{praca}</p>}
      {wynik && <p className="text-green-400">✓ {wynik}</p>}
      {blad && <p className="text-red-400">⚠ {blad}</p>}
    </div>
  );
}
