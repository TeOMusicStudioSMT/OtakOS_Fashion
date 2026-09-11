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
import { Brush, Loader2, AlertTriangle, Image as IkonaObrazu, Clock, RotateCw, Shirt, Wand2 } from 'lucide-react';
import {
    pobierzWizualizacje, narysujKreacje, adresKadru,
    pobierzObroty, obrocKreacje, pobierzWarianty,
    type Wizualizacja, type Obrot, type DlugoscObrotu, type Wariant,
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

    // ── Dalsza obróbka: obrót produktu i warianty wzoru ──
    const [obroty, setObroty] = useState<Obrot[]>([]);
    const [dlugosci, setDlugosci] = useState<DlugoscObrotu[]>([]);
    const [klatek, setKlatek] = useState(49);
    const [obraca, setObraca] = useState(false);
    const [warianty, setWarianty] = useState<Wariant[]>([]);

    useEffect(() => {
        void pobierzWizualizacje().then(setWizualizacje).catch(() => setWizualizacje([]));
        void pobierzObroty()
            .then((d) => { setObroty(d.obroty); setDlugosci(d.dlugosci); })
            .catch(() => setObroty([]));
    }, []);

    // Licznik sekund — przy czekaniu liczonym w minutach cisza wygląda jak zwis.
    useEffect(() => {
        if (!rysuje && !obraca) return;
        const t = window.setInterval(() => setOdKiedy((s) => s + 1), 1000);
        return () => window.clearInterval(t);
    }, [rysuje, obraca]);

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

    const obrotPoId = useMemo(() => new Map(obroty.map((o) => [o.id, o])), [obroty]);

    /**
     * ⚠️ Obrót wychodzi Z NARYSOWANEJ KREACJI, nie z opisu. Bez klatki startowej
     * silnik wylosowałby inny strój, a panel pokazałby go jako „ten sam".
     */
    const obroc = async () => {
        if (!wybrana || !wiz) return;
        setObraca(true);
        setOdKiedy(0);
        setBlad('');
        try {
            const o = await obrocKreacje({ id: wybrana.id, nazwa: wiz.nazwa, klatek });
            setObroty((prev) => [o, ...prev.filter((x) => x.id !== o.id)]);
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        } finally {
            setObraca(false);
        }
    };

    const pokazWarianty = async () => {
        setBlad('');
        try {
            const d = await pobierzWarianty(prompt, 4);
            setWarianty(d.warianty);
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        }
    };

    const wiz = wybrana ? poId.get(wybrana.id) : null;
    const obrot = wybrana ? obrotPoId.get(wybrana.id) : null;
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

                        {/* ── DALSZA OBRÓBKA ──────────────────────────────────────
                            Suweren: „jak już wygeneruje, to można go przenieść do
                            dalszej obróbki, by skupić się na samym ubraniu i innych
                            wersjach tego wzoru".

                            ⚠️ Pojawia się DOPIERO po narysowaniu. Obrót potrzebuje
                            klatki startowej; oferowanie go wcześniej kończyłoby się
                            błędem albo — gorzej — wylosowaniem innego stroju. */}
                        {wiz && (
                            <div
                                className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] overflow-hidden"
                                style={{ borderColor: themeConfig.borderHex }}
                            >
                                <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: themeConfig.borderHex }}>
                                    <Shirt size={12} style={{ color: themeConfig.hex }} />
                                    <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: themeConfig.hex }}>
                                        DALSZA OBRÓBKA — sam produkt, bez wybiegu
                                    </span>
                                </div>

                                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* ── Obrót ── */}
                                    <div className="space-y-2.5">
                                        <div className="text-[9px] font-mono text-slate-500 leading-relaxed">
                                            Obrót wychodzi z <span className="text-slate-300">narysowanej kreacji</span> jako klatki
                                            startowej — kręci się TA suknia, nie podobna. Silnik: Wan 2.2 TI2V-5B (i2v, lokalnie).
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {dlugosci.map((d) => (
                                                <button
                                                    key={d.klatek}
                                                    onClick={() => setKlatek(d.klatek)}
                                                    disabled={obraca}
                                                    className="px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer disabled:opacity-40"
                                                    style={klatek === d.klatek
                                                        ? { backgroundColor: themeConfig.subtleHex, color: themeConfig.hex, border: `1px solid ${themeConfig.borderHex}` }
                                                        : { color: '#94a3b8', border: '1px solid transparent' }}
                                                    title={d.opis}
                                                >
                                                    {d.klatek} kl.
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => void obroc()}
                                            disabled={obraca || rysuje}
                                            className="w-full py-2.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ backgroundColor: themeConfig.subtleHex, color: themeConfig.hex, border: `1px solid ${themeConfig.borderHex}` }}
                                        >
                                            {obraca
                                                ? <><Loader2 size={12} className="animate-spin" /> OBRACA — {odKiedy}s</>
                                                : <><RotateCw size={12} /> OBRÓĆ PRODUKT</>}
                                        </button>

                                        {/* ⚠️ Czas mówimy WPROST. Zmierzone na tym sprzęcie, nie obiecane. */}
                                        <div className="text-[9px] font-mono text-slate-600 flex items-center gap-1.5">
                                            <Clock size={9} />
                                            {obraca
                                                ? 'Wan liczy — na tej karcie zmierzono 171–257 s. Nie zamykaj karty.'
                                                : 'Trwa 3–5 minut. Karta graficzna musi być wolna.'}
                                        </div>

                                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: themeConfig.borderHex }}>
                                            <div className="px-3 py-1.5 text-[9px] font-mono text-slate-500 border-b flex items-center justify-between gap-2" style={{ borderColor: themeConfig.borderHex }}>
                                                <span>OBRÓT PRODUKTU</span>
                                                {obrot && <span className="text-slate-600">{obrot.silnik} · {obrot.sekundy}s</span>}
                                            </div>
                                            <div className="aspect-[4/3] bg-black/60">
                                                {obrot
                                                    ? (
                                                        <video
                                                            src={adresKadru(obrot.plik)}
                                                            controls
                                                            loop
                                                            muted
                                                            playsInline
                                                            className="w-full h-full object-contain"
                                                        />
                                                    )
                                                    : (
                                                        <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-slate-700 text-center px-6 leading-relaxed">
                                                            {obraca ? 'Wan obraca…' : 'Jeszcze nieobrócona.'}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Warianty wzoru ── */}
                                    <div className="space-y-2.5">
                                        <div className="text-[9px] font-mono text-slate-500 leading-relaxed">
                                            Warianty zdejmują z opisu wybieg, modelkę i inscenizację, zostawiając sam krój.
                                            Kliknięcie wstawia opis do pola wyżej — potem zwykłe <span className="text-slate-300">NARYSUJ</span>.
                                        </div>

                                        <button
                                            onClick={() => void pokazWarianty()}
                                            disabled={!prompt.trim()}
                                            className="w-full py-2 rounded-xl text-[11px] font-mono transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 border text-slate-300"
                                            style={{ borderColor: themeConfig.borderHex }}
                                        >
                                            <Wand2 size={12} /> POKAŻ WERSJE TEGO WZORU
                                        </button>

                                        {/* ⚠️ Podpis mówi wprost: to przepisanie tekstu, nie model.
                                            Bez tego wyglądałoby na „AI wymyśliło warianty". */}
                                        {warianty.length > 0 && (
                                            <div className="text-[9px] font-mono text-slate-600">
                                                silnik: przepisanie opisu (NIE AI)
                                            </div>
                                        )}

                                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                                            {warianty.map((w) => (
                                                <button
                                                    key={w.nazwa}
                                                    onClick={() => setPrompt(w.prompt)}
                                                    className="w-full text-left p-2.5 rounded-xl border bg-black/30 hover:bg-black/10 transition-all cursor-pointer"
                                                    style={{ borderColor: themeConfig.borderHex }}
                                                >
                                                    <div className="text-[10px] font-bold" style={{ color: themeConfig.hex }}>{w.nazwa}</div>
                                                    <div className="text-[9px] font-mono text-slate-500 line-clamp-2 leading-snug mt-0.5">
                                                        {w.prompt}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
