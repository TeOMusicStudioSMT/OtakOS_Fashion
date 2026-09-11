/**
 * Nagłówek TeO Fashion Studio.
 *
 * OtakOS to nazwa SILNIKA, Katedry i Uniwersum — nie studia. Studia noszą nazwy
 * TeO (Story, Music, App, Games, Fashion); „OtakOS" zostaje w znaczku 0.00G.
 *
 * ⚠️ NAPRAWIONY BŁĄD: cztery różne widoki nosiły podpis „Galeria". Kafelek został
 * skopiowany przy dodawaniu zakładek i podpisu nikt nie zmienił — menu wyglądało
 * jak cztery razy to samo. Nazwa zakładki jest jedyną rzeczą, po której człowiek
 * poznaje, dokąd idzie.
 *
 * ⚠️ DWA POZIOMY, NIE JEDNA ŚCIANA. Cztery zakładki, które faktycznie robią robotę
 * (Galeria / Krawiec / Brand / F-Ai), stoją z przodu. Widoki z szablonu AI Studio
 * operują na samych opisach i nie znają prawdziwych kadrów — siedzą w „więcej",
 * bo są ciekawostką, a nie warsztatem. Nie kasuję ich: działają i szkoda ich wyrzucać.
 */

import React, { useState } from 'react';
import { ViewMode } from '../types';
import {
    Sparkles, Download, Layers, Grid3X3, Palette, Code2,
    Scissors, BadgeCheck, Brain, ChevronDown,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    totalPieces: number;
    solitaCount: number;
    molitaCount: number;
    sovereignCount: number;
    onExportJson: () => void;
}

/** Warsztat — to, co pracuje na prawdziwych kadrach Katedry. */
const GLOWNE: { id: ViewMode; nazwa: string; Ikona: React.ElementType }[] = [
    { id: 'galeria', nazwa: 'Galeria', Ikona: Layers },
    { id: 'kreacja', nazwa: 'Krawiec', Ikona: Scissors },
    { id: 'marki', nazwa: 'Brand', Ikona: BadgeCheck },
    { id: 'ai', nazwa: 'F-Ai', Ikona: Brain },
];

/** Widoki z szablonu — działają na opisach, nie na obrazach. */
const DODATKOWE: { id: ViewMode; nazwa: string; Ikona: React.ElementType }[] = [
    { id: 'runway-cards', nazwa: 'Runway Cards', Ikona: Layers },
    { id: 'blueprint-matrix', nazwa: 'Blueprint Matrix', Ikona: Grid3X3 },
    { id: 'moodboard', nazwa: 'Moodboard', Ikona: Palette },
    { id: 'ai-stylist', nazwa: 'AI Stylist Lab', Ikona: Sparkles },
    { id: 'raw-json', nazwa: 'JSON Stream', Ikona: Code2 },
];

export const Header: React.FC<HeaderProps> = ({
    viewMode, setViewMode, totalPieces,
    solitaCount, molitaCount, sovereignCount, onExportJson,
}) => {
    const { themeConfig } = useTheme();
    const [wiecejOtwarte, setWiecejOtwarte] = useState(false);
    const wDodatkowych = DODATKOWE.find((d) => d.id === viewMode);

    return (
        <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-[#050608]/90 backdrop-blur-md transition-colors">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

                {/* ── Znak firmowy ── */}
                <div className="flex items-baseline gap-2.5">
                    <span className="font-syne text-base font-extrabold uppercase tracking-[0.18em] text-white">
                        TeO Fashion Studio
                    </span>
                    <span
                        className="rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wider transition-colors"
                        style={{
                            backgroundColor: themeConfig.subtleHex,
                            color: themeConfig.hex,
                            borderColor: themeConfig.borderHex,
                        }}
                    >
                        0.00G
                    </span>
                    {/* Krótko i po polsku — długi angielski podpis rozpychał nagłówek. */}
                    <span className="hidden font-mono text-[10px] text-neutral-500 sm:inline">
                        SOLLET · {totalPieces} koncepcji
                    </span>
                </div>

                {/* ── Nastrój + liczniki ── */}
                <div className="flex items-center justify-between gap-3 lg:justify-center">
                    <ThemeSwitcher />
                    <div className="hidden items-center gap-3 border-l border-neutral-800/80 pl-3 font-mono text-[11px] xl:flex">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-[#00ff66]" />Solita ({solitaCount})
                        </span>
                        <span className="flex items-center gap-1.5 text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-[#0055ff]" />Molita ({molitaCount})
                        </span>
                        <span className="flex items-center gap-1.5 text-neutral-300">
                            <span className="h-2 w-2 rounded-full bg-[#ff5500]" />Sovereign ({sovereignCount})
                        </span>
                    </div>
                </div>

                {/* ── Nawigacja ── */}
                <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
                    <div className="flex items-center rounded-lg border border-neutral-800 bg-[#090b10] p-0.5">
                        {GLOWNE.map(({ id, nazwa, Ikona }) => {
                            const aktywna = viewMode === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setViewMode(id)}
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs transition-all ${
                                        aktywna ? 'bg-neutral-800 font-semibold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                                    style={aktywna ? { color: themeConfig.hex } : {}}
                                >
                                    <Ikona className="h-3.5 w-3.5" />
                                    <span>{nazwa}</span>
                                </button>
                            );
                        })}

                        {/* ── więcej: widoki z szablonu ── */}
                        <div className="relative">
                            <button
                                onClick={() => setWiecejOtwarte((o) => !o)}
                                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-mono text-xs transition-all ${
                                    wDodatkowych ? 'bg-neutral-800 font-semibold shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                                style={wDodatkowych ? { color: themeConfig.hex } : {}}
                            >
                                <span>{wDodatkowych ? wDodatkowych.nazwa : 'więcej'}</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${wiecejOtwarte ? 'rotate-180' : ''}`} />
                            </button>

                            {wiecejOtwarte && (
                                <>
                                    {/* Niewidoczne tło łapie klik obok — bez tego lista zostaje otwarta. */}
                                    <div className="fixed inset-0 z-40" onClick={() => setWiecejOtwarte(false)} />
                                    <div
                                        className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border bg-[#090b10] shadow-2xl"
                                        style={{ borderColor: themeConfig.borderHex }}
                                    >
                                        <p className="border-b border-neutral-800 px-3 py-1.5 font-mono text-[9px] leading-relaxed text-neutral-500">
                                            Widoki z szablonu — działają na opisach, nie na kadrach.
                                        </p>
                                        {DODATKOWE.map(({ id, nazwa, Ikona }) => (
                                            <button
                                                key={id}
                                                onClick={() => { setViewMode(id); setWiecejOtwarte(false); }}
                                                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-neutral-800/70 ${
                                                    viewMode === id ? 'font-semibold' : 'text-neutral-400'
                                                }`}
                                                style={viewMode === id ? { color: themeConfig.hex } : {}}
                                            >
                                                <Ikona className="h-3.5 w-3.5" />
                                                <span>{nazwa}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onExportJson}
                        title="Pobierz pełny katalog.json"
                        className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-neutral-300 transition-all hover:bg-neutral-800"
                        style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">katalog.json</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
