/**
 * 🌀 Kolekcja 360° — opowieść na PRZODZIE, PLECACH i RĘKAWACH (serwer: kolekcje.ts, rysunek stref: utils/kompozycja360.ts).
 * Podgląd stref liczy się na żywo w przeglądarce; „🧵 Uszyj” wgrywa strefy 4096 px i składa makiety PRZÓD + TYŁ i arkusz.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Loader2, Sparkles, Download, Trash2 } from 'lucide-react';
import { wczytajMotyw, wytnijTlo, paleta, imieZOpisu, przodPlakat, przodHerb, plecy, rekaw, doPng, naszywkaBlok, haftKursywa, plecyHaft, naszywkaPostaci, naszywkaGlowy, naszywkaSymbol, ustawJezykNapisow, type TekstKolekcji } from '../utils/kompozycja360';

/** Ubiory z długim rękawem — ta sama lista co DLUGIE_REKAWY w nadruki.ts (serwer). */
const DLUGIE_REKAWY = ['bluza', 'longsleeve', 'kurtka', 'bomber', 'jeansowa', 'ramoneska', 'parka', 'plaszcz'];
/** Kurtki szyje się naszywkami (chenille), resztę nadrukiem. */
const KURTKI = ['kurtka', 'bomber', 'jeansowa', 'ramoneska'];
/** 💰 Cennik 0.00G Style (Suweren 2026-11-06, EUR) — domyślny, do zmiany w panelu. Bomber 99, jeansowa 109 (Suweren 2026-11-06). */
const CENNIK_0G: Record<string, string> = { torba: '29', koszulka: '39', longsleeve: '49', bluza: '69', parka: '89', plaszcz: '89', bomber: '99', jeansowa: '109', kurtka: '119', ramoneska: '119' };
const SKLEP_0G = 'https://teo.center';

interface Motyw { id: string; opis: string; galaz: string | null }
interface Kolekcja { id: string; obraz: string; ubior: string; kolor: string; uklad: string; tekst: TekstKolekcji; styl?: string; strefy: Record<string, string>; makietaPrzod?: string; makietaTyl?: string; arkusz?: string; stan: string; kiedy: string }

