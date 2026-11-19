/**
 * 🛍 TeO ShoP — jeden przycisk, cała kolekcja.
 *
 * Składa pliki produkcyjne na płótnie przeglądarki, odsyła je na serwer do katalogu studia
 * i na końcu pisze `teo_shop_import.csv` do importu w Shopify. Podgląd pokazuje DOKŁADNIE to,
 * co ląduje na dysku — ten sam kod rysujący, tylko mniejsze płótno.
 *
 * Dwa rodzaje plików, o PRZECIWNYCH wymaganiach:
 *   • DTG / winyl / plakat → przezroczyste tło, postać z Pracowni nad typografią,
 *   • All-Over Print       → pełne ciemne tło bez przezroczystości, komplet paneli
 *     (przód, tył, oba rękawy) × cztery kolorystyki Katedry.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { wczytajMotyw, wytnijTlo } from '../utils/kompozycja360';
import { barwaZId } from '../utils/bestsellery';
import { biegBestsellerow } from '../utils/bestselleryBieg';
import {
    rysujNadruk, rysujPodgladAop, zbudujNadruk, zbudujPodglad, zbudujPanelAop, zbudujPodgladAop, zlozPostacie,
    type PanelDruku, type Uklad,
} from '../utils/teoShopGrafika';

type Linia = 'A' | 'B' | 'C' | 'D';
interface Postac {
    id: string; nazwa: string; rola: string; opisEn?: string; cytatEn?: string;
    tolerancja?: number; cien?: boolean; wymaz?: { x0: number; y0: number; x1: number; y1: number };
}
interface Aop { katalogId: number; nazwaPrintful: string; panele: PanelDruku[] }
interface Produkt {
    handle: string; tytul: string; linia: Linia; typ: string; format: 'dtg' | 'naklejka' | 'plakat' | 'aop';
    uklad: Uklad; napis: string; podpis: string; nota: string; tagi: string[]; cenaEur: number;
    postacie: Postac[]; aop?: Aop; kolorystyki?: string[]; plikow: number;
    gotowy: boolean; podgladGotowy: boolean; url: string; metoda: string; wymiar: string;
}
interface Kolorystyka { id: string; nazwa: string }
interface Stan {
    katalog: string; katalogPodgladow: string; adresPodgladu: string; csv: string; csvGotowy: boolean;
    produkty: Produkt[]; kolorystyki: Kolorystyka[];
    linie: Record<Linia, { nazwa: string; postacie: Postac[]; kolorystyka: string }>;
}

const FORMATY: Record<Produkt['format'], { w: number; h: number }> = {
    dtg: { w: 4500, h: 5400 }, naklejka: { w: 3000, h: 3000 }, plakat: { w: 5400, h: 7200 }, aop: { w: 4200, h: 5400 },
};
const LINIE: Linia[] = ['A', 'B', 'C', 'D'];

/** Postacie z Pracowni: wczytane raz, wycięte z białego tła, duet złożony obok siebie. */
function useMotywy() {
    const pamiec = useRef(new Map<string, Promise<HTMLCanvasElement | null>>());
    return useCallback(async (postacie: Postac[]): Promise<HTMLCanvasElement | null> => {
        if (!postacie?.length) return null;
        const pojedyncze = await Promise.all(postacie.map((p) => {
            const klucz = `${p.id}#${p.tolerancja ?? ''}#${p.cien === false ? 'bc' : ''}`;
            if (!pamiec.current.has(klucz)) {
                // nastawy wycinanki z katalogu — biały stworek na białym tle wymaga wszystkich trzech (patrz `Postac`)
                pamiec.current.set(klucz, wczytajMotyw(p.id)
                    .then((img) => wytnijTlo(img, p.tolerancja ?? 46, { cien: p.cien, wymaz: p.wymaz }))
                    .catch(() => null));
            }
            return pamiec.current.get(klucz)!;
        }));
        return zlozPostacie(pojedyncze.filter(Boolean) as HTMLCanvasElement[]);
    }, []);
}

