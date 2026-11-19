/**
 * 🛍️🖨️ Bestsellery Printful (13 produktów + naklejki z naszywką) i 🏷️ logo + baner sklepu.
 * Rysuje przeglądarka (src/utils/bestsellery.ts), serwer zapisuje (bestsellery.ts), most Katedry kopiuje do
 * `_OtakOs_Wymiar/sklep-shopify/<postać>/3-BESTSELLERY-PRINTFUL-I-ALL-OVER/` i `sklep-shopify/brand/`.
 * Wymiary: z Printful (token w Skarbcu → most `/api/printful/printfiles/<id>`), inaczej orientacyjne z tabeli.
 */
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doPng, type TekstKolekcji } from '../utils/kompozycja360';
import { PRODUKTY_PF, logoKwadrat, logoPoziome, baner, TLO } from '../utils/bestsellery';
import { biegBestsellerow, slugPostaci } from '../utils/bestselleryBieg';

async function wyslijPng(adres: string, c: HTMLCanvasElement) {
  const r = await fetch(adres, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: await doPng(c) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
}
const wczytajObraz = (src: string) => new Promise<HTMLImageElement>((ok, nie) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => nie(new Error(`nie wczytał się ${src}`)); i.src = src; });

export function BestselleryPrintful({ imie, wyciety, tekst, makiety, kolekcja, kolor, obraz }: { obraz?: string; imie: string; wyciety: HTMLCanvasElement | null; tekst: TekstKolekcji; makiety: string[]; kolekcja: string | null; kolor: string }) {
  const [wybrane, setWybrane] = useState<string[]>(PRODUKTY_PF.map((p) => p.klucz));
  const [praca, setPraca] = useState('');
  const [wynik, setWynik] = useState('');
  const [blad, setBlad] = useState('');
  const postac = slugPostaci(imie);

  const czcionki = () => Promise.all(['900 40px Cinzel', '700 40px Cinzel', '40px Graduate', '500 20px "JetBrains Mono"', '400 20px "Plus Jakarta Sans"'].map((f) => document.fonts.load(f).catch(() => null)));

  const rysujBestsellery = async () => {
    if (!wyciety) return;
    setBlad(''); setWynik('');
    try {
      await czcionki();
      // bez opowieści (np. kolekcja haftowana bez karty lore) — Kronikarz pisze ją po angielsku, zanim narysujemy plakaty i tyły
      let t = tekst;
      if (!(t.opowiesc || '').trim() && obraz) {
        setPraca('Kronikarz pisze opowieść postaci (lokalny model, do kilku minut)…');
        try {
          const r = await fetch('/api/nadruki/opowiesc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ obraz, jezyk: 'en' }) });
          const d = await r.json();
          if (r.ok && d.tekst?.opowiesc) t = { ...d.tekst, ...Object.fromEntries(Object.entries(tekst).filter(([, v]) => String(v ?? '').trim())), opowiesc: d.tekst.opowiesc, cytat: tekst.cytat || d.tekst.cytat, tytul: imie };
        } catch { /* bez opowieści — plakat bez karty */ }
      }
      const b = await biegBestsellerow({ imie, wyciety, tekst: t, kolekcja, klucze: wybrane, postep: setPraca });
      const most = b.most as { success?: boolean; blad?: string; message?: string; bestsellery?: unknown } | undefined;
      setWynik(`${b.produktow} produktów, ${b.plikow} plików → public/nadruki/bestsellery/${b.postac}/ · wymiary z Printful: ${b.dokladnych}/${b.wszystkich} produktów katalogu${b.dokladnych < b.wszystkich ? ' (reszta orientacyjna — wklej token Printful w Stole Produktowym i narysuj ponownie)' : ''}${most?.success === false || most?.blad ? ` · ⚠ most: ${most.message ?? most.blad}` : most?.bestsellery ? ` · most skopiował do sklep-shopify/${b.postac}/3-BESTSELLERY-PRINTFUL-I-ALL-OVER` : ' · ⚠ most nie zna jeszcze bestsellerów (stara wersja) — po restarcie mostu skopiuje je przy najbliższej synchronizacji'}`);
    } catch (e) { setBlad((e as Error).message); }
    setPraca('');
  };

  const rysujMarke = async () => {
    setBlad(''); setWynik('');
    try {
      await czcionki();
      setPraca('Logo i baner…');
      const mak = (await Promise.all(makiety.slice(0, 3).map((s) => wczytajObraz(s).catch(() => null)))).filter(Boolean) as HTMLImageElement[];
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
