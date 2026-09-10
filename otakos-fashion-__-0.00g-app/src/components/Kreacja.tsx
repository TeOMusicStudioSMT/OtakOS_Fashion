/**
 * 🖌️ KREACJA — tu koncepcja staje się widoczną sztuką odzieży.
 *
 * PO CO. Galeria pokazuje KADRY: postać w scenie, w świetle sceny. To materiał
 * wyjściowy, nie projekt ubioru. Sama kreacja żyła wyłącznie jako opis —
 * `imagePrompt` po tysiąc sto znaków, którego nikt nigdy nie podał silnikowi.
 *
 * Ta tafla to zmienia: bierze `imagePrompt`, każe Katedrze go narysować
 * (FLUX.2 klein, 4 kroki) i pokazuje wynik obok kadru, z którego wyrósł.
 *
 * ⚠️ PROMPT JEST DO POPRAWIENIA, nie do podziwiania. Model rysuje to, co
 * napisano — a napisała to Rada, nie krawiec. Pole jest edytowalne i to, co
 * w nim stoi, idzie do silnika. Bez tego jedyną drogą do lepszego obrazu byłoby
 * przepisanie katalogu.
 *
 * ⚠️ RYSOWANIE TRWA MINUTY. Zmierzone na tej karcie: 57–407 s zależnie od tego,
 * ile wolnego VRAM-u zostawiły przeglądarka, launchery i Ollama. Panel mówi to
 * wprost, zamiast udawać, że zaraz będzie.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { SolletPiece } from '../types';
import { obrazDlaKlatki } from '../data/powiazania';
import { useTheme } from '../context/ThemeContext';
import { Brush, Loader2, AlertTriangle, Image as IkonaObrazu, Clock } from 'lucide-react';
import {
    pobierzWizualizacje, narysujKreacje, adresKadru,
    type Wizualizacja,
} from '../services/kreacja';

interface Props {
    pieces: SolletPiece[];
}

export function Kreacja({ pieces }: Props) {
    const { themeConfig } = useTheme();
    const [wybrana, setWybrana] = useState<SolletPiece | null>(null);
    const [prompt, setPrompt] = useState('');
    const [wizualizacje, setWizualizacje] = useState<Wizualizacja[]>([]);
    const [rysuje, setRysuje] = useState(false);
    const [blad, setBlad] = useState('');
    const [odKiedy, setOdKiedy] = useState(0);

    useEffect(() => {
        void pobierzWizualizacje().then(setWizualizacje).catch(() => setWizualizacje([]));
    }, []);

    // Licznik sekund — przy czekaniu liczonym w minutach cisza wygląda jak zwis.
    useEffect(() => {
        if (!rysuje) return;
        const t = window.setInterval(() => setOdKiedy((s) => s + 1), 1000);
        return () => window.clearInterval(t);
    }, [rysuje]);

    const poId = useMemo(
        () => new Map(wizualizacje.map((w) => [w.id, w])),
        [wizualizacje],
    );

    const wybierz = (p: SolletPiece) => {
        setWybrana(p);
        // Prompt bierzemy z ostatniego rysowania, jeśli był — bo to jego Suweren
        // ewentualnie poprawiał. Dopiero potem z katalogu.
        setPrompt(poId.get(p.id)?.prompt ?? p.imagePrompt ?? '');
        setBlad('');
    };

    const rysuj = async () => {
        if (!wybrana) return;
        setRysuje(true);
        setOdKiedy(0);
        setBlad('');
        try {
            const w = await narysujKreacje({ id: wybrana.id, prompt });
            setWizualizacje((prev) => [w, ...prev.filter((x) => x.id !== w.id)]);
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        } finally {
            setRysuje(false);
        }
    };

    const wiz = wybrana ? poId.get(wybrana.id) : null;
    const kadr = wybrana ? obrazDlaKlatki(wybrana.keyframe) : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ── Lista kreacji ── */}
            <div className="lg:col-span-4">
                <div
                    className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] overflow-hidden"
                    style={{ borderColor: themeConfig.borderHex }}
                >
                    <div className="p-4 border-b" style={{ borderColor: themeConfig.borderHex }}>
                        <div className="text-[10px] font-mono font-bold tracking-wider" style={{ color: themeConfig.hex }}>
                            KREACJE DO NARYSOWANIA
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">
                            {wizualizacje.length} z {pieces.length} ma już rysunek
                        </div>
                    </div>

                    <div className="max-h-[560px] overflow-y-auto">
                        {pieces.map((p) => {
                            const ma = poId.get(p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => wybierz(p)}
                                    className={`w-full text-left px-4 py-2.5 border-b transition-all cursor-pointer flex items-center gap-2 ${
                                        wybrana?.id === p.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                                    }`}
                                    style={{ borderColor: themeConfig.borderHex }}
                                >
                                    <span
                                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                                        style={{ color: themeConfig.hex, backgroundColor: `${themeConfig.hex}18` }}
                                    >
                                        KF{String(p.keyframe).padStart(2, '0')}
                                    </span>
                                    <span className="text-[11px] text-slate-200 truncate flex-1">
                                        {p.title.replace(/^SOLLET-KF\d+:\s*/, '')}
                                    </span>
                                    {ma && <IkonaObrazu size={11} className="shrink-0" style={{ color: themeConfig.hex }} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Warsztat ── */}
            <div className="lg:col-span-8 space-y-4">
                {!wybrana ? (
                    <div
                        className="rounded-3xl border p-10 text-center text-xs font-mono text-slate-500 leading-relaxed"
                        style={{ borderColor: themeConfig.borderHex }}
                    >
                        Wybierz kreację z listy. Zobaczysz kadr, z którego wyrosła, i opis, którym
                        zostanie narysowana — opis możesz poprawić przed rysowaniem.
                    </div>
                ) : (
                    <>
                        <div
                            className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] p-4 space-y-3"
                            style={{ borderColor: themeConfig.borderHex }}
                        >
                            <div>
                                <div className="text-[11px] font-bold text-slate-100">{wybrana.title}</div>
                                <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                    {wybrana.archetype} · {wybrana.anomalyType}
                                    {kadr?.tytulKadru && <> · kadr: {kadr.tytulKadru}</>}
                                </div>
                            </div>

                            {/* ⚠️ EDYTOWALNY. Model rysuje to, co napisano — a napisała to Rada. */}
                            <div>
                                <label className="text-[9px] font-mono text-slate-400 tracking-[0.15em] block mb-1">
                                    OPIS DLA SILNIKA <span className="text-slate-600">— popraw, jeśli rysunek ma być inny</span>
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={5}
                                    className="w-full bg-black/60 border rounded-xl px-3 py-2 text-[10px] font-mono text-slate-200 focus:outline-none leading-relaxed"
                                    style={{ borderColor: themeConfig.borderHex }}
                                />
                                <p className="text-[9px] font-mono text-slate-600 mt-1">
                                    Po angielsku — enkoder FLUX-a rozumie go lepiej niż polski.
                                    Pisz o TKANINIE, KROJU i ŚWIETLE; im mniej fabuły, tym czystszy rysunek ubioru.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={() => void rysuj()}
                                    disabled={rysuje || prompt.trim().length < 10}
                                    className="px-4 py-1.5 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-30"
                                    style={{ color: themeConfig.hex, borderColor: themeConfig.hex, backgroundColor: `${themeConfig.hex}18` }}
                                >
                                    {rysuje
                                        ? <><Loader2 size={11} className="inline animate-spin mr-1.5" />RYSUJE… {Math.floor(odKiedy / 60)}:{String(odKiedy % 60).padStart(2, '0')}</>
                                        : <><Brush size={11} className="inline mr-1.5" />NARYSUJ FLUX-em</>}
                                </button>

                                {/* ⚠️ Mówimy, ile to trwa. Cisza przez siedem minut wygląda jak zwis. */}
                                <span className="text-[9px] font-mono text-slate-500">
                                    <Clock size={10} className="inline mr-1 -mt-0.5" />
                                    zmierzone 57–407 s — czas zależy od tego, ile wolnego VRAM-u
                                    zostawiły przeglądarka, launchery i Ollama
                                </span>
                            </div>

                            {blad && (
                                <div className="p-2.5 rounded-xl border border-red-500/40 bg-red-950/20 text-[10px] font-mono text-red-200 leading-relaxed">
                                    <AlertTriangle size={11} className="inline mr-1.5 -mt-0.5" />
                                    {blad}
                                </div>
                            )}
                        </div>

                        {/* ── Kadr obok rysunku: skąd wyrosło i co z tego wyszło ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-3xl border overflow-hidden" style={{ borderColor: themeConfig.borderHex }}>
                                <div className="px-3 py-2 text-[9px] font-mono text-slate-500 border-b" style={{ borderColor: themeConfig.borderHex }}>
                                    KADR — materiał wyjściowy
                                </div>
                                <div className="aspect-[4/3] bg-black/60">
                                    {kadr?.plik
                                        ? <img src={kadr.plik} alt={wybrana.title} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-slate-700">bez kadru</div>}
                                </div>
                            </div>

                            <div className="rounded-3xl border overflow-hidden" style={{ borderColor: themeConfig.borderHex }}>
                                <div className="px-3 py-2 text-[9px] font-mono text-slate-500 border-b flex items-center justify-between gap-2" style={{ borderColor: themeConfig.borderHex }}>
                                    <span>KREACJA — narysowana sztuka odzieży</span>
                                    {wiz && <span className="text-slate-600">{wiz.silnik} · {wiz.sekundy}s</span>}
                                </div>
                                <div className="aspect-[4/3] bg-black/60">
                                    {wiz
                                        ? <img src={adresKadru(wiz.plik)} alt={wybrana.title} className="w-full h-full object-contain" />
                                        : (
                                            <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-slate-700 text-center px-6 leading-relaxed">
                                                {rysuje ? 'FLUX rysuje…' : 'Jeszcze nienarysowana — wciśnij NARYSUJ.'}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