const Podglad: React.FC<{ p: Produkt; motyw: HTMLCanvasElement | null; kolorystyka: string; szer?: number }> = ({ p, motyw, kolorystyka, szer = 150 }) => {
    const ref = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const c = ref.current?.getContext('2d');
        if (!c || !ref.current) return;
        if (p.aop) {
            ref.current.width = szer; ref.current.height = Math.round((szer * 1440) / 1200);
            const s = szer / 1200;
            c.setTransform(s, 0, 0, s, 0, 0);
            if (motyw) rysujPodgladAop(c, p.aop.panele[0], motyw, { napis: p.napis, podpis: p.podpis }, p.nota, kolorystyka);
            return;
        }
        const f = FORMATY[p.format], skala = szer / f.w;
        ref.current.width = Math.round(f.w * skala); ref.current.height = Math.round(f.h * skala);
        c.setTransform(skala, 0, 0, skala, 0, 0);
        rysujNadruk(c, p.uklad, f, { napis: p.napis, podpis: p.podpis }, true, motyw);
    }, [p, szer, motyw, kolorystyka]);
    return <canvas ref={ref} className="w-full rounded-lg border border-white/10 bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%),linear-gradient(-45deg,#1a1a1a_25%,transparent_25%)] bg-[length:12px_12px]" />;
};

const KafelekProduktu: React.FC<{ p: Produkt; kolorystyka: string; motyw: (ps: Postac[]) => Promise<HTMLCanvasElement | null> }> = ({ p, kolorystyka, motyw }) => {
    const [m, setM] = useState<HTMLCanvasElement | null>(null);
    useEffect(() => { let zyje = true; void motyw(p.postacie).then((x) => { if (zyje) setM(x); }); return () => { zyje = false; }; }, [p.handle, motyw]);
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <Podglad p={p} motyw={m} kolorystyka={kolorystyka} />
            <div className="mt-2 truncate text-xs font-semibold text-neutral-200" title={p.tytul}>{p.tytul}</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">{p.typ} · {p.cenaEur.toFixed(2)} €</div>
            <div className="mt-1 text-[10px] leading-tight text-neutral-600">{p.wymiar}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-[#00ff66]/70">{p.metoda}</div>
            {p.postacie.length > 0 && <div className="mt-0.5 truncate text-[10px] text-amber-300/70" title={p.postacie.map((x) => `${x.nazwa} — ${x.rola}`).join(' · ')}>🐾 {p.postacie.map((x) => x.nazwa).join(' + ')}</div>}
            {p.aop && <div className="mt-0.5 text-[10px] text-indigo-300/80">🌌 {p.aop.panele.length} paneli × {p.kolorystyki?.length ?? 0} kolorystyki = {p.plikow} plików</div>}
            <div className={`mt-1.5 text-[11px] ${p.gotowy ? 'text-emerald-400' : 'text-neutral-600'}`}>{p.gotowy ? `✓ pliki produkcyjne (${p.plikow})` : '· pliki jeszcze nie powstały'}</div>
            <div className={`text-[11px] ${p.podgladGotowy ? 'text-emerald-400' : 'text-neutral-600'}`}>{p.podgladGotowy ? '✓ podgląd sklepowy' : '· podgląd jeszcze nie powstał'}</div>
        </div>
    );
};