async function api<T>(adres: string, init?: RequestInit): Promise<T> {
  const r = await fetch(adres, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as T;
}

export function Kolekcja360({ motyw, ubiory, kolory }: { motyw: Motyw | null; ubiory: Record<string, { nazwa: string }>; kolory: Record<string, string> }) {
  const { themeConfig } = useTheme();
  const [ubior, setUbior] = useState('bluza');
  const [kolor, setKolor] = useState('czarny');
  const [uklad, setUklad] = useState<'plakat' | 'herb'>('plakat');
  const [styl, setStyl] = useState<'plaski' | 'haft'>('plaski');
  useEffect(() => { if (KURTKI.includes(ubior)) setStyl('haft'); }, [ubior]);
  const [tekst, setTekst] = useState<TekstKolekcji>({});
  // 🌍 język napisów na ubraniu (zapamiętany); opowieść pisze się od razu w nim, przycisk tłumaczy wszystkie pola
  const [jezyk, setJezyk] = useState(() => { try { return localStorage.getItem('fashion_jezyk_napisow') || 'pl'; } catch { return 'pl'; } });
  ustawJezykNapisow(jezyk);
  useEffect(() => { try { localStorage.setItem('fashion_jezyk_napisow', jezyk); } catch { /* — */ } }, [jezyk]);
  const [wyciety, setWyciety] = useState<HTMLCanvasElement | null>(null);
  const [kolekcje, setKolekcje] = useState<Kolekcja[]>([]);
  const [praca, setPraca] = useState('');
  const [blad, setBlad] = useState('');
  const [historia, setHistoria] = useState<{ odcinek: string; tytul: string; kwestie: string[] }[]>([]);
  const [ceny, setCeny] = useState<Record<string, string>>(() => { let z: Record<string, string> = {}; try { z = JSON.parse(localStorage.getItem('fashion_ceny_sklepu') || '{}'); } catch { /* — */ } return { ...CENNIK_0G, ...Object.fromEntries(Object.entries(z).filter(([, v]) => String(v).trim())) }; });
  useEffect(() => { try { localStorage.setItem('fashion_ceny_sklepu', JSON.stringify(ceny)); } catch { /* — */ } }, [ceny]);
  const [waluta, setWaluta] = useState('EUR');
  const [bazaObrazow, setBazaObrazow] = useState('');
  const [pakiet, setPakiet] = useState<{ katalog: string; csv: string; produktow: number } | null>(null);
  const [linkSklepu, setLinkSklepu] = useState(SKLEP_0G);
  const [info, setInfo] = useState('');
  const podglady = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { void api<{ kolekcje: Kolekcja[] }>('/api/nadruki/kolekcje').then((d) => setKolekcje(d.kolekcje)).catch(() => {}); }, []);
  useEffect(() => {
    setWyciety(null);
    if (!motyw) return;
    setTekst((t) => ({ blok: '0.00G', sentencja: 'From 0 & 1 to Infinity — Rodzina Jest Na Zawsze', ...t, tytul: imieZOpisu(motyw.opis) }));
    void api<{ historia: { odcinek: string; tytul: string; kwestie: string[] }[] }>(`/api/nadruki/historia?imie=${encodeURIComponent(imieZOpisu(motyw.opis))}`).then((d) => setHistoria(d.historia)).catch(() => setHistoria([]));
    void wczytajMotyw(motyw.id).then((img) => setWyciety(wytnijTlo(img))).catch((e) => setBlad(`Motyw się nie wczytał: ${e.message}`));
  }, [motyw?.id]);

  const strefy = (o: { ubior?: string; styl?: string; uklad?: string; tekst?: TekstKolekcji } = {}) => strefyDla(o.ubior ?? ubior, o.styl ?? styl, o.uklad ?? uklad, o.tekst ?? tekst);
  const strefyDla = (ubior: string, styl: string, uklad: string, tekst: TekstKolekcji) => {
    if (!wyciety || !motyw) return null;
    const pal = paleta(kolor);
    if (styl === 'haft') {
      // 🧵 naszywki: pierś lewa = blok varsity, prawa = haft kursywą; plecy = blok pionowo + wielka naszywka postaci; dół pleców = sentencja
      const h: Record<string, HTMLCanvasElement> = {
        'przod-l': naszywkaBlok(tekst.blok || '0.00G', pal), 'przod-p': haftKursywa(tekst.cytat || tekst.tytul || ''),
        tyl: plecyHaft(wyciety, tekst, pal), 'tyl-dol': haftKursywa(tekst.sentencja || tekst.cytat || ''),
      };
      const dlugi = DLUGIE_REKAWY.includes(ubior);
      if (ubior !== 'torba') {
        h['rekaw-l-1'] = naszywkaGlowy(wyciety); h['rekaw-p-1'] = naszywkaSymbol('ᛋ', 'KATEDRA', pal);
        if (dlugi) {
          h['rekaw-l-2'] = naszywkaSymbol('8', '∞  0.00G', pal); h['rekaw-l-3'] = naszywkaBlok((tekst.zywiol || 'ZERO').slice(0, 10), pal, 1600);
          h['rekaw-p-2'] = naszywkaSymbol('0', 'ZERO 0.00G', pal); h['rekaw-p-3'] = naszywkaBlok((tekst.tytul || 'TEO').slice(0, 10), pal, 1600);
        }
      }
      return h;
    }
    const s: Record<string, HTMLCanvasElement> = {
      przod: uklad === 'herb' ? przodHerb(wyciety, tekst, pal, motyw.id) : przodPlakat(wyciety, tekst, pal, motyw.id),
      tyl: plecy(wyciety, tekst, pal, motyw.id),
    };
    if (ubior !== 'torba') { s['rekaw-l'] = rekaw(tekst, pal, motyw.id, 'l'); s['rekaw-p'] = rekaw(tekst, pal, motyw.id, 'p'); }
    return s;
  };

  // podgląd na żywo (małe kopie płócien na tle w kolorze ubioru)
  useEffect(() => {
    const s = strefy();
    for (const [k, el] of Object.entries(podglady.current) as [string, HTMLDivElement | null][]) {
      if (!el) continue;
      el.innerHTML = '';
      const c = s?.[k];
      if (!c) continue;
      c.style.width = '100%'; c.style.height = 'auto'; c.style.display = 'block';
      el.appendChild(c);
    }
  }, [wyciety, tekst, kolor, uklad, ubior, styl]);

  const dopisz = async () => {
    if (!motyw) return;
    setPraca('opowiesc'); setBlad('');
    try { const d = await api<{ tekst: TekstKolekcji }>('/api/nadruki/opowiesc', { method: 'POST', body: JSON.stringify({ obraz: motyw.id, jezyk }) }); setTekst({ ...d.tekst, blok: tekst.blok, sentencja: tekst.sentencja }); }
    catch (e) { setBlad((e as Error).message); } finally { setPraca(''); }
  };
  const przetlumacz = async () => {
    setPraca('tlumacz'); setBlad('');
    try { const d = await api<{ tekst: TekstKolekcji }>('/api/nadruki/przetlumacz', { method: 'POST', body: JSON.stringify({ tekst, jezyk }) }); setTekst(d.tekst); }
    catch (e) { setBlad((e as Error).message); } finally { setPraca(''); }
  };

  /** Jedna kolekcja: strefy → serwer → makiety PRZÓD/TYŁ + arkusz. `przed` = napis postępu (np. „3/10 Parka · ”). */
  const uszyjZ = async (o: { ubior: string; styl: string; uklad: string; tekst: TekstKolekcji }, przed = '') => {
    const s = strefy(o);
    if (!s || !motyw) throw new Error('Motyw jeszcze się nie wczytał.');
      setPraca(`${przed}Makiety przodu i tyłu (pierwszy raz FLUX — do kilku minut)…`);
      const { kolekcja } = await api<{ kolekcja: Kolekcja }>('/api/nadruki/kolekcje', { method: 'POST', body: JSON.stringify({ obraz: motyw.id, ubior: o.ubior, kolor, uklad: o.uklad, styl: o.styl, tekst: o.tekst }) });
      for (const [nazwa, c] of Object.entries(s)) {
        setPraca(`${przed}Wgrywam strefę ${nazwa} (4096 px)…`);
        const r = await fetch(`/api/nadruki/kolekcje/${kolekcja.id}/strefa/${nazwa}`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: await doPng(c) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      }
      setPraca(`${przed}Składam makiety i arkusz produkcyjny…`);
      const { kolekcja: gotowa } = await api<{ kolekcja: Kolekcja }>(`/api/nadruki/kolekcje/${kolekcja.id}/zloz`, { method: 'POST' });
      setKolekcje((l) => [gotowa, ...l]);
      return gotowa;
  };
  const uszyj = async () => {
    setBlad('');
    try { await uszyjZ({ ubior, styl, uklad, tekst }); } catch (e) { setBlad((e as Error).message); } finally { setPraca(''); }
  };
  /** 🧺 Po jednym z KAŻDEGO modelu: dla każdego Kronikarz pisze INNĄ opowieść z historii postaci w serialu (wzór = model ubioru, `inne` = tytuły już napisanych). */
  const uszyjWszystkie = async () => {
    if (!motyw) return;
    setBlad(''); setInfo('');
    const modele = Object.keys(ubiory), inne: string[] = [], zle: string[] = [];
    for (const [i, u] of modele.entries()) {
      const przed = `${i + 1}/${modele.length} ${ubiory[u].nazwa} · `;
      try {
        setPraca(`${przed}Kronikarz pisze opowieść…`);
        const d = await api<{ tekst: TekstKolekcji }>('/api/nadruki/opowiesc', { method: 'POST', body: JSON.stringify({ obraz: motyw.id, jezyk, wzor: ubiory[u].nazwa, inne }) });
        const t = { ...d.tekst, blok: tekst.blok, sentencja: tekst.sentencja };
        if (t.tytul) inne.push(`${t.tytul}${t.podtytul ? ` — ${t.podtytul}` : ''}`);
        await uszyjZ({ ubior: u, styl: KURTKI.includes(u) ? 'haft' : 'plaski', uklad: i % 2 ? 'herb' : 'plakat', tekst: t }, przed);
      } catch (e) { zle.push(`${ubiory[u].nazwa}: ${(e as Error).message}`); }
    }
    setPraca('');
    setInfo(`Uszyte ${modele.length - zle.length}/${modele.length} modeli.`);
    if (zle.length) setBlad(zle.join(' · '));
  };
  const imie = motyw ? imieZOpisu(motyw.opis) : '';
  const imieSklepu = imie.charAt(0) + imie.slice(1).toLowerCase();
  const moje = kolekcje.filter((k) => k.stan === 'gotowa' && k.obraz === motyw?.id);
  const ostatniaNaModel = Object.values(Object.fromEntries([...moje].reverse().map((k) => [k.ubior, k]))) as Kolekcja[];
  /** ↻ Najnowsza kolekcja każdego modelu jeszcze raz — te same opowieści, napis blokowy i sentencja z formularza (np. po zmianie marki). */
  const przeszyjWszystkie = async () => {
    setBlad(''); setInfo('');
    const zle: string[] = [];
    for (const [i, k] of ostatniaNaModel.entries()) {
      const przed = `↻ ${i + 1}/${ostatniaNaModel.length} ${ubiory[k.ubior]?.nazwa ?? k.ubior} · `;
      try {
        let t: TekstKolekcji = { ...k.tekst, blok: tekst.blok, sentencja: tekst.sentencja };
        // 🌍 napisy w języku z formularza (globalne wydanie = en); model krawca przekłada wszystkie pola
        setPraca(`${przed}tłumaczę napisy (${jezyk})…`);
        t = (await api<{ tekst: TekstKolekcji }>('/api/nadruki/przetlumacz', { method: 'POST', body: JSON.stringify({ tekst: t, jezyk }) })).tekst;
        await uszyjZ({ ubior: k.ubior, styl: k.styl ?? (KURTKI.includes(k.ubior) ? 'haft' : 'plaski'), uklad: k.uklad, tekst: t }, przed);
      }
      catch (e) { zle.push(`${k.ubior}: ${(e as Error).message}`); }
    }
    setPraca(''); setInfo(`Przeszyte ${ostatniaNaModel.length - zle.length}/${ostatniaNaModel.length}.`);
    if (zle.length) setBlad(zle.join(' · '));
  };
  const zrobPakiet = async () => {
    setBlad(''); setPakiet(null); setPraca('Składam pakiet Shopify…');
    try {
      const c = Object.fromEntries(Object.entries(ceny).map(([k, v]) => [k, Number(String(v).replace(',', '.'))]));
      setPakiet(await api('/api/nadruki/pakiet-sklepu', { method: 'POST', body: JSON.stringify({ imie: imieSklepu, kolekcje: ostatniaNaModel.map((k) => k.id), ceny: c, waluta, bazaObrazow, jezyk }) }));
    } catch (e) { setBlad((e as Error).message); } finally { setPraca(''); }
  };
  const zapiszLink = async () => {
    setBlad(''); setInfo('');
    try { await api('/api/nadruki/link-sklepu', { method: 'PUT', body: JSON.stringify({ imie: imieSklepu, url: linkSklepu.trim() || null }) }); setInfo(linkSklepu.trim() ? 'Link zapisany w Katedrze — Kronikarz doklei go do opisu filmów z tą postacią.' : 'Link zdjęty.'); }
    catch (e) { setBlad((e as Error).message); }
  };

  const usun = async (id: string) => { await api(`/api/nadruki/kolekcje/${id}`, { method: 'DELETE' }).catch(() => {}); setKolekcje((l) => l.filter((k) => k.id !== id)); };
  const pole = (k: keyof TekstKolekcji, etykieta: string, dl = false) => (
    <label className="text-xs">{etykieta}<br />
      {dl ? <textarea value={tekst[k] ?? ''} onChange={(e) => setTekst({ ...tekst, [k]: e.target.value })} rows={3} className="w-full rounded bg-black/40 px-2 py-1" />
        : <input value={tekst[k] ?? ''} onChange={(e) => setTekst({ ...tekst, [k]: e.target.value })} className="w-full rounded bg-black/40 px-2 py-1" />}
    </label>
  );
  const tlo = ({ czarny: '#111', bialy: '#f4f4f0', grafitowy: '#3a3b40', granatowy: '#1b2340', zielony: '#1f3a2c', piaskowy: '#d8c7a5', burgundowy: '#4a1420' } as Record<string, string>)[kolor] ?? '#222';

  return (
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: themeConfig.hex }}>
      <h3 className="text-lg font-bold" style={{ color: themeConfig.hex }}>🌀 Kolekcja 360° — przód, plecy, rękawy i opowieść</h3>
      {!motyw && <p className="text-xs opacity-60">Wybierz motyw powyżej.</p>}
      {motyw && <>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs">Ubiór<br /><select value={ubior} onChange={(e) => setUbior(e.target.value)} className="rounded bg-black/40 px-2 py-1">{Object.keys(ubiory).map((id) => <option key={id} value={id}>{ubiory[id].nazwa}</option>)}</select></label>
          <label className="text-xs">Kolor<br /><select value={kolor} onChange={(e) => setKolor(e.target.value)} className="rounded bg-black/40 px-2 py-1">{Object.keys(kolory).map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
          <label className="text-xs">Wykonanie<br /><select value={styl} onChange={(e) => setStyl(e.target.value as 'plaski' | 'haft')} className="rounded bg-black/40 px-2 py-1"><option value="plaski">Nadruk płaski</option><option value="haft">🧵 Naszywka haftowana (chenille)</option></select></label>
          <label className="text-xs">Przód<br /><select value={uklad} onChange={(e) => setUklad(e.target.value as 'plakat' | 'herb')} className="rounded bg-black/40 px-2 py-1"><option value="plakat">Pełny Plakat</option><option value="herb">Herb na Sercu</option></select></label>
          <label className="text-xs">Język napisów<br /><select value={jezyk} onChange={(e) => setJezyk(e.target.value)} className="rounded bg-black/40 px-2 py-1">
            {[['pl', '🇵🇱 polski'], ['en', '🇬🇧 English'], ['de', '🇩🇪 Deutsch'], ['es', '🇪🇸 español'], ['fr', '🇫🇷 français'], ['it', '🇮🇹 italiano'], ['ja', '🇯🇵 日本語'], ['uk', '🇺🇦 українська']].map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select></label>
          <button onClick={() => void przetlumacz()} disabled={!!praca} title="Przekłada wszystkie pola tekstowe na wybrany język (lokalny model krawca)" className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40" style={{ borderColor: themeConfig.hex }}>
            {praca === 'tlumacz' ? <><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />tłumaczę…</> : '🌍 Przetłumacz wszystko'}
          </button>
          <button onClick={() => void dopisz()} disabled={!!praca} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40" style={{ borderColor: themeConfig.hex }}>
            {praca === 'opowiesc' ? <><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Kronikarz pisze…</> : <><Sparkles className="mr-1 inline h-3 w-3" />Dopisz opowieść (Kronikarz)</>}
          </button>
        </div>
        {historia.length > 0 && <details className="rounded border p-2 text-xs" style={{ borderColor: themeConfig.borderHex }}><summary className="cursor-pointer">📺 {imieSklepu} w serialu TeOgochi Mini — {historia.length} odc. (Kronikarz pisze z tego)</summary>
          {historia.map((h) => <div key={h.odcinek} className="mt-2"><b>{h.tytul}</b><ul className="ml-4 list-disc opacity-80">{h.kwestie.map((k, i) => <li key={i}>{k}</li>)}</ul></div>)}</details>}
        <div className="grid gap-2 md:grid-cols-3">{pole('tytul', 'Tytuł (imię)')}{pole('podtytul', 'Podtytuł')}{pole('zywiol', 'Żywioł')}</div>
        {styl === 'haft' && <div className="grid gap-2 md:grid-cols-2">{pole('blok', 'Napis blokowy (pierś, plecy)')}{pole('sentencja', 'Sentencja kursywą (dół pleców)')}</div>}
        <div className="grid gap-2 md:grid-cols-2">{pole('opowiesc', 'Opowieść (plecy)', true)}<div className="space-y-2">{pole('cytat', 'Cytat')}{pole('edycja', 'Edycja')}</div></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {(styl === 'haft' ? ['przod-l', 'przod-p', 'tyl', 'tyl-dol', 'rekaw-l-1', 'rekaw-l-2', 'rekaw-l-3', 'rekaw-p-1', 'rekaw-p-2', 'rekaw-p-3'] : ['przod', 'tyl', 'rekaw-l', 'rekaw-p']).filter((s) => ubior !== 'torba' || !s.startsWith('rekaw')).map((s) => (
            <div key={s} className={s.startsWith('rekaw') ? 'col-span-1' : 'col-span-2'}>
              <p className="mb-1 text-[10px] uppercase opacity-60">{({ przod: uklad === 'herb' ? 'Przód · herb' : 'Przód · plakat', tyl: styl === 'haft' ? 'Plecy · naszywki' : 'Plecy · opowieść', 'rekaw-l': 'Lewy rękaw', 'rekaw-p': 'Prawy rękaw', 'przod-l': 'Pierś lewa · blok', 'przod-p': 'Pierś prawa · kursywa', 'tyl-dol': 'Dół pleców · kursywa' } as Record<string, string>)[s] ?? s.replace('rekaw-l-', 'Lewy rękaw ').replace('rekaw-p-', 'Prawy rękaw ')}</p>
              <div ref={(el) => { podglady.current[s] = el; }} className="rounded p-2" style={{ background: tlo }} />
            </div>
          ))}
        </div>
        <button onClick={() => void uszyj()} disabled={!!praca || !wyciety} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: themeConfig.hex, color: themeConfig.hex }}>
          {praca && praca !== 'opowiesc' ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />{praca}</> : '🧵 Uszyj kolekcję (pliki druku + makiety PRZÓD i TYŁ)'}
        </button>
        <button onClick={() => void uszyjWszystkie()} disabled={!!praca || !wyciety} title="Po jednym z każdego modelu, każdy z inną opowieścią z serialu; kurtki naszywkami" className="ml-3 rounded-lg border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: themeConfig.hex }}>
          🧺 Uszyj wszystkie modele ({Object.keys(ubiory).length})
        </button>
        {ostatniaNaModel.length > 0 && <button onClick={() => void przeszyjWszystkie()} disabled={!!praca || !wyciety} title="Te same opowieści, nowy napis blokowy i sentencja z formularza" className="ml-3 rounded-lg border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: themeConfig.borderHex }}>
          ↻ Przeszyj {ostatniaNaModel.length} — napisy w języku: {jezyk}
        </button>}
        {ostatniaNaModel.length > 0 && <div className="space-y-2 rounded border p-3 text-xs" style={{ borderColor: themeConfig.borderHex }}>
          <b>🛍️ Pakiet do Shopify — {imieSklepu} ({ostatniaNaModel.length} produktów: najnowsza kolekcja każdego modelu; produkty wchodzą jako SZKICE)</b>
          <div className="flex flex-wrap gap-2">{ostatniaNaModel.map((k) => <label key={k.ubior}>{ubiory[k.ubior]?.nazwa ?? k.ubior}<br /><input value={ceny[k.ubior] ?? ''} onChange={(e) => setCeny({ ...ceny, [k.ubior]: e.target.value })} placeholder="cena" className="w-20 rounded bg-black/40 px-2 py-1" /></label>)}
            <label>Waluta<br /><input value={waluta} onChange={(e) => setWaluta(e.target.value.toUpperCase().slice(0, 3))} className="w-14 rounded bg-black/40 px-2 py-1" /></label></div>
          <label className="block">Publiczny adres zdjęć (https, opcjonalnie — bez niego zdjęcia dodasz w panelu Shopify)<br /><input value={bazaObrazow} onChange={(e) => setBazaObrazow(e.target.value)} placeholder="https://…/nadruki/sklep/borowik" className="w-full rounded bg-black/40 px-2 py-1" /></label>
          <button onClick={() => void zrobPakiet()} disabled={!!praca} className="rounded border px-3 py-1 disabled:opacity-40" style={{ borderColor: themeConfig.hex }}>📦 Złóż pakiet (CSV + makiety + pliki druku)</button>
          {pakiet && <p>✓ {pakiet.produktow} produktów · <a href={pakiet.csv} download className="underline">produkty.csv</a> · katalog <code>public{pakiet.katalog}</code> (CZYTAJ.txt w środku)</p>}
          <label className="block">Link kolekcji w sklepie (po imporcie w Shopify) — trafi do opisów filmów YouTube z {imieSklepu}<br /><span className="flex gap-2"><input value={linkSklepu} onChange={(e) => setLinkSklepu(e.target.value)} placeholder="https://twoj-sklep.myshopify.com/collections/borowik" className="flex-1 rounded bg-black/40 px-2 py-1" /><button onClick={() => void zapiszLink()} className="rounded border px-3 py-1" style={{ borderColor: themeConfig.hex }}>🔗 Zapisz w Katedrze</button></span></label>
        </div>}
      </>}
      {info && <p className="text-sm text-green-400">✓ {info}</p>}
      {blad && <p className="text-sm text-red-400">⚠ {blad}</p>}
      <div className="space-y-4">
        {kolekcje.filter((k) => k.stan === 'gotowa').map((k) => (
          <div key={k.id} className="rounded-xl border p-3 text-xs" style={{ borderColor: themeConfig.borderHex }}>
            <div className="mb-2 flex items-center gap-3"><b>{k.tekst.tytul || k.obraz}</b><span className="opacity-60">{ubiory[k.ubior]?.nazwa ?? k.ubior} · {k.kolor} · {k.uklad}</span>
              <button onClick={() => void usun(k.id)} className="ml-auto opacity-60"><Trash2 className="h-3 w-3" /></button></div>
            <div className="grid grid-cols-2 gap-2">{k.makietaPrzod && <img src={k.makietaPrzod} alt="przód" className="rounded" />}{k.makietaTyl && <img src={k.makietaTyl} alt="tył" className="rounded" />}</div>
            <div className="mt-2 flex flex-wrap gap-3">
              {Object.entries(k.strefy).map(([s, u]) => <a key={s} href={u} download className="flex items-center gap-1 underline"><Download className="h-3 w-3" />{s}</a>)}
              {k.arkusz && <a href={k.arkusz} download className="flex items-center gap-1 underline"><Download className="h-3 w-3" />arkusz produkcyjny</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
