/**
 * 🧠 AI — DOZORCA. Pilnuje życia produktu i mówi, co stoi.
 *
 * Suweren: „AI — coś, co to pochwyta i będzie jakoś zarządzać i monitorować
 * życie produktu".
 *
 * ⚠️ ŻADNEJ LICZBY BEZ NASTĘPNEGO KROKU. Wskaźnik, z którego nie wynika,
 * co zrobić, jest ozdobą. Każdy etap lejka niesie zdanie „co dalej", a każda
 * przeszkoda wskazuje winowajcę z nazwy — bo „coś nie działa" zmusza człowieka
 * do zgadywania.
 *
 * ⚠️ DOZORCA NIC NIE URUCHAMIA SAM. Agent, który z własnej woli rusza sto
 * renderów, potrafi zająć kartę graficzną na dobę bez pytania.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Brain, RefreshCw, Loader2, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Etap { co: string; ile: number; z: number; dalej: string | null }
interface Przeszkoda { co: string; czemu: string; waga: 'blokuje' | 'spowalnia' }
interface Przeglad {
    lejek: Etap[];
    przeszkody: Przeszkoda[];
    surowiec: { kadrowWKatedrze: number; katedraZywa: boolean };
    silniki: { krawiec: { zywy: boolean; model: string; powod: string | null } };
    marki: { nazwa: string; maLogo: boolean }[];
    stanNa: string;
}

export function Dozorca() {
    const { themeConfig } = useTheme();
    const [d, setD] = useState<Przeglad | null>(null);
    const [laduje, setLaduje] = useState(false);
    const [blad, setBlad] = useState('');

    const odswiez = useCallback(async () => {
        setLaduje(true);
        try {
            const r = await fetch('/api/ai/przeglad');
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error ?? `HTTP ${r.status}`);
            setD(j);
            setBlad('');
        } catch (e) {
            setBlad(e instanceof Error ? e.message : String(e));
        } finally { setLaduje(false); }
    }, []);

    useEffect(() => { void odswiez(); }, [odswiez]);

    const ramka = { borderColor: themeConfig.borderHex };

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] p-4" style={ramka}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[10px] font-mono font-bold tracking-wider" style={{ color: themeConfig.hex }}>
                        <Brain size={12} className="inline mr-1.5 -mt-0.5" /> DOZORCA — życie produktu
                    </div>
                    <div className="flex items-center gap-2">
                        {d && (
                            <span className="text-[9px] font-mono text-slate-600">
                                stan na {new Date(d.stanNa).toLocaleTimeString('pl-PL')}
                            </span>
                        )}
                        <button onClick={() => void odswiez()} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-all cursor-pointer">
                            {laduje ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                    </div>
                </div>
                <p className="text-[9px] font-mono text-slate-600 mt-1.5 leading-relaxed">
                    Dozorca patrzy i mówi — <span className="text-slate-400">nie uruchamia niczego sam</span>.
                    Wszystkie liczby są policzone z realnych plików.
                </p>
            </div>

            {blad && (
                <div className="p-3 rounded-2xl border border-red-500/40 bg-red-950/20 text-[10px] font-mono text-red-200">
                    <AlertTriangle size={11} className="inline mr-1.5 -mt-0.5" />{blad}
                </div>
            )}

            {/* ── Przeszkody na górze: to one blokują, nie liczby ── */}
            {d && d.przeszkody.length > 0 && (
                <div className="space-y-2">
                    {d.przeszkody.map((p, i) => (
                        <div
                            key={i}
                            className={`p-3 rounded-2xl border text-[10px] font-mono leading-relaxed ${
                                p.waga === 'blokuje'
                                    ? 'border-red-500/40 bg-red-950/20 text-red-200'
                                    : 'border-amber-500/35 bg-amber-950/15 text-amber-200'
                            }`}
                        >
                            <AlertTriangle size={11} className="inline mr-1.5 -mt-0.5" />
                            <span className="font-bold">{p.co}</span>
                            <span className="opacity-60"> · {p.waga}</span>
                            <div className="mt-1 opacity-90">{p.czemu}</div>
                        </div>
                    ))}
                </div>
            )}

            {d && !d.przeszkody.length && (
                <div className="p-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/10 text-[10px] font-mono text-emerald-200">
                    <CheckCircle2 size={11} className="inline mr-1.5 -mt-0.5" />
                    Nic nie blokuje. Silniki odpowiadają, marka ma logo, Katedra oddaje kadry.
                </div>
            )}

            {/* ── Lejek: ile przeszło i co dalej ── */}
            {d && (
                <div className="rounded-3xl border backdrop-blur-2xl bg-white/[0.03] overflow-hidden" style={ramka}>
                    {d.lejek.map((e, i) => {
                        const proc = e.z > 0 ? Math.round((e.ile / e.z) * 100) : 0;
                        return (
                            <div key={i} className="p-4 border-b last:border-b-0" style={ramka}>
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <span className="text-[11px] text-slate-200">{e.co}</span>
                                    <span className="text-[11px] font-mono">
                                        <span className="font-bold" style={{ color: themeConfig.hex }}>{e.ile}</span>
                                        <span className="text-slate-600"> z {e.z}</span>
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${proc}%`, backgroundColor: themeConfig.hex }}
                                    />
                                </div>
                                {/* ⚠️ To jest sedno: liczba bez tego zdania byłaby ozdobą. */}
                                {e.dalej && (
                                    <div className="text-[9px] font-mono text-slate-400 mt-2 leading-relaxed">
                                        <ArrowRight size={10} className="inline mr-1 -mt-0.5" style={{ color: themeConfig.hex }} />
                                        {e.dalej}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Surowiec i silniki ── */}
            {d && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border p-3" style={ramka}>
                        <div className="text-[9px] font-mono text-slate-500">SUROWIEC W KATEDRZE</div>
                        <div className="text-xl font-bold mt-1" style={{ color: themeConfig.hex }}>
                            {d.surowiec.kadrowWKatedrze}
                        </div>
                        <div className="text-[9px] font-mono text-slate-600">
                            kadrów z obrazem, gotowych do wykucia
                        </div>
                    </div>
                    <div className="rounded-2xl border p-3" style={ramka}>
                        <div className="text-[9px] font-mono text-slate-500">KRAWIEC</div>
                        <div className="text-[11px] font-mono mt-1" style={{ color: d.silniki.krawiec.zywy ? themeConfig.hex : '#f87171' }}>
                            {d.silniki.krawiec.zywy ? d.silniki.krawiec.model : 'nie odpowiada'}
                        </div>
                        <div className="text-[9px] font-mono text-slate-600 leading-relaxed">
                            {d.silniki.krawiec.zywy ? 'lokalnie, bez chmury' : (d.silniki.krawiec.powod ?? '')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
