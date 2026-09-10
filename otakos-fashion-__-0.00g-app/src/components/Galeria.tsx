/**
 * 🖼️ GALERIA — pierwsza tafla działu mody.
 *
 * Suweren: „pierwsza strona rollbox... to galeria obrazów w szklanym panelu,
 * gdzie są zakładki na obrazy do produkcji i gotowe kreacje, wszystko w formie
 * graficznego komponentu; po kliknięciu przechodzi się do kolejnej tafli".
 *
 * ⚠️ POKAZUJE PRAWDZIWY MATERIAŁ, NIE ATRAPY. Kafelki to 62 kadry policzone
 * w dziale filmowym (Wan 2.2, 960×544 i 704×480), związane z 62 koncepcjami
 * mody od Rady. Do 2026-09-10 aplikacja pokazywała same opisy — obrazy leżały
 * w katalogu, o którym nie wiedziała.
 *
 * ⚠️ PODZIAŁ NA ZAKŁADKI JEST UCZCIWY, nie dekoracyjny:
 *   · DO PRODUKCJI — koncepcja ma obraz, ale to KADR FILMOWY, nie kreacja.
 *     Pokazuje postać w scenie, nie projekt ubioru. To materiał wyjściowy.
 *   · GOTOWE KREACJE — pozycje oznaczone jako domknięte. Dziś PUSTE i tak
 *     napisane, bo żadna kreacja jeszcze nie powstała. Zakładka udająca
 *     zawartość byłaby gorsza niż pusta.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { SolletPiece } from '../types';
import { obrazDlaKlatki, METODA_WIAZANIA, ZE_ZDJECIEM } from '../data/powiazania';
import { useTheme } from '../context/ThemeContext';
import { Lupa } from './Lupa';
import { ImageOff, Layers, Sparkles, Info, Hammer, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import {
    pobierzProjekty, pobierzKadry, pobierzKreacje, wykujZKadru, adresKadru,
    type KadrProdukcji, type KreacjaZKadru,
} from '../services/jajo';

/**
 * ⚠️ TRZECIA KOLUMNA ŻYJE Z KATEDRY, nie z katalogu tej aplikacji.
 * Suweren: „połączyć katalog produkcyjny ze Story, tak by AI z Fashion widziały
 * KADRY — zawsze mają z czego robić”. Dział filmowy ma 217 policzonych kadrów
 * w SOLLET i 156 w alchemicznej fluktuacji.
 */
type Zakladka = 'do-produkcji' | 'gotowe' | 'z-kadrow';

interface Props {
    pieces: SolletPiece[];
    /** Klik w kafelek — przejście do kolejnej tafli (inspektor). */
    onWybierz: (piece: SolletPiece) => void;
}