export const TeOShop: React.FC = () => {
    const [stan, setStan] = useState<Stan | null>(null);
    const [pracuje, setPracuje] = useState(false);
    const [postep, setPostep] = useState('');
    const [blad, setBlad] = useState('');
    const [tylkoBrakujace, setTylkoBrakujace] = useState(true);
    const [linie, setLinie] = useState<Linia[]>(LINIE);
    const przerwij = useRef(false);
    const motyw = useMotywy();

    const odswiez = useCallback(() => fetch('/api/teoshop').then((r) => r.json()).then((d) => { if (d.ok) setStan(d); else setBlad(d.error ?? 'Nie odczytałem kolekcji.'); }).catch((e) => setBlad(String(e))), []);
    useEffect(() => { void odswiez(); }, [odswiez]);

    const idKoloru = useCallback((nazwa: string) => stan?.kolorystyki.find((k) => k.nazwa === nazwa)?.id ?? 'obsidian-black', [stan]);

    const doKolejki = useMemo(() => {
        if (!stan) return [];
        return stan.produkty.filter((p) => linie.includes(p.linia) && (!tylkoBrakujace || !p.gotowy || !p.podgladGotowy));
    }, [stan, linie, tylkoBrakujace]);

    // typ bierzemy z samego bloba: pliki produkcyjne to PNG, podglądy sklepowe JPEG
    const wyslij = async (adres: string, blob: Blob, co: string) => {
        const r = await fetch(adres, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/png' }, body: blob });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.ok === false) throw new Error(`${co}: ${d.error ?? `HTTP ${r.status}`}`);
    };
    const oddech = () => new Promise((r) => setTimeout(r, 30));   // oddech dla przeglądarki przy 4200×5400

    const generuj = async () => {
        if (!stan || !doKolejki.length) return;
        setPracuje(true); setBlad(''); setPostep(''); przerwij.current = false;
        let plikow = 0;
        try {
            for (const [i, p] of doKolejki.entries()) {
                if (przerwij.current) { setPostep(`⏸ przerwane po ${i} produktach (${plikow} plików).`); break; }
                const czolo = `${i + 1}/${doKolejki.length} · ${p.tytul}`;
                setPostep(`${czolo} — wczytuję postacie…`);
                const m = await motyw(p.postacie);
                if (p.postacie.length && !m) throw new Error(`${p.tytul}: nie wczytała się żadna postać z Pracowni (${p.postacie.map((x) => x.id).join(', ')}).`);
                const teksty = { napis: p.napis, podpis: p.podpis };

                if (p.aop && p.kolorystyki?.length) {
                    if (!m) throw new Error(`${p.tytul}: All-Over Print bez postaci nie ma sensu.`);
                    for (const nazwaK of p.kolorystyki) {
                        const k = idKoloru(nazwaK);
                        for (const panel of p.aop.panele) {
                            if (przerwij.current) break;
                            setPostep(`${czolo} · ${nazwaK} · ${panel.nazwa} (${panel.w}×${panel.h})…`);
                            await oddech();
                            const blob = await zbudujPanelAop(panel, m, teksty, p.nota, k);
                            await wyslij(`/api/teoshop/aop/${p.handle}?kolorystyka=${encodeURIComponent(k)}&panel=${encodeURIComponent(panel.placement)}`, blob, p.tytul);
                            plikow++;
                        }
                        setPostep(`${czolo} · ${nazwaK} · podgląd sklepowy…`);
                        const pod = await zbudujPodgladAop(p.aop.panele[0], m, teksty, p.nota, k);
                        await wyslij(`/api/teoshop/podglad/${p.handle}?kolorystyka=${encodeURIComponent(k)}`, pod, `${p.tytul} (podgląd)`);
                    }
                } else {
                    setPostep(`${czolo} — plik produkcyjny…`);
                    await oddech();
                    await wyslij(`/api/teoshop/plik/${p.handle}`, await zbudujNadruk(p.uklad, FORMATY[p.format], teksty, m), p.tytul);
                    plikow++;
                    const pod = await zbudujPodglad(p.uklad, FORMATY[p.format], teksty, m);
                    await wyslij(`/api/teoshop/podglad/${p.handle}`, pod, `${p.tytul} (podgląd)`);
                }
            }
            setPostep('Piszę teo_shop_import.csv…');
            const r = await fetch('/api/teoshop/csv', { method: 'POST' });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error);
            setPostep(`✓ Gotowe: ${plikow} plików produkcyjnych · CSV ${d.produktow} produktów, ${d.wierszy} wierszy.`);
            await odswiez();
        } catch (e) { setBlad(String((e as Error).message ?? e)); setPostep(''); }
        finally { setPracuje(false); }
    };

    /**
     * 🖨 Bestsellery Printful dla KAŻDEJ postaci linii — tylko All-Over Print.
     *
     * Suweren 2026-11-19: „tych produktów z zapasami jeszcze nie mamy… na razie tylko AOP".
     * Reszta katalogu Printful (naklejki, plakaty, magnesy, etui, czapka) czeka, aż marka urośnie
     * na tyle, żeby pracować z własnymi producentami.
     *
     * Ten przebieg pisze manifest, którego szuka `/api/printful/synchronizuj` w moście: to on wiąże
     * SKU wariantu Shopify z `variantId` katalogu drukarni i wysyła pliki druku. Bez manifestu
     * synchronizacja nie ma czego dopasować i każdy wariant zostaje „not synced".
     */
    const bestsellery = async () => {
        if (!stan) return;
        setPracuje(true); setBlad(''); setPostep(''); przerwij.current = false;
        // ta sama postać bywa w kilku produktach linii — rysujemy ją RAZ
        const lista: { p: Postac; linia: Linia }[] = [];
        for (const l of LINIE) {
            if (!linie.includes(l)) continue;
            for (const p of stan.linie[l].postacie) if (!lista.some((x) => x.p.id === p.id)) lista.push({ p, linia: l });
        }
        let plikow = 0, zrobionych = 0;
        try {
            for (const [i, { p, linia }] of lista.entries()) {
                if (przerwij.current) { setPostep(`⏸ przerwane po ${i} postaciach (${plikow} plików).`); break; }
                setPostep(`${i + 1}/${lista.length} · ${p.nazwa} — wycinam postać…`);
                const m = await motyw([p]);
                if (!m) throw new Error(`${p.nazwa}: obraz z Pracowni się nie wczytał (${p.id}).`);
                const L = stan.linie[linia];
                const b = await biegBestsellerow({
                    imie: p.nazwa, wyciety: m, tylkoAop: true, barwa: barwaZId(idKoloru(L.kolorystyka)),
                    tekst: { tytul: p.nazwa, podtytul: L.nazwa, opowiesc: p.opisEn ?? p.rola, cytat: p.cytatEn ?? '' },
                    kolekcja: L.nazwa, postep: setPostep,
                });
                plikow += b.plikow; zrobionych++;
                if (b.dokladnych < b.wszystkich) setBlad(`⚠ ${p.nazwa}: wymiary z Printful tylko dla ${b.dokladnych}/${b.wszystkich} produktów — reszta orientacyjna.`);
            }
            setPostep(`✓ Bestsellery AOP: ${zrobionych} postaci, ${plikow} plików druku → public/nadruki/bestsellery/ i sklep-shopify/<postać>/3-BESTSELLERY-PRINTFUL-I-ALL-OVER.`);
            await odswiez();
        } catch (e) { setBlad(String((e as Error).message ?? e)); setPostep(''); }
        finally { setPracuje(false); }
    };

    if (blad && !stan) return <div className="p-8 text-rose-300">⚠ {blad}</div>;
    if (!stan) return <div className="flex items-center gap-2 p-8 text-neutral-400"><Loader2 className="h-4 w-4 animate-spin" /> Czytam kolekcję…</div>;

    const gotowych = stan.produkty.filter((p) => p.gotowy).length;
    const plikowRazem = doKolejki.reduce((s, p) => s + p.plikow, 0);
    const postaciLinii = new Set(LINIE.filter((l) => linie.includes(l)).flatMap((l) => stan.linie[l].postacie.map((p) => p.id))).size;
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#00ff66]"><ShoppingBag className="h-6 w-6" /> TeO ShoP — Kolekcja &amp; Eksport</h2>
                    <p className="mt-1 text-sm text-neutral-400">{stan.produkty.length} produktów · z kompletem plików: {gotowych} · CSV: {stan.csvGotowy ? 'jest' : 'brak'}</p>
                    <p className="mt-0.5 break-all font-mono text-[11px] text-neutral-600">{stan.katalog}</p>
                    <p className="break-all font-mono text-[11px] text-neutral-600">podglądy → {stan.katalogPodgladow} · {stan.adresPodgladu}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => void odswiez()} disabled={pracuje} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-40"><RefreshCw className="mr-1 inline h-4 w-4" /> Odśwież</button>
                    {pracuje
                        ? <button onClick={() => { przerwij.current = true; }} className="rounded-lg border border-amber-400/50 px-4 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-400/10">⏸ Przerwij po bieżącym</button>
                        : <>
                            <button onClick={() => void generuj()} disabled={!doKolejki.length}
                                className="rounded-lg bg-[#00ff66] px-5 py-2.5 text-sm font-black text-black hover:bg-[#4dff8f] disabled:opacity-40">
                                <Download className="mr-1 inline h-4 w-4" /> Generuj {doKolejki.length} produktów ({plikowRazem} plików) + CSV
                            </button>
                            <button onClick={() => void bestsellery()} title="Komplet paneli All-Over Print każdej postaci + manifest dla synchronizacji Printful"
                                className="rounded-lg border border-indigo-400/60 px-4 py-2.5 text-sm font-bold text-indigo-200 hover:bg-indigo-400/10">
                                🖨 Bestsellery Printful (AOP) — {postaciLinii} postaci
                            </button>
                        </>}
                </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs text-neutral-300">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={tylkoBrakujace} disabled={pracuje} onChange={(e) => setTylkoBrakujace(e.target.checked)} /> tylko brakujące</label>
                <span className="text-neutral-600">|</span>
                {LINIE.map((l) => (
                    <label key={l} className="flex items-center gap-1.5" title={stan.linie[l].postacie.map((x) => `${x.nazwa} — ${x.rola}`).join(' · ')}>
                        <input type="checkbox" checked={linie.includes(l)} disabled={pracuje} onChange={(e) => setLinie(e.target.checked ? [...linie, l] : linie.filter((x) => x !== l))} />
                        Linia {l}
                    </label>
                ))}
                <span className="ml-auto text-neutral-500">🌌 kolorystyki AOP: {stan.kolorystyki.map((k) => k.nazwa).join(' · ')}</span>
            </div>
            {(postep || blad) && <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${blad ? 'bg-rose-950/60 text-rose-200' : 'bg-emerald-950/50 text-emerald-200'}`}>{blad ? `⚠ ${blad}` : postep}</div>}
            {stan.csvGotowy && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#00ff66]/30 bg-[#00ff66]/5 px-4 py-2.5 text-sm text-neutral-300">
                    <FileSpreadsheet className="h-4 w-4 text-[#00ff66]" />
                    <span>Plik importu gotowy — <span className="font-mono text-[11px] text-neutral-400">{stan.csv}</span></span>
                </div>
            )}
            {LINIE.map((linia) => (
                <section key={linia} className="mb-8">
                    <h3 className="mb-1 border-b border-white/10 pb-1.5 text-sm font-bold uppercase tracking-widest text-neutral-300">Linia {linia} — {stan.linie[linia].nazwa}</h3>
                    <p className="mb-3 text-[11px] text-amber-300/60">🐾 {stan.linie[linia].postacie.map((x) => `${x.nazwa} (${x.rola})`).join(' · ')}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {stan.produkty.filter((p) => p.linia === linia).map((p) => <KafelekProduktu key={p.handle} p={p} kolorystyka={idKoloru(p.kolorystyki?.[0] ?? stan.linie[linia].kolorystyka)} motyw={motyw} />)}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default TeOShop;
