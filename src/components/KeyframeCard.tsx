import React, { useState } from 'react';
import { SolletPiece } from '../types';
import { FabricWeaveZoom } from './FabricWeaveZoom';
import { useTheme } from '../context/ThemeContext';
import { Copy, Check, Eye, Terminal, Sparkles, FileJson, FileText } from 'lucide-react';

interface KeyframeCardProps {
  piece: SolletPiece;
  onInspect: (piece: SolletPiece) => void;
}

export const KeyframeCard: React.FC<KeyframeCardProps> = ({ piece, onInspect }) => {
  const { themeConfig } = useTheme();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [promptFormat, setPromptFormat] = useState<'midjourney' | 'flux' | 'comfy'>('midjourney');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getFormattedPrompt = () => {
    if (promptFormat === 'midjourney') {
      return piece.imagePrompt;
    } else if (promptFormat === 'flux') {
      // Flux format: prompt with stylistic emphasis, no midjourney parameters
      return piece.imagePrompt.replace(/--ar 3:4 --style raw --v 6.0/, '').trim() + ', 8k hyper-detailed masterwork, cinematic volumetric lighting, 35mm film grain, 0.00G haute couture';
    } else {
      // ComfyUI text positive prompt format
      return `positive: (${piece.imagePrompt.replace(/--ar 3:4 --style raw --v 6.0/, '').trim()}), high-fashion lookbook, masterwork quality, photorealistic, intricate cybernetic textiles, 8k\nnegative: generic clothing, casual wear, cartoon, 3d render, distorted anatomy, blur, low quality`;
    }
  };

  const getMarkdownCard = () => {
    return `### ${piece.title} [${piece.id}]
- **Archetype**: ${piece.archetype} (${piece.phase})
- **Anomaly Vector**: ${piece.anomalyType}
- **Scene Physics Inspiration**: ${piece.scenePrompt}

#### Fashion Concept & Garment Mechanics
- **Concept**: ${piece.fashionConcept}
- **Materials**: ${piece.garmentMechanics.materials}
- **Cuts & Silhouette**: ${piece.garmentMechanics.cutsAndSilhouette}
- **Light Reflection**: ${piece.garmentMechanics.lightReflection}
- **Cybernetic Weaving**: ${piece.garmentMechanics.cyberneticWeaving}
- **Structural Tension**: ${piece.garmentMechanics.structuralTension}
- **Colorway**: ${piece.garmentMechanics.colorway}

#### Image Prompt (Midjourney / Flux)
\`\`\`
${piece.imagePrompt}
\`\`\`
`;
  };

  const archetypeBadgeStyle =
    piece.archetype === 'Solita'
      ? 'border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]'
      : piece.archetype === 'Molita'
      ? 'border-[#0055ff]/40 bg-[#0055ff]/10 text-[#66a3ff]'
      : 'border-[#ff5500]/40 bg-[#ff5500]/10 text-[#ff8844]';

  return (
    <article
      id={`piece-${piece.id}`}
      className="group rounded-xl border border-neutral-800/90 bg-[#090b10] hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(0,0,0,0.8)]"
    >
      {/* Top Bar: Keyframe ID, Phase & Archetype */}
      <div className="p-4 pb-3 border-b border-neutral-800/60 bg-[#06070a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white tracking-widest bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
            {piece.id}
          </span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${archetypeBadgeStyle}`}>
            {piece.archetype}
          </span>
        </div>

        <span className="text-[10px] font-mono text-neutral-400 tracking-wide uppercase">
          {piece.anomalyType}
        </span>
      </div>

      {/* Physics & Fabric Micro-Weave Canvas with Hover-to-Zoom */}
      <div className="px-4 pt-3">
        <FabricWeaveZoom piece={piece} className="w-full h-28" />
      </div>

      {/* Body: Title, Scene Physics & Concept */}
      <div className="p-4 space-y-3 flex-1">
        <div>
          <h3 className="font-syne font-bold text-sm text-neutral-100 group-hover:text-white transition-colors leading-snug">
            {piece.title}
          </h3>
          <p className="font-mono text-[11px] text-neutral-400 mt-1 line-clamp-2 italic border-l-2 border-neutral-800 pl-2">
            "{piece.scenePrompt}"
          </p>
        </div>

        {/* Fashion Concept */}
        <div className="bg-[#030406] p-2.5 rounded border border-neutral-800/60 text-xs">
          <div className="font-mono text-[10px] uppercase text-neutral-400 tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" style={{ color: themeConfig.hex }} /> Fashion Concept
          </div>
          <p className="text-neutral-300 leading-relaxed text-[12px] line-clamp-3">
            {piece.fashionConcept}
          </p>
        </div>

        {/* Garment Mechanics Specs */}
        <div className="space-y-1.5 pt-1 text-xs">
          <div className="font-mono text-[10px] uppercase text-neutral-400 tracking-wider">
            Garment Mechanics
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 text-[11px] font-mono">
            <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/50">
              <span className="text-[#00ff66] font-semibold">Materials: </span>
              <span className="text-neutral-300">{piece.garmentMechanics.materials}</span>
            </div>

            <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/50">
              <span className="text-[#66a3ff] font-semibold">Cuts & Silhouette: </span>
              <span className="text-neutral-300">{piece.garmentMechanics.cutsAndSilhouette}</span>
            </div>

            <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800/50">
              <span className="text-[#ff8844] font-semibold">Colorway: </span>
              <span className="text-neutral-300">{piece.garmentMechanics.colorway}</span>
            </div>
          </div>
        </div>

        {/* Image Prompt Box with Format Selector */}
        <div className="bg-[#040507] p-3 rounded-lg border border-neutral-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#00ff66]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                Image Generation Prompt
              </span>
            </div>

            {/* Prompt Format Selector */}
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <button
                onClick={() => setPromptFormat('midjourney')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  promptFormat === 'midjourney'
                    ? 'bg-neutral-800 text-[#00ff66] font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Midjourney
              </button>
              <button
                onClick={() => setPromptFormat('flux')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  promptFormat === 'flux'
                    ? 'bg-neutral-800 text-[#66a3ff] font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Flux.1
              </button>
              <button
                onClick={() => setPromptFormat('comfy')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  promptFormat === 'comfy'
                    ? 'bg-neutral-800 text-[#ff8844] font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ComfyUI
              </button>
            </div>
          </div>

          <div className="relative font-mono text-[11px] text-neutral-300 bg-[#020203] p-2.5 rounded border border-neutral-800/80 leading-relaxed max-h-28 overflow-y-auto">
            {getFormattedPrompt()}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(getMarkdownCard(), `md-${piece.id}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-mono border border-neutral-800 transition-colors"
                title="Copy clean Markdown Card"
              >
                {copiedType === `md-${piece.id}` ? (
                  <Check className="w-3 h-3 text-[#00ff66]" />
                ) : (
                  <FileText className="w-3 h-3 text-neutral-400" />
                )}
                <span>Markdown</span>
              </button>

              <button
                onClick={() => copyToClipboard(JSON.stringify(piece, null, 2), `json-${piece.id}`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-mono border border-neutral-800 transition-colors"
                title="Copy piece JSON object"
              >
                {copiedType === `json-${piece.id}` ? (
                  <Check className="w-3 h-3 text-[#00ff66]" />
                ) : (
                  <FileJson className="w-3 h-3 text-neutral-400" />
                )}
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(getFormattedPrompt(), `prompt-${piece.id}`)}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-semibold border transition-all"
              style={{
                backgroundColor: themeConfig.subtleHex,
                color: themeConfig.hex,
                borderColor: themeConfig.borderHex,
                boxShadow: `0 0 10px ${themeConfig.subtleHex}`,
              }}
            >
              {copiedType === `prompt-${piece.id}` ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Full Blueprint Inspection button */}
      <div className="p-3 border-t border-neutral-800/80 bg-[#06070a] flex items-center justify-between">
        <span className="font-mono text-[10px] text-neutral-400">
          OtakOS 0.00G Sovereign Spec
        </span>

        <button
          onClick={() => onInspect(piece)}
          className="flex items-center gap-1 text-xs font-mono text-neutral-300 transition-colors group/inspect"
        >
          <Eye className="w-3.5 h-3.5 transition-transform group-hover/inspect:scale-110" style={{ color: themeConfig.hex }} />
          <span className="hover:underline" style={{ color: 'inherit' }}>Inspect Spec Sheet</span>
        </button>
      </div>
    </article>
  );
};
