/**
 * 🛍 TeO ShoP — jeden przycisk, cała kolekcja.
 *
 * Składa pliki produkcyjne (PNG, przezroczyste tło) na płótnie przeglądarki, odsyła je na serwer
 * do katalogu studia i na końcu pisze `teo_shop_import.csv` do importu w Shopify. Podgląd pokazuje
 * DOKŁADNIE to, co ląduje na dysku — ten sam kod rysujący, tylko mniejsze płótno.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { rysujNadruk, zbudujNadruk, type Uklad } from '../utils/teoShopGrafika';

interface Produkt {
    handle: string; tytul: string; linia: 'A' | 'B' | 'C'; typ: string; format: 'dtg' | 'naklejka' | 'plakat';
    uklad: Uklad; napis: string; podpis: string; nota: string; tagi: string[]; cenaEur: number;
    gotowy: boolean; metoda: string; wymiar: string;
}
interface Stan { katalog: string; csv: string; csvGotowy: boolean; produkty: Produkt[] }

const FORMATY: Record<Produkt['format'], { w: number; h: number }> = {
    dtg: { w: 4500, h: 5400 }, naklejka: { w: 3000, h: 3000 }, plakat: { w: 5400, h: 7200 },
};
const LINIE: Record<Produkt['linia'], string> = {
    A: 'Linia A — SHAUMBRA ORIGINALS', B: 'Linia B — ELARA & KAEL · 0.00G SESSIONS', C: 'Linia C — BOX EDITIONS',
};

const Podglad: React.FC<{ p: Produkt; szer?: number }> = ({ p, szer = 150 }) => {
    const ref = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const c = ref.current?.getContext('2d');
        if (!c || !ref.current) return;
        const f = FORMATY[p.format], skala = szer / f.w;
        ref.current.width = Math.round(f.w * skala); ref.current.height = Math.round(f.h * skala);
        c.setTransform(skala, 0, 0, skala, 0, 0);
        rysujNadruk(c, p.uklad, f, { napis: p.napis, podpis: p.podpis });
    }, [p, szer]);
    return <canvas ref={ref} className="w-full rounded-lg border border-white/10 bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%),linear-gradient(-45deg,#1a1a1a_25%,transparent_25%)] bg-[length:12px_12px]" />;
};

export const TeOShop: React.FC = () => {
    const [stan, setStan] = useState<Stan | null>(null);
    const [pracuje, setPracuje] = useState(false);
    const [postep, setPostep] = useState('');
    const [blad, setBlad] = useState('');

    const odswiez = useCallback(() => fetch('/api/teoshop').then((r) => r.json()).then((d) => { if (d.ok) setStan(d); else setBlad(d.error ?? 'Nie odczytałem kolekcji.'); }).catch((e) => setBlad(String(e))), []);
    useEffect(() => { void odswiez(); }, [odswiez]);

    const generuj = async () => {
        if (!stan) return;
        setPracuje(true); setBlad(''); setPostep('');
        try {
            for (const [i, p] of stan.produkty.entries()) {
                setPostep(`${i + 1}/${stan.produkty.length} · ${p.tytul}`);
                const blob = await zbudujNadruk(p.uklad, FORMATY[p.format], { napis: p.napis, podpis: p.podpis });
                const r = await fetch(`/api/teoshop/plik/${p.handle}`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: blob });
                const d = await r.json();
                if (!d.ok) throw new Error(`${p.tytul}: ${d.error}`);
                await new Promise((x) => setTimeout(x, 30));   // oddech dla przeglądarki przy 4500×5400
            }
            setPostep('Piszę teo_shop_import.csv…');
            const r = await fetch('/api/teoshop/csv', { method: 'POST' });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error);
            setPostep(`✓ Gotowe: ${d.produktow} produktów, ${d.wierszy} wierszy w CSV.`);
            await odswiez();
        } catch (e) { setBlad(String((e as Error).message ?? e)); setPostep(''); }
        finally { setPracuje(false); }
    };

    if (blad && !stan) return <div className="p-8 text-rose-300">⚠ {blad}</div>;
    if (!stan) return <div className="flex items-center gap-2 p-8 text-neutral-400"><Loader2 className="h-4 w-4 animate-spin" /> Czytam kolekcję…</div>;

    const gotowych = stan.produkty.filter((p) => p.gotowy).length;
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#00ff66]"><ShoppingBag className="h-6 w-6" /> TeO ShoP — Kolekcja &amp; Eksport</h2>
                    <p className="mt-1 text-sm text-neutral-400">{stan.produkty.length} produktów · gotowych plików: {gotowych} · CSV: {stan.csvGotowy ? 'jest' : 'brak'}</p>
                    <p className="mt-0.5 break-all font-mono text-[11px] text-neutral-600">{stan.katalog}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => void odswiez()} disabled={pracuje} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-40"><RefreshCw className="mr-1 inline h-4 w-4" /> Odśwież</button>
                    <button onClick={() => void generuj()} disabled={pracuje}
                        className="rounded-lg bg-[#00ff66] px-5 py-2.5 text-sm font-black text-black hover:bg-[#4dff8f] disabled:opacity-40">
                        {pracuje ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Składam…</> : <><Download className="mr-1 inline h-4 w-4" /> Generuj kolekcję + CSV</>}
                    </button>
                </div>
            </div>
            {(postep || blad) && <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${blad ? 'bg-rose-950/60 text-rose-200' : 'bg-emerald-950/50 text-emerald-200'}`}>{blad ? `⚠ ${blad}` : postep}</div>}
            {stan.csvGotowy && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#00ff66]/30 bg-[#00ff66]/5 px-4 py-2.5 text-sm text-neutral-300">
                    <FileSpreadsheet className="h-4 w-4 text-[#00ff66]" />
                    <span>Plik importu gotowy — <span className="font-mono text-[11px] text-neutral-400">{stan.csv}</span></span>
                </div>
            )}
            {(['A', 'B', 'C'] as const).map((linia) => (
                <section key={linia} className="mb-8">
                    <h3 className="mb-3 border-b border-white/10 pb-1.5 text-sm font-bold uppercase tracking-widest text-neutral-300">{LINIE[linia]}</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {stan.produkty.filter((p) => p.linia === linia).map((p) => (
                            <div key={p.handle} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                                <Podglad p={p} />
                                <div className="mt-2 truncate text-xs font-semibold text-neutral-200" title={p.tytul}>{p.tytul}</div>
                                <div className="mt-0.5 text-[11px] text-neutral-500">{p.typ} · {p.cenaEur.toFixed(2)} €</div>
                                <div className="mt-1 text-[10px] leading-tight text-neutral-600">{p.wymiar}</div>
                                <div className="mt-0.5 text-[10px] leading-tight text-[#00ff66]/70">{p.metoda}</div>
                                <div className={`mt-1.5 text-[11px] ${p.gotowy ? 'text-emerald-400' : 'text-neutral-600'}`}>{p.gotowy ? '✓ plik na dysku' : '· plik jeszcze nie powstał'}</div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default TeOShop;