export function Galeria({ pieces, onWybierz }: Props) {
    const { themeConfig } = useTheme();
    const [zakladka, setZakladka] = useState<Zakladka>('do-produkcji');

    // ── 🥚 Jajo Mody ─────────────────────────────────────────
    const [projekty, setProjekty] = useState<string[]>([]);
    const [projekt, setProjekt] = useState('');
    const [kadry, setKadry] = useState<KadrProdukcji[]>([]);
    const [kute, setKute] = useState<KreacjaZKadru[]>([]);
    const [kuje, setKuje] = useState('');
    const [bladJaja, setBladJaja] = useState('');
    const [ladujeKadry, setLadujeKadry] = useState(false);

    const odswiezJajo = useCallback(async (p: string) => {
        if (!p) return;
        setLadujeKadry(true);
        setBladJaja('');
        try {
            // ⚠️ Tylko kadry będące OBRAZEM — Jajo patrzy na klatki, nie na ujęcia wideo.
            const k = await pobierzKadry(p);
            setKadry(k.filter((x) => x.obraz));
        } catch (e) {
            setKadry([]);
            setBladJaja(e instanceof Error ? e.message : String(e));
        } finally {
            setLadujeKadry(false);
        }
    }, []);

    useEffect(() => {
        if (zakladka !== 'z-kadrow') return;
        void pobierzProjekty()
            .then((p) => { setProjekty(p); setProjekt((prev) => prev || p[0] || ''); })
            .catch((e) => setBladJaja(e instanceof Error ? e.message : String(e)));
        void pobierzKreacje().then(setKute).catch(() => setKute([]));
    }, [zakladka]);

    useEffect(() => { void odswiezJajo(projekt); }, [projekt, odswiezJajo]);

    const kuj = async (kadr: KadrProdukcji) => {
        setKuje(kadr.id);
        setBladJaja('');
        try {
            const k = await wykujZKadru(projekt, kadr.id);
            setKute((prev) => [k, ...prev]);
        } catch (e) {
            setBladJaja(e instanceof Error ? e.message : String(e));
        } finally {
            setKuje('');
        }
    };

    const zObrazem = useMemo(
        () => pieces.filter((p) => !!obrazDlaKlatki(p.keyframe)?.plik),
        [pieces],
    );
    // ⚠️ Pusta z rozmysłem — patrz nagłówek. Gdy pojawi się pole „domkniete",
    // ten filtr je odczyta; dopóki nie ma, mówimy prawdę zamiast zapełniać.
    const gotowe: SolletPiece[] = useMemo(() => [], []);

    const widoczne = zakladka === 'do-produkcji' ? zObrazem : gotowe;

    return (
        <div className="space-y-5">
            {/* ── Szklana tafla z zakładkami ── */}
            <div
                className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] overflow-hidden transition-colors"
                style={{ borderColor: themeConfig.borderHex }}
            >
                <div className="flex flex-wrap items-center gap-2 p-4 border-b" style={{ borderColor: themeConfig.borderHex }}>
                    {([
                        ['do-produkcji', 'OBRAZY DO PRODUKCJI', zObrazem.length],
                        ['gotowe', 'GOTOWE KREACJE', gotowe.length],
                        ['z-kadrow', 'Z KADRÓW KATEDRY', kute.length],
                    ] as const).map(([id, etykieta, ile]) => (
                        <button
                            key={id}
                            onClick={() => setZakladka(id)}
                            className={`px-4 py-2 rounded-full text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer border ${
                                zakladka === id ? 'text-black' : 'text-slate-400 border-white/10 hover:text-slate-100'
                            }`}
                            style={zakladka === id
                                ? { backgroundColor: themeConfig.hex, borderColor: themeConfig.hex }
                                : undefined}
                        >
                            {etykieta} · {ile}
                        </button>
                    ))}

                    <span className="ml-auto text-[10px] font-mono text-slate-500">
                        {ZE_ZDJECIEM} z {pieces.length} koncepcji ma obraz
                    </span>
                </div>

                {/* ⚠️ Skąd wzięła się para koncepcja↔obraz. To DOMYSŁ i ma być widoczny. */}
                <div className="px-4 py-2 text-[10px] font-mono text-slate-500 border-b" style={{ borderColor: themeConfig.borderHex }}>
                    <Info size={11} className="inline mr-1.5 -mt-0.5" />
                    Para koncepcja↔obraz z domysłu: {METODA_WIAZANIA}. Poprawisz w
                    <span className="text-slate-300"> OtakOs_Fashion/powiazania.json</span>.
                </div>

                {/* ── 🥚 TRZECIA KOLUMNA: KADRY Z KATEDRY ── */}
                {zakladka === 'z-kadrow' && (
                    <div className="p-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={projekt}
                                onChange={(e) => setProjekt(e.target.value)}
                                className="bg-black/60 border rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-100 focus:outline-none cursor-pointer"
                                style={{ borderColor: themeConfig.borderHex }}
                            >
                                {projekty.map((p) => <option key={p} value={p} className="bg-slate-950">{p}</option>)}
                                {!projekty.length && <option value="" className="bg-slate-950">— most milczy —</option>}
                            </select>
                            <button
                                onClick={() => void odswiezJajo(projekt)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-all cursor-pointer"
                                title="Odczytaj kadry ponownie"
                            >
                                {ladujeKadry ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                            </button>
                            <span className="text-[10px] font-mono text-slate-500">
                                {kadry.length} kadrów z obrazem · {kute.length} wykutych
                            </span>
                        </div>

                        {/* ⚠️ BŁĄD MÓWIMY WPROST. Pusta lista wygląda jak „projekt nie ma kadrów”,
                            a znaczy „Katedra nie jest odpalona” — to dwie różne rzeczy do zrobienia. */}
                        {bladJaja && (
                            <div className="p-3 rounded-2xl border border-red-500/40 bg-red-950/20 text-[10px] font-mono text-red-200 leading-relaxed">
                                <AlertTriangle size={11} className="inline mr-1.5 -mt-0.5" />
                                {bladJaja}
                            </div>
                        )}

                        {/* Wykute kreacje — na górze, bo to one są wynikiem. */}
                        {kute.length > 0 && (
                            <div className="space-y-2">
                                {kute.map((k) => (
                                    <div key={k.id} className="p-3 rounded-2xl border bg-black/30 flex gap-3" style={{ borderColor: themeConfig.borderHex }}>
                                        <Lupa
                                            src={adresKadru(k.zKadru.plik)}
                                            alt={k.zKadru.tytul}
                                            className="w-24 h-20 rounded-xl shrink-0 bg-black/60"
                                        />
                                        <div className="min-w-0 space-y-1">
                                            <div className="text-[11px] font-bold text-slate-100">{k.title}</div>
                                            <div className="text-[9px] font-mono text-slate-500">
                                                z kadru: {k.zKadru.tytul} · silnik: <span className="text-slate-300">{k.silnik}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{k.fashionConcept}</div>
                                            {/* Co OKO zobaczyło — zapisane, bo to ono karmiło projekt. */}
                                            <div className="text-[9px] font-mono text-slate-600 line-clamp-2">oko: {k.coWidac}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Kadry do wykucia */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                            {kadry.slice(0, 60).map((k) => (
                                <div key={k.id} className="rounded-xl overflow-hidden border bg-black/40" style={{ borderColor: themeConfig.borderHex }}>
                                    <div className="aspect-[4/3] bg-black/60">
                                        <Lupa src={adresKadru(k.plik)} alt={k.tytul} className="w-full h-full" />
                                    </div>
                                    <div className="p-1.5">
                                        <div className="text-[9px] font-mono text-slate-400 truncate">{k.tytul}</div>
                                        <button
                                            onClick={() => void kuj(k)}
                                            disabled={!!kuje}
                                            title="Jajo spojrzy na ten kadr i zaprojektuje z niego kreację. Trwa minuty."
                                            className="mt-1 w-full px-2 py-1 rounded-full text-[9px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-30"
                                            style={{ color: themeConfig.hex, borderColor: themeConfig.borderHex }}
                                        >
                                            {kuje === k.id
                                                ? <><Loader2 size={9} className="inline animate-spin mr-1" />KUJE…</>
                                                : <><Hammer size={9} className="inline mr-1" />WYKUJ</>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {kadry.length > 60 && (
                            <p className="text-[9px] font-mono text-slate-600">
                                Pokazuję 60 z {kadry.length} — reszta czeka, żeby nie ładować setek obrazów naraz.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Kafelki ── */}
                {zakladka !== 'z-kadrow' && (
                <div className="p-4">
                    {!widoczne.length ? (
                        <div className="py-16 text-center">
                            <ImageOff size={28} className="mx-auto mb-3 text-slate-700" />
                            <p className="text-xs font-mono text-slate-500 max-w-lg mx-auto leading-relaxed">
                                {zakladka === 'gotowe'
                                    ? 'Żadna kreacja nie jest jeszcze domknięta. Ta zakładka zostaje pusta, '
                                      + 'dopóki coś w niej naprawdę nie stanie — wypełnianie jej kadrami '
                                      + 'z produkcji byłoby udawaniem, że projekt jest gotowy.'
                                    : 'Brak obrazów. Uruchom scripts/zwiaz-obrazy.mjs, żeby związać koncepcje z kadrami.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {widoczne.map((p) => {
                                const o = obrazDlaKlatki(p.keyframe);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => onWybierz(p)}
                                        className="group text-left rounded-2xl overflow-hidden border bg-black/40 hover:bg-black/20 transition-all cursor-pointer"
                                        style={{ borderColor: themeConfig.borderHex }}
                                    >
                                        <div className="aspect-[4/3] bg-black/60 overflow-hidden">
                                            {o?.plik ? (
                                                <Lupa
                                                    src={o.plik}
                                                    alt={p.title}
                                                    className="w-full h-full"
                                                    pelnyPodglad={false}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-slate-700">
                                                    bez obrazu
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2.5 space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                                                    style={{ color: themeConfig.hex, backgroundColor: `${themeConfig.hex}18` }}
                                                >
                                                    KF{String(p.keyframe).padStart(2, '0')}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-500 truncate">{p.archetype}</span>
                                            </div>

                                            {/* Tytuł KONCEPCJI — to jest projekt ubioru. */}
                                            <div className="text-[11px] font-bold text-slate-100 leading-snug line-clamp-2">
                                                {p.title.replace(/^SOLLET-KF\d+:\s*/, '')}
                                            </div>

                                            {/* ⚠️ Tytuł KADRU osobno — to inna rzecz niż koncepcja
                                                i mieszanie ich sugerowałoby, że obraz przedstawia projekt. */}
                                            {o?.tytulKadru && (
                                                <div className="text-[9px] font-mono text-slate-600 truncate">
                                                    kadr: {o.tytulKadru}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}
            </div>

            {/* ── Co to właściwie jest ── */}
            <div
                className="rounded-2xl border p-4 text-[10px] font-mono text-slate-400 leading-relaxed"
                style={{ borderColor: themeConfig.borderHex }}
            >
                <Layers size={12} className="inline mr-1.5 -mt-0.5" style={{ color: themeConfig.hex }} />
                Kafelki to <span className="text-slate-200">kadry filmowe</span> policzone w dziale
                filmowym Katedry — pokazują postać w scenie, nie projekt ubioru. Koncepcja mody
                (materiały, krój, tkanie, napięcie konstrukcyjne) żyje w opisie i otwiera się po kliknięciu.
                <br />
                <Sparkles size={12} className="inline mr-1.5 -mt-0.5" style={{ color: themeConfig.hex }} />
                Czego tu jeszcze nie ma: wizualizacji samej kreacji, widoku 3D i wyceny w GRV.
            </div>
        </div>
    );
}
