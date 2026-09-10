/**
 * 🏷️ MARKI — kto firmuje kreację, i ile to jest warte.
 *
 * Suweren: „marki, które będą swe logo na brand nakładać z automatu",
 * „wartości wyświetlane w GRV, mierzone na assetach portfolio".
 *
 * ⚠️ WYCENA MA POKAZAĆ SKŁADNIKI, NIE SAMĄ SUMĘ. Marka nosi jawną stawkę GRV
 * za sztukę, którą ustawia człowiek; panel mnoży ją przez POLICZONE assety.
 * Wymyślenie „algorytmu wyceny mody" dałoby liczbę wyglądającą na wiedzę,
 * a będącą zgadywanką — i ktoś oparłby na niej decyzję.
 *
 * ⚠️ NAKŁADANIE ODMAWIA, GDY LOGO SIĘ NIE ODZNACZY. Serwer porównuje prostokąt,
 * w który logo trafia; przezroczysty plik daje tam PSNR `inf` i zostaje
 * odrzucony. Cichy sukces bez logo byłby gorszy niż błąd — Suweren wystawiłby
 * nieofirmowaną kreację jako ofirmowaną.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Tag, Upload, Trash2, Stamp, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
    pobierzMarki, zapiszMarke, usunMarke, wgrajLogo, nalozLogo, naBase64,
    type Marka, type Portfolio,
} from '../services/marki';
import { pobierzWizualizacje, adresKadru, type Wizualizacja } from '../services/kreacja';

export function Marki() {
    const { themeConfig } = useTheme();
    const [marki, setMarki] = useState<Marka[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [rogi, setRogi] = useState<string[]>([]);
    const [wizualizacje, setWizualizacje] = useState<Wizualizacja[]>([]);
    const [nowa, setNowa] = useState('');
    const [zajety, setZajety] = useState('');
    const [blad, setBlad] = useState('');
    const [ofirmowane, setOfirmowane] = useState<Record<string, string>>({});

    const odswiez = useCallback(async () => {
        try {
            const d = await pobierzMarki();
            setMarki(d.marki);
            setPortfolio(d.portfolio);
            setRogi(d.rogi);
            setBlad('');
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        }
        void pobierzWizualizacje().then(setWizualizacje).catch(() => setWizualizacje([]));
    }, []);

    useEffect(() => { void odswiez(); }, [odswiez]);

    const zaloz = async () => {
        if (nowa.trim().length < 2) return;
        setZajety('nowa');
        try { await zapiszMarke({ nazwa: nowa.trim() }); setNowa(''); await odswiez(); }
        catch (e) { setBlad(e instanceof Error ? e.message : String(e)); }
        finally { setZajety(''); }
    };

    const zmien = async (m: Marka, zmiany: Partial<Marka>) => {
        try { await zapiszMarke({ ...m, ...zmiany }); await odswiez(); }
        catch (e) { setBlad(e instanceof Error ? e.message : String(e)); }
    };

    const logo = async (m: Marka, plik: File) => {
        setZajety(m.id);
        try { await wgrajLogo(m.id, await naBase64(plik), plik.name); await odswiez(); }
        catch (e) { setBlad(e instanceof Error ? e.message : String(e)); }
        finally { setZajety(''); }
    };

    const ofirmuj = async (m: Marka, w: Wizualizacja) => {
        setZajety(`${m.id}:${w.id}`);
        setBlad('');
        try {
            const r = await nalozLogo(m.id, w.plik, w.id);
            setOfirmowane((prev) => ({ ...prev, [`${m.id}:${w.id}`]: r.plik }));
            await odswiez();
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        } finally { setZajety(''); }
    };

    const ramka = { borderColor: themeConfig.borderHex };

    return (
        <div className="space-y-5">
            {/* ── Portfolio: podstawa każdej wyceny ── */}
            <div className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] p-4" style={ramka}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[10px] font-mono font-bold tracking-wider" style={{ color: themeConfig.hex }}>
                        <Tag size={12} className="inline mr-1.5 -mt-0.5" /> PORTFOLIO — podstawa wyceny
                    </div>
                    <button onClick={() => void odswiez()} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-all cursor-pointer">
                        <RefreshCw size={13} />
                    </button>
                </div>
                {portfolio && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                        {([
                            ['kreacje w katalogu', portfolio.kreacji],
                            ['narysowane', portfolio.narysowanych],
                            ['ofirmowane', portfolio.ofirmowanych],
                        ] as const).map(([co, ile]) => (
                            <div key={co} className="rounded-2xl border p-3 text-center" style={ramka}>
                                <div className="text-xl font-bold" style={{ color: themeConfig.hex }}>{ile}</div>
                                <div className="text-[9px] font-mono text-slate-500 mt-0.5">{co}</div>
                            </div>
                        ))}
                    </div>
                )}
                {/* ⚠️ Liczby są POLICZONE z plików, nie zadeklarowane. */}
                <p className="text-[9px] font-mono text-slate-600 mt-2 leading-relaxed">
                    Liczby policzone z realnych plików: katalog Rady + kreacje wykute przez Krawcową,
                    rysunki w wizualizacjach, pliki w <span className="text-slate-400">public/ofirmowane/</span>.
                </p>
            </div>

            {blad && (
                <div className="p-3 rounded-2xl border border-red-500/40 bg-red-950/20 text-[10px] font-mono text-red-200 leading-relaxed">
                    <AlertTriangle size={11} className="inline mr-1.5 -mt-0.5" />{blad}
                </div>
            )}

            {/* ── Nowa marka ── */}
            <div className="rounded-3xl border p-4 flex items-center gap-2 flex-wrap" style={ramka}>
                <input
                    value={nowa}
                    onChange={(e) => setNowa(e.target.value)}
                    placeholder="Nazwa nowej marki"
                    className="flex-1 min-w-[200px] bg-black/60 border rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-100 focus:outline-none"
                    style={ramka}
                />
                <button
                    onClick={() => void zaloz()}
                    disabled={zajety === 'nowa' || nowa.trim().length < 2}
                    className="px-4 py-1.5 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-30"
                    style={{ color: themeConfig.hex, borderColor: themeConfig.hex, backgroundColor: `${themeConfig.hex}18` }}
                >
                    ZAŁÓŻ MARKĘ
                </button>
            </div>

            {/* ── Marki ── */}
            {marki.map((m) => (
                <div key={m.id} className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] p-4 space-y-3" style={ramka}>
                    <div className="flex items-start gap-3 flex-wrap">
                        <div className="w-16 h-16 rounded-2xl border bg-black/60 flex items-center justify-center overflow-hidden shrink-0" style={ramka}>
                            {m.logo
                                ? <img src={`/api/marki/logo/${encodeURIComponent(m.logo)}`} alt={m.nazwa} className="w-full h-full object-contain" />
                                : <span className="text-[8px] font-mono text-slate-700 text-center px-1">bez logo</span>}
                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <div className="text-[12px] font-bold text-slate-100">{m.nazwa}</div>
                            <div className="text-[9px] font-mono text-slate-500">{m.opis || 'bez opisu'}</div>
                            <div className="text-lg font-bold mt-1" style={{ color: themeConfig.hex }}>
                                {m.wycena.razem.toLocaleString('pl-PL')} GRV
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-full text-[10px] font-mono border cursor-pointer hover:bg-white/[0.05] transition-all" style={ramka}>
                                {zajety === m.id ? <Loader2 size={10} className="inline animate-spin mr-1" /> : <Upload size={10} className="inline mr-1" />}
                                LOGO
                                <input
                                    type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void logo(m, f); }}
                                />
                            </label>
                            <button
                                onClick={async () => { try { await usunMarke(m.id); await odswiez(); } catch (e) { setBlad(String(e)); } }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-all cursor-pointer"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* ── Rozbicie wyceny: widać każdy GRV ── */}
                    <div className="rounded-2xl border p-3" style={ramka}>
                        <table className="w-full text-[10px] font-mono">
                            <tbody>
                                {m.wycena.skladniki.map((s) => (
                                    <tr key={s.co} className="text-slate-400">
                                        <td className="py-0.5">{s.co}</td>
                                        <td className="text-right text-slate-300">{s.ile}</td>
                                        <td className="text-right text-slate-600 px-2">× {s.stawka}</td>
                                        <td className="text-right text-slate-200">{s.grv.toLocaleString('pl-PL')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-[9px] font-mono text-slate-600 mt-2 leading-relaxed">
                            ⚠️ Stawki ustawia człowiek — to przelicznik przyjęty przez Suwerena,
                            nie wycena rynkowa.
                        </p>
                    </div>

                    {/* ── Ustawienia znaku ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono text-slate-500">róg</span>
                            <select
                                value={m.rog}
                                onChange={(e) => void zmien(m, { rog: e.target.value })}
                                className="bg-black/60 border rounded-xl px-2 py-1.5 text-[10px] font-mono text-slate-100 focus:outline-none cursor-pointer"
                                style={ramka}
                            >
                                {rogi.map((r) => <option key={r} value={r} className="bg-slate-950">{r.replace('-', ' ')}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono text-slate-500">wielkość (% szer.)</span>
                            <input
                                type="number" min={3} max={50} step={1}
                                value={Math.round(m.skala * 100)}
                                onChange={(e) => void zmien(m, { skala: Number(e.target.value) / 100 })}
                                className="bg-black/60 border rounded-xl px-2 py-1.5 text-[10px] font-mono text-slate-100 focus:outline-none"
                                style={ramka}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono text-slate-500">krycie (%)</span>
                            <input
                                type="number" min={5} max={100} step={5}
                                value={Math.round(m.krycie * 100)}
                                onChange={(e) => void zmien(m, { krycie: Number(e.target.value) / 100 })}
                                className="bg-black/60 border rounded-xl px-2 py-1.5 text-[10px] font-mono text-slate-100 focus:outline-none"
                                style={ramka}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono text-slate-500">GRV za ofirmowaną</span>
                            <input
                                type="number" min={0} step={10}
                                value={m.stawki.zaOfirmowana}
                                onChange={(e) => void zmien(m, { stawki: { ...m.stawki, zaOfirmowana: Number(e.target.value) } })}
                                className="bg-black/60 border rounded-xl px-2 py-1.5 text-[10px] font-mono text-slate-100 focus:outline-none"
                                style={ramka}
                            />
                        </label>
                    </div>

                    {/* ── Ofirmowanie z automatu ── */}
                    {!wizualizacje.length ? (
                        <p className="text-[10px] font-mono text-slate-500 italic">
                            Nie ma jeszcze narysowanych kreacji. Narysuj coś w zakładce KREACJA — logo nakłada się na rysunek, nie na kadr.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                            {wizualizacje.map((w) => {
                                const klucz = `${m.id}:${w.id}`;
                                const gotowe = ofirmowane[klucz];
                                return (
                                    <div key={w.id} className="rounded-xl overflow-hidden border bg-black/40" style={ramka}>
                                        <div className="aspect-square bg-black/60">
                                            <img
                                                src={gotowe ?? adresKadru(w.plik)}
                                                alt={w.id}
                                                loading="lazy"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <button
                                            onClick={() => void ofirmuj(m, w)}
                                            disabled={!!zajety || !m.logo}
                                            title={m.logo ? 'Nałóż logo tej marki na tę kreację' : 'Najpierw wgraj logo marki'}
                                            className="w-full px-2 py-1 text-[9px] font-mono font-bold border-t transition-all cursor-pointer disabled:opacity-30"
                                            style={{ ...ramka, color: gotowe ? themeConfig.hex : undefined }}
                                        >
                                            {zajety === klucz
                                                ? <><Loader2 size={9} className="inline animate-spin mr-1" />…</>
                                                : gotowe ? '✓ OFIRMOWANA' : <><Stamp size={9} className="inline mr-1" />OFIRMUJ</>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}

            {!marki.length && (
                <div className="rounded-3xl border p-10 text-center text-xs font-mono text-slate-500" style={ramka}>
                    Żadnej marki jeszcze nie ma. Załóż pierwszą powyżej, wgraj jej logo,
                    a potem ofirmuj nim narysowane kreacje.
                </div>
            )}
        </div>
    );
}
