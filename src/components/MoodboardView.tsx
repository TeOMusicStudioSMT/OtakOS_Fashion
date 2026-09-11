import React, { useState, useMemo } from 'react';
import { SolletPiece, Archetype, ColorwayPillar } from '../types';
import {
  COLORWAY_METADATA,
  getPrimaryColorway,
  getAllColorways,
  generateAestheticSummary,
} from '../utils/moodboardUtils';
import { GlitchCanvas } from './GlitchCanvas';
import {
  Palette,
  Sparkles,
  Columns3,
  Grid3X3,
  Copy,
  Check,
  Eye,
  Terminal,
  FileText,
  Zap,
  Waves,
  Flame,
  Filter,
} from 'lucide-react';

interface MoodboardViewProps {
  pieces: SolletPiece[];
  onInspect: (piece: SolletPiece) => void;
}

type ArrangementMode = 'colorway-columns' | 'archetype-matrix' | 'colorway-focus';

export const MoodboardView: React.FC<MoodboardViewProps> = ({ pieces, onInspect }) => {
  const [arrangementMode, setArrangementMode] = useState<ArrangementMode>('colorway-columns');
  const [activeColorwayFocus, setActiveColorwayFocus] = useState<ColorwayPillar | 'All'>('All');
  const [activeArchetypeFocus, setActiveArchetypeFocus] = useState<Archetype | 'All'>('All');
  const [matchMode, setMatchMode] = useState<'primary' | 'all-swatches'>('primary');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Filter pieces based on internal moodboard filters
  const filteredPieces = useMemo(() => {
    return pieces.filter((p) => {
      if (activeArchetypeFocus !== 'All' && p.archetype !== activeArchetypeFocus) {
        return false;
      }
      if (activeColorwayFocus !== 'All') {
        if (matchMode === 'primary') {
          return getPrimaryColorway(p) === activeColorwayFocus;
        } else {
          return getAllColorways(p).includes(activeColorwayFocus);
        }
      }
      return true;
    });
  }, [pieces, activeArchetypeFocus, activeColorwayFocus, matchMode]);

  // Compute aesthetic summary for the active selection
  const aestheticSummary = useMemo(() => {
    return generateAestheticSummary(filteredPieces);
  }, [filteredPieces]);

  const copyAestheticBrief = () => {
    const brief = `=== OTAKOS FASHION // 0.00G CATHEDRAL AESTHETIC SUMMARY ===
Collection: SOLLET Couture Spec
Pieces in Selection: ${aestheticSummary.totalCount}

[CURATORIAL THESIS]
Tone: ${aestheticSummary.curatorialTone}
Atmosphere: ${aestheticSummary.atmosphericMood}
Palette Synthesis: ${aestheticSummary.paletteSynthesis}

[CHROMATIC DISTRIBUTION]
- Surgical Neon Green (#00FF66): ${aestheticSummary.colorwayCounts['Neon Green']} pieces (${aestheticSummary.colorwayPercentages['Neon Green']}%)
- Sharp Void Blue (#0055FF): ${aestheticSummary.colorwayCounts['Void Blue']} pieces (${aestheticSummary.colorwayPercentages['Void Blue']}%)
- Warm Alchemical Orange (#FF5500): ${aestheticSummary.colorwayCounts['Alchemical Orange']} pieces (${aestheticSummary.colorwayPercentages['Alchemical Orange']}%)

[ARCHETYPE BALANCE]
- Solita (Architectural/Crystalline): ${aestheticSummary.archetypeCounts['Solita']} (${aestheticSummary.archetypePercentages['Solita']}%)
- Molita (Fluid/Wave Collapse): ${aestheticSummary.archetypeCounts['Molita']} (${aestheticSummary.archetypePercentages['Molita']}%)
- Hybrid Sovereign (Transmutation): ${aestheticSummary.archetypeCounts['Hybrid Sovereign']} (${aestheticSummary.archetypePercentages['Hybrid Sovereign']}%)

[DOMINANT TEXTILES]
${aestheticSummary.dominantTextiles.map((t) => `• ${t.name} (${t.count}x)`).join('\n')}

[STRUCTURAL SILHOUETTE TENSIONS]
${aestheticSummary.dominantSilhouettes.map((s) => `• ${s.name} (${s.count}x)`).join('\n')}
`;
    navigator.clipboard.writeText(brief);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Group pieces for display
  const colorwayPillars: ColorwayPillar[] = ['Neon Green', 'Void Blue', 'Alchemical Orange'];
  const archetypes: Archetype[] = ['Solita', 'Molita', 'Hybrid Sovereign'];

  const piecesByColorway = useMemo(() => {
    const map: Record<ColorwayPillar, SolletPiece[]> = {
      'Neon Green': [],
      'Void Blue': [],
      'Alchemical Orange': [],
    };

    filteredPieces.forEach((p) => {
      if (matchMode === 'primary') {
        const pillar = getPrimaryColorway(p);
        map[pillar].push(p);
      } else {
        const pillars = getAllColorways(p);
        pillars.forEach((pillar) => {
          if (!map[pillar].some((item) => item.id === p.id)) {
            map[pillar].push(p);
          }
        });
      }
    });

    return map;
  }, [filteredPieces, matchMode]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. CURATORIAL AESTHETIC SUMMARY PANEL */}
      <section className="rounded-2xl border border-neutral-800 bg-[#07090e] p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00ff66]/10 via-[#0055ff]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#00ff66]" />
                <span className="font-mono text-xs text-[#00ff66] uppercase tracking-widest font-semibold">
                  TeO Fashion Studio // Curatorial Moodboard & Chromatic Codex
                </span>
              </div>
              <h2 className="font-syne font-extrabold text-2xl text-white">
                Aesthetic Summary of Selection ({aestheticSummary.totalCount} Haute Couture Pieces)
              </h2>
            </div>

            <button
              onClick={copyAestheticBrief}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-[#00ff66]/40 text-xs font-mono transition-all shrink-0"
              title="Copy aesthetic brief and metrics to clipboard"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4 text-[#00ff66]" />
                  <span className="text-[#00ff66] font-semibold">Copied Aesthetic Brief!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>Copy Curatorial Brief</span>
                </>
              )}
            </button>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Chromatic Pillar Balance (5 cols) */}
            <div className="lg:col-span-5 space-y-4 p-4 rounded-xl border border-neutral-800/80 bg-[#040508]/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                  Chromatic Resonance Distribution
                </span>
                <span className="text-neutral-500 text-[11px]">3 Pillars</span>
              </div>

              {/* Multi-segment distribution bar */}
              <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex shadow-inner border border-neutral-800">
                <div
                  style={{ width: `${aestheticSummary.colorwayPercentages['Neon Green']}%` }}
                  className="bg-[#00ff66] transition-all duration-500"
                  title={`Neon Green: ${aestheticSummary.colorwayPercentages['Neon Green']}%`}
                />
                <div
                  style={{ width: `${aestheticSummary.colorwayPercentages['Void Blue']}%` }}
                  className="bg-[#0055ff] transition-all duration-500"
                  title={`Void Blue: ${aestheticSummary.colorwayPercentages['Void Blue']}%`}
                />
                <div
                  style={{ width: `${aestheticSummary.colorwayPercentages['Alchemical Orange']}%` }}
                  className="bg-[#ff5500] transition-all duration-500"
                  title={`Alchemical Orange: ${aestheticSummary.colorwayPercentages['Alchemical Orange']}%`}
                />
              </div>

              {/* 3 Colorway Swatch Counters */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                
                {/* Neon Green Swatch */}
                <button
                  onClick={() =>
                    setActiveColorwayFocus(
                      activeColorwayFocus === 'Neon Green' ? 'All' : 'Neon Green'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activeColorwayFocus === 'Neon Green'
                      ? 'bg-[#00ff66]/15 border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                      : 'bg-[#06080d] border-neutral-800/90 hover:border-[#00ff66]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66]" />
                    <span className="text-neutral-400 text-[10px]">
                      {aestheticSummary.colorwayPercentages['Neon Green']}%
                    </span>
                  </div>
                  <div className="font-semibold text-white text-[11px] truncate">Neon Green</div>
                  <div className="text-neutral-400 text-[10px]">
                    {aestheticSummary.colorwayCounts['Neon Green']} pieces
                  </div>
                </button>

                {/* Void Blue Swatch */}
                <button
                  onClick={() =>
                    setActiveColorwayFocus(
                      activeColorwayFocus === 'Void Blue' ? 'All' : 'Void Blue'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activeColorwayFocus === 'Void Blue'
                      ? 'bg-[#0055ff]/15 border-[#0055ff] shadow-[0_0_15px_rgba(0,85,255,0.2)]'
                      : 'bg-[#06080d] border-neutral-800/90 hover:border-[#0055ff]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0055ff] shadow-[0_0_8px_#0055ff]" />
                    <span className="text-neutral-400 text-[10px]">
                      {aestheticSummary.colorwayPercentages['Void Blue']}%
                    </span>
                  </div>
                  <div className="font-semibold text-white text-[11px] truncate">Void Blue</div>
                  <div className="text-neutral-400 text-[10px]">
                    {aestheticSummary.colorwayCounts['Void Blue']} pieces
                  </div>
                </button>

                {/* Alchemical Orange Swatch */}
                <button
                  onClick={() =>
                    setActiveColorwayFocus(
                      activeColorwayFocus === 'Alchemical Orange' ? 'All' : 'Alchemical Orange'
                    )
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activeColorwayFocus === 'Alchemical Orange'
                      ? 'bg-[#ff5500]/15 border-[#ff5500] shadow-[0_0_15px_rgba(255,85,0,0.2)]'
                      : 'bg-[#06080d] border-neutral-800/90 hover:border-[#ff5500]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
                    <span className="text-neutral-400 text-[10px]">
                      {aestheticSummary.colorwayPercentages['Alchemical Orange']}%
                    </span>
                  </div>
                  <div className="font-semibold text-white text-[11px] truncate">Alchem. Orange</div>
                  <div className="text-neutral-400 text-[10px]">
                    {aestheticSummary.colorwayCounts['Alchemical Orange']} pieces
                  </div>
                </button>

              </div>
            </div>

            {/* Middle: Archetype Equilibrium (3 cols) */}
            <div className="lg:col-span-3 space-y-4 p-4 rounded-xl border border-neutral-800/80 bg-[#040508]/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                  Archetype Balance
                </span>
                <span className="text-neutral-500 text-[11px]">3 Forms</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {/* Solita */}
                <div
                  onClick={() =>
                    setActiveArchetypeFocus(
                      activeArchetypeFocus === 'Solita' ? 'All' : 'Solita'
                    )
                  }
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    activeArchetypeFocus === 'Solita'
                      ? 'bg-[#00ff66]/10 border-[#00ff66]/50'
                      : 'bg-[#06080d] border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#00ff66] font-semibold text-[11px]">Solita (Architectural)</span>
                    <span className="text-neutral-300 font-bold">{aestheticSummary.archetypeCounts['Solita']}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${aestheticSummary.archetypePercentages['Solita']}%` }}
                      className="bg-[#00ff66] h-full"
                    />
                  </div>
                </div>

                {/* Molita */}
                <div
                  onClick={() =>
                    setActiveArchetypeFocus(
                      activeArchetypeFocus === 'Molita' ? 'All' : 'Molita'
                    )
                  }
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    activeArchetypeFocus === 'Molita'
                      ? 'bg-[#0055ff]/10 border-[#0055ff]/50'
                      : 'bg-[#06080d] border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#66a3ff] font-semibold text-[11px]">Molita (Amorphous)</span>
                    <span className="text-neutral-300 font-bold">{aestheticSummary.archetypeCounts['Molita']}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${aestheticSummary.archetypePercentages['Molita']}%` }}
                      className="bg-[#0055ff] h-full"
                    />
                  </div>
                </div>

                {/* Sovereign */}
                <div
                  onClick={() =>
                    setActiveArchetypeFocus(
                      activeArchetypeFocus === 'Hybrid Sovereign' ? 'All' : 'Hybrid Sovereign'
                    )
                  }
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    activeArchetypeFocus === 'Hybrid Sovereign'
                      ? 'bg-[#ff5500]/10 border-[#ff5500]/50'
                      : 'bg-[#06080d] border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#ff8844] font-semibold text-[11px]">Hybrid Sovereign</span>
                    <span className="text-neutral-300 font-bold">{aestheticSummary.archetypeCounts['Hybrid Sovereign']}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${aestheticSummary.archetypePercentages['Hybrid Sovereign']}%` }}
                      className="bg-[#ff5500] h-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Curatorial Synthesis & Atmosphere (4 cols) */}
            <div className="lg:col-span-4 space-y-3.5 p-4 rounded-xl border border-neutral-800/80 bg-[#040508]/80">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff66] font-semibold block mb-0.5">
                  Curatorial Character
                </span>
                <h4 className="font-syne font-bold text-sm text-white">
                  {aestheticSummary.curatorialTone}
                </h4>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                {aestheticSummary.atmosphericMood}
              </p>

              <div className="border-t border-neutral-800/80 pt-2.5">
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Palette Dialogue:
                </span>
                <p className="text-[11px] text-neutral-400 italic">
                  "{aestheticSummary.paletteSynthesis}"
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Dominant Textiles & Cuts in active selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/60 text-xs font-mono">
            <div>
              <span className="text-neutral-400 text-[10px] uppercase tracking-wider block mb-1.5">
                Dominant Cyber-Alchemical Textiles:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aestheticSummary.dominantTextiles.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]"
                  >
                    {t.name} <span className="text-neutral-500 font-bold">({t.count})</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-neutral-400 text-[10px] uppercase tracking-wider block mb-1.5">
                Structural Silhouette & 0.00G Tensions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aestheticSummary.dominantSilhouettes.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]"
                  >
                    {s.name} <span className="text-neutral-500 font-bold">({s.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MOODBOARD CONTROLS STRIP */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-[#080a0f] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Layout Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#00ff66]" /> Moodboard Arrangement:
          </span>

          <div className="flex items-center p-0.5 rounded-lg border border-neutral-800 bg-[#030406]">
            <button
              onClick={() => setArrangementMode('colorway-columns')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                arrangementMode === 'colorway-columns'
                  ? 'bg-neutral-800 text-[#00ff66] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Colorway Pavilions</span>
            </button>

            <button
              onClick={() => setArrangementMode('archetype-matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                arrangementMode === 'archetype-matrix'
                  ? 'bg-neutral-800 text-[#00ff66] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Archetype Matrix</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Swatch Buttons & Match Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Colorway filter pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveColorwayFocus('All')}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                activeColorwayFocus === 'All'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Colors
            </button>
            <button
              onClick={() => setActiveColorwayFocus('Neon Green')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeColorwayFocus === 'Neon Green'
                  ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/60 font-semibold'
                  : 'text-neutral-400 hover:text-[#00ff66]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
              <span>Neon Green</span>
            </button>
            <button
              onClick={() => setActiveColorwayFocus('Void Blue')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeColorwayFocus === 'Void Blue'
                  ? 'bg-[#0055ff]/20 text-[#66a3ff] border border-[#0055ff]/60 font-semibold'
                  : 'text-neutral-400 hover:text-[#66a3ff]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0055ff]" />
              <span>Void Blue</span>
            </button>
            <button
              onClick={() => setActiveColorwayFocus('Alchemical Orange')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeColorwayFocus === 'Alchemical Orange'
                  ? 'bg-[#ff5500]/20 text-[#ff8844] border border-[#ff5500]/60 font-semibold'
                  : 'text-neutral-400 hover:text-[#ff8844]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ff5500]" />
              <span>Alchemical Orange</span>
            </button>
          </div>

          {(activeColorwayFocus !== 'All' || activeArchetypeFocus !== 'All') && (
            <button
              onClick={() => {
                setActiveColorwayFocus('All');
                setActiveArchetypeFocus('All');
              }}
              className="text-xs font-mono text-neutral-400 hover:text-[#00ff66] underline ml-2"
            >
              Reset focus
            </button>
          )}
        </div>

      </div>

      {/* 3. MAIN MOODBOARD CONTENT */}
      {arrangementMode === 'colorway-columns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {colorwayPillars
            .filter((p) => activeColorwayFocus === 'All' || activeColorwayFocus === p)
            .map((pillar) => {
              const meta = COLORWAY_METADATA[pillar];
              const pillarPieces = piecesByColorway[pillar] || [];

              return (
                <div
                  key={pillar}
                  className={`rounded-2xl border ${meta.borderClass} bg-[#07090e] overflow-hidden flex flex-col transition-all ${meta.glowClass}`}
                >
                  {/* Pavilion Header Banner */}
                  <div className="p-5 border-b border-neutral-800/80 bg-[#040508] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-md"
                          style={{ backgroundColor: meta.hex }}
                        />
                        <h3 className="font-syne font-bold text-base text-white">
                          {meta.title}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 font-semibold">
                        {pillarPieces.length} pieces
                      </span>
                    </div>

                    <p className={`text-xs font-mono ${meta.accentClass} font-semibold`}>
                      {meta.tagline}
                    </p>

                    <p className="text-[11px] font-mono text-neutral-400 leading-relaxed pt-1">
                      {meta.atmosphericRole}
                    </p>

                    <div className="pt-2 border-t border-neutral-800/50 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Solita: {pillarPieces.filter((p) => p.archetype === 'Solita').length}</span>
                      <span>Molita: {pillarPieces.filter((p) => p.archetype === 'Molita').length}</span>
                      <span>Sovereign: {pillarPieces.filter((p) => p.archetype === 'Hybrid Sovereign').length}</span>
                    </div>
                  </div>

                  {/* Garment Moodboard Tiles in this Colorway */}
                  <div className="p-4 space-y-4 max-h-[1100px] overflow-y-auto">
                    {pillarPieces.length > 0 ? (
                      pillarPieces.map((piece) => (
                        <MoodboardTile
                          key={piece.id}
                          piece={piece}
                          pillar={pillar}
                          onInspect={onInspect}
                          onCopyPrompt={copyPrompt}
                          copiedPromptId={copiedPromptId}
                        />
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs font-mono text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                        No pieces match active filter in this colorway.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {arrangementMode === 'archetype-matrix' && (
        <div className="space-y-8">
          {archetypes
            .filter((arc) => activeArchetypeFocus === 'All' || activeArchetypeFocus === arc)
            .map((arc) => {
              const arcPieces = filteredPieces.filter((p) => p.archetype === arc);
              const arcBadge =
                arc === 'Solita'
                  ? 'border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]'
                  : arc === 'Molita'
                  ? 'border-[#0055ff]/40 bg-[#0055ff]/10 text-[#66a3ff]'
                  : 'border-[#ff5500]/40 bg-[#ff5500]/10 text-[#ff8844]';

              return (
                <div
                  key={arc}
                  className="rounded-2xl border border-neutral-800 bg-[#07090e] p-6 space-y-6 shadow-xl"
                >
                  {/* Archetype Section Title */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${arcBadge}`}>
                        {arc.toUpperCase()} ARCHETYPE
                      </span>
                      <span className="font-mono text-xs text-neutral-400">
                        {arc === 'Solita'
                          ? 'Architectural / Crystalline / Pre-Stressed Cantilever'
                          : arc === 'Molita'
                          ? 'Liquid Mercury / Amorphous / Sinusoidal Wave Collapse'
                          : 'Alchemical Calx / Thermonuclear Transmutation & Unified Sovereignty'}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-neutral-300">
                      {arcPieces.length} Pieces Total
                    </span>
                  </div>

                  {/* 3 Colorway Lanes for this Archetype */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {colorwayPillars.map((pillar) => {
                      const meta = COLORWAY_METADATA[pillar];
                      const cellPieces = arcPieces.filter(
                        (p) => getPrimaryColorway(p) === pillar
                      );

                      return (
                        <div
                          key={pillar}
                          className="rounded-xl border border-neutral-800/80 bg-[#040508] p-4 space-y-3.5 flex flex-col"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: meta.hex }}
                              />
                              <span className={`text-xs font-mono font-semibold ${meta.accentClass}`}>
                                {pillar}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-500">
                              {cellPieces.length} items
                            </span>
                          </div>

                          <div className="space-y-3 flex-1">
                            {cellPieces.length > 0 ? (
                              cellPieces.map((piece) => (
                                <MoodboardTile
                                  key={piece.id}
                                  piece={piece}
                                  pillar={pillar}
                                  onInspect={onInspect}
                                  onCopyPrompt={copyPrompt}
                                  copiedPromptId={copiedPromptId}
                                  compact
                                />
                              ))
                            ) : (
                              <div className="p-4 text-center text-[11px] font-mono text-neutral-600 border border-dashed border-neutral-850 rounded">
                                No {arc} pieces in {pillar}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

interface MoodboardTileProps {
  piece: SolletPiece;
  pillar: ColorwayPillar;
  onInspect: (piece: SolletPiece) => void;
  onCopyPrompt: (id: string, prompt: string) => void;
  copiedPromptId: string | null;
  compact?: boolean;
}

const MoodboardTile: React.FC<MoodboardTileProps> = ({
  piece,
  pillar,
  onInspect,
  onCopyPrompt,
  copiedPromptId,
  compact = false,
}) => {
  const meta = COLORWAY_METADATA[pillar];

  const archetypeBadge =
    piece.archetype === 'Solita'
      ? 'text-[#00ff66] bg-[#00ff66]/10 border-[#00ff66]/30'
      : piece.archetype === 'Molita'
      ? 'text-[#66a3ff] bg-[#0055ff]/10 border-[#0055ff]/30'
      : 'text-[#ff8844] bg-[#ff5500]/10 border-[#ff5500]/30';

  return (
    <article
      id={`moodboard-tile-${piece.id}`}
      className="group rounded-xl border border-neutral-800/80 bg-[#0a0d14] hover:border-neutral-700 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between"
    >
      {/* Tile Header */}
      <div className="p-3 border-b border-neutral-800/60 bg-[#05070b] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            {piece.id}
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${archetypeBadge}`}>
            {piece.archetype}
          </span>
        </div>

        <span className="text-[10px] font-mono text-neutral-400">
          {piece.anomalyType}
        </span>
      </div>

      {/* Physics Canvas Preview (compact height) */}
      <div className="px-3 pt-2.5">
        <GlitchCanvas anomalyType={piece.anomalyType} className={`w-full ${compact ? 'h-14' : 'h-20'}`} />
      </div>

      {/* Body: Title & Concepts */}
      <div className="p-3 space-y-2.5 flex-1">
        <div>
          <h4 className="font-syne font-semibold text-xs text-neutral-100 group-hover:text-white leading-snug line-clamp-2">
            {piece.title}
          </h4>
        </div>

        {/* Colorway & Swatches */}
        <div className="p-2 rounded bg-[#030406] border border-neutral-800/70 text-[11px] font-mono space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
            <span>COLORWAY SWATCHES</span>
            <span className={meta.accentClass}>{pillar}</span>
          </div>
          <div className="text-neutral-300 truncate text-[10.5px]">
            {piece.garmentMechanics?.colorway}
          </div>
        </div>

        {/* Materials & Silhouette chips */}
        {!compact && (
          <div className="space-y-1 text-[11px] font-mono">
            <div className="bg-neutral-900/60 p-1.5 rounded border border-neutral-800/40 truncate">
              <span className="text-neutral-500">Textile: </span>
              <span className="text-neutral-300">{piece.garmentMechanics?.materials}</span>
            </div>
            <div className="bg-neutral-900/60 p-1.5 rounded border border-neutral-800/40 truncate">
              <span className="text-neutral-500">Cut: </span>
              <span className="text-neutral-300">{piece.garmentMechanics?.cutsAndSilhouette}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2.5 border-t border-neutral-800/60 bg-[#05070b] flex items-center justify-between gap-2">
        <button
          onClick={() => onInspect(piece)}
          className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span>Inspect Spec</span>
        </button>

        <button
          onClick={() => onCopyPrompt(piece.id, piece.imagePrompt)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] text-[11px] font-mono font-semibold border border-[#00ff66]/30 transition-colors"
        >
          {copiedPromptId === piece.id ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Prompt</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
