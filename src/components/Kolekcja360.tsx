/**
 * 🌀 Kolekcja 360° — opowieść na PRZODZIE, PLECACH i RĘKAWACH (serwer: kolekcje.ts, rysunek stref: utils/kompozycja360.ts).
 * Podgląd stref liczy się na żywo w przeglądarce; „🧵 Uszyj” wgrywa strefy 4096 px i składa makiety PRZÓD + TYŁ i arkusz.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Loader2, Sparkles, Download, Trash2 } from 'lucide-react';
import { wczytajMotyw, wytnijTlo, paleta, imieZOpisu, przodPlakat, przodHerb, plecy, rekaw, doPng, naszywkaBlok, haftKursywa, plecyHaft, naszywkaPostaci, naszywkaGlowy, naszywkaSymbol, type TekstKolekcji } from '../utils/kompozycja360';

/** Ubiory z długim rękawem — ta sama lista co DLUGIE_REKAWY w nadruki.ts (serwer). */
const DLUGIE_REKAWY = ['bluza', 'longsleeve', 'kurtka', 'bomber', 'jeansowa', 'ramoneska', 'parka', 'plaszcz'];

interface Motyw { id: string; opis: string; galaz: string | null }
interface Kolekcja { id: string; obraz: string; ubior: string; kolor: string; uklad: string; tekst: TekstKolekcji; strefy: Record<string, string>; makietaPrzod?: string; makietaTyl?: string; arkusz?: string; stan: string; kiedy: string }

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
  useEffect(() => { if (['kurtka', 'bomber', 'jeansowa', 'ramoneska'].includes(ubior)) setStyl('haft'); }, [ubior]);
  const [tekst, setTekst] = useState<TekstKolekcji>({});
  // 🌍 język napisów na ubraniu (zapamiętany); opowieść pisze się od razu w nim, przycisk tłumaczy wszystkie pola
  const [jezyk, setJezyk] = useState(() => { try { return localStorage.getItem('fashion_jezyk_napisow') || 'pl'; } catch { return 'pl'; } });
  useEffect(() => { try { localStorage.setItem('fashion_jezyk_napisow', jezyk); } catch { /* — */ } }, [jezyk]);
  const [wyciety, setWyciety] = useState<HTMLCanvasElement | null>(null);
  const [kolekcje, setKolekcje] = useState<Kolekcja[]>([]);
  const [praca, setPraca] = useState('');
  const [blad, setBlad] = useState('');
  const podglady = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { void api<{ kolekcje: Kolekcja[] }>('/api/nadruki/kolekcje').then((d) => setKolekcje(d.kolekcje)).catch(() => {}); }, []);
  useEffect(() => {
    setWyciety(null);
    if (!motyw) return;
    setTekst((t) => ({ blok: 'TETHERIA', sentencja: 'From 0 & 1 to Infinity — Rodzina Jest Na Zawsze', ...t, tytul: imieZOpisu(motyw.opis) }));
    void wczytajMotyw(motyw.id).then((img) => setWyciety(wytnijTlo(img))).catch((e) => setBlad(`Motyw się nie wczytał: ${e.message}`));
  }, [motyw?.id]);

  const strefy = () => {
    if (!wyciety || !motyw) return null;
    const pal = paleta(kolor);
    if (styl === 'haft') {
      // 🧵 naszywki: pierś lewa = blok varsity, prawa = haft kursywą; plecy = blok pionowo + wielka naszywka postaci; dół pleców = sentencja
      const h: Record<string, HTMLCanvasElement> = {
        'przod-l': naszywkaBlok(tekst.blok || 'TETHERIA', pal), 'przod-p': haftKursywa(tekst.cytat || tekst.tytul || ''),
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

  const uszyj = async () => {
    const s = strefy();
    if (!s || !motyw) return;
    setBlad('');
    try {
      setPraca('Makiety przodu i tyłu (pierwszy raz FLUX — do kilku minut)…');
      const { kolekcja } = await api<{ kolekcja: Kolekcja }>('/api/nadruki/kolekcje', { method: 'POST', body: JSON.stringify({ obraz: motyw.id, ubior, kolor, uklad, styl, tekst }) });
      for (const [nazwa, c] of Object.entries(s)) {
        setPraca(`Wgrywam strefę ${nazwa} (4096 px)…`);
        const r = await fetch(`/api/nadruki/kolekcje/${kolekcja.id}/strefa/${nazwa}`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: await doPng(c) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      }
      setPraca('Składam makiety i arkusz produkcyjny…');
      const { kolekcja: gotowa } = await api<{ kolekcja: Kolekcja }>(`/api/nadruki/kolekcje/${kolekcja.id}/zloz`, { method: 'POST' });
      setKolekcje((l) => [gotowa, ...l]);
    } catch (e) { setBlad((e as Error).message); } finally { setPraca(''); }
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
      </>}
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
