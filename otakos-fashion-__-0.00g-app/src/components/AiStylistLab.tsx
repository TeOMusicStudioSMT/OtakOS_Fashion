import React, { useState } from 'react';
import { SolletPiece, Archetype, AnomalyType } from '../types';
import { KeyframeCard } from './KeyframeCard';
import { Sparkles, Terminal, Send, Loader2, Wand2, RefreshCw } from 'lucide-react';

interface AiStylistLabProps {
  onAddPieceToCatalog: (piece: SolletPiece) => void;
  onInspect: (piece: SolletPiece) => void;
}

const presetPhysicsScenes = [
  {
    title: 'Superluminal Shockwave at the Cathedral Spire',
    scene: 'OtakOS Cathedral spire tip: Tachyon discharge creating blue-shifted Cherenkov optical shear, ionizing dust clouds into neon-green filament arcs against pitch-black space.',
    archetype: 'Solita' as Archetype,
    anomaly: 'Spatial Crack' as AnomalyType,
  },
  {
    title: 'Acoustic Levitation Moiré Lattice',
    scene: 'Sub-sanctuary resonance chamber: Quad-harmonic acoustic nodes levitating particulate mercury into pulsating sinusoidal sheets, refracting sharp void blue and cyan light.',
    archetype: 'Molita' as Archetype,
    anomaly: 'Sine-Wave Distortion' as AnomalyType,
  },
  {
    title: 'Thermonuclear Calx Vapor Crucible',
    scene: 'Underground transmutation retort: Rapid calcination boiling raw obsidian into glowing amber plasma flares, casting intense warm alchemical orange radiance.',
    archetype: 'Hybrid Sovereign' as Archetype,
    anomaly: 'Alchemical Calx Sublimation' as AnomalyType,
  },
];

export const AiStylistLab: React.FC<AiStylistLabProps> = ({
  onAddPieceToCatalog,
  onInspect,
}) => {
  const [scenePrompt, setScenePrompt] = useState(
    '0.00G vacuum cathedral nave: Sudden gravitational fracture splitting planar geometry into razor-thin emerald laser fissures against pitch-black void, with zero-G particulate levitation.'
  );
  const [archetype, setArchetype] = useState<Archetype>('Solita');
  const [anomalyType, setAnomalyType] = useState<AnomalyType>('Spatial Crack');
  const [customNotes, setCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPiece, setGeneratedPiece] = useState<SolletPiece | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSynthesize = async () => {
    if (!scenePrompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenePrompt,
          archetype,
          anomalyType,
          customNotes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: SolletPiece = await res.json();
      setGeneratedPiece(data);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setError('Failed to reach synthesis server. Falling back to local synthesizer.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = (preset: typeof presetPhysicsScenes[0]) => {
    setScenePrompt(preset.scene);
    setArchetype(preset.archetype);
    setAnomalyType(preset.anomaly);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Introduction Hero Card */}
      <div className="rounded-xl border border-neutral-800 bg-[#080a0f] p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-ping"></span>
            <span className="font-mono text-xs text-[#00ff66] uppercase tracking-widest">
              OtakOS Stylist Synthesizer // Cyber-Alchemical Engine
            </span>
          </div>
          <h2 className="font-syne font-extrabold text-2xl text-white">
            0.00G Environmental Physics → Haute Couture Translation Lab
          </h2>
          <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Translate any physical, environmental, or spatial anomaly inside the 0.00G OtakOS Cathedral
            into explicit high-fashion garment descriptions (fabrics, cuts, light reflection, cybernetic
            weaving, structural tension) and production-grade image prompts for Midjourney, Flux, and ComfyUI.
          </p>
        </div>
      </div>

      {/* Synthesis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-xl border border-neutral-800 bg-[#090c12] p-5 space-y-4">
            
            {/* Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[#00ff66]" /> Presets
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {presetPhysicsScenes.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2 rounded bg-[#030406] hover:bg-neutral-800 text-left border border-neutral-800 text-[11px] font-mono text-neutral-300 transition-colors"
                  >
                    <span className="text-[#00ff66] block font-semibold truncate">{p.title}</span>
                    <span className="text-neutral-500 text-[10px]">{p.archetype} · {p.anomaly}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Scene Description */}
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-neutral-300 block mb-1.5 font-semibold">
                1. Scene Description (Environmental Physics & Anomalies)
              </label>
              <textarea
                rows={4}
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder="Describe zero-gravity physics, spatial tears, laser frequencies, or thermal calx vapor..."
                className="w-full p-3 bg-[#030406] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[#00ff66]/60 focus:ring-1 focus:ring-[#00ff66]/30 leading-relaxed"
              />
            </div>

            {/* Archetype & Anomaly Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-neutral-300 block mb-1.5 font-semibold">
                  2. Archetype Silhouette
                </label>
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value as Archetype)}
                  className="w-full p-2.5 bg-[#030406] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#00ff66]/60"
                >
                  <option value="Solita">Solita (Architectural / Crystalline / Tension)</option>
                  <option value="Molita">Molita (Liquid / Amorphous / Wave Collapse)</option>
                  <option value="Hybrid Sovereign">Hybrid Sovereign (Unified Synthesis)</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-neutral-300 block mb-1.5 font-semibold">
                  3. Physics Glitch Focus
                </label>
                <select
                  value={anomalyType}
                  onChange={(e) => setAnomalyType(e.target.value as AnomalyType)}
                  className="w-full p-2.5 bg-[#030406] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#00ff66]/60"
                >
                  <option value="Spatial Crack">Spatial Crack (Planar Fissures)</option>
                  <option value="Sine-Wave Distortion">Sine-Wave Distortion (Wavy Lines)</option>
                  <option value="Chromatic Abnormality">Chromatic Abnormality (Blue/Green)</option>
                  <option value="Alchemical Calx Sublimation">Alchemical Calx Sublimation (Warm Orange)</option>
                  <option value="Zero-G Dissolution">Zero-G Dissolution (Floating Streamers)</option>
                  <option value="Gravitational Lensing">Gravitational Lensing (Curved Horizon)</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-neutral-400 block mb-1.5">
                4. Stylist Custom Notes (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Focus on levitating decoupled shoulder wings and liquid latex sheen"
                className="w-full p-2.5 bg-[#030406] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[#00ff66]/60"
              />
            </div>

            {/* Synthesize Button */}
            <button
              onClick={handleSynthesize}
              disabled={isGenerating || !scenePrompt.trim()}
              className="w-full py-3 px-4 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black font-syne font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Cyber-Alchemical Garment...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Haute Couture Piece</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs font-mono text-red-400 bg-red-950/40 p-2.5 rounded border border-red-800">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Output Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00ff66]" /> Synthesized Specification Output
            </span>

            {generatedPiece && (
              <button
                onClick={() => {
                  onAddPieceToCatalog(generatedPiece);
                }}
                className="text-xs font-mono text-[#00ff66] hover:underline"
              >
                + Add to Active Catalog
              </button>
            )}
          </div>

          {generatedPiece ? (
            <KeyframeCard piece={generatedPiece} onInspect={onInspect} />
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 bg-[#07090d] p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[380px]">
              <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-syne font-semibold text-neutral-300">
                Awaiting Environmental Physics Vector
              </h4>
              <p className="text-xs font-mono text-neutral-500 max-w-sm">
                Enter a scene prompt or select one of the presets above, then click Synthesize to generate
                a sovereign couture piece with detailed garment mechanics and Flux/Midjourney prompts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
