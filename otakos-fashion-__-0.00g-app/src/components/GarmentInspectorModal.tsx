import React, { useState, useEffect } from 'react';
import { SolletPiece } from '../types';
import { GlitchCanvas } from './GlitchCanvas';
import { X, Copy, Check, Sparkles, Terminal, FileText, FileJson } from 'lucide-react';

interface GarmentInspectorModalProps {
  piece: SolletPiece | null;
  onClose: () => void;
}

export const GarmentInspectorModal: React.FC<GarmentInspectorModalProps> = ({
  piece,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!piece) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#090b10] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl my-8 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-[#06070a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-white bg-neutral-800 px-2.5 py-1 rounded border border-neutral-700">
              {piece.id}
            </span>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded border font-semibold ${archetypeBadgeStyle}`}>
              {piece.archetype}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {piece.phase}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Title & Glitch Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-2">
              <h2 className="font-syne font-extrabold text-xl text-white">
                {piece.title}
              </h2>
              <div className="p-3 bg-[#030406] rounded-md border border-neutral-800 text-xs font-mono text-neutral-300">
                <span className="text-[#00ff66] font-semibold">Scene Physics Context: </span>
                <span>{piece.scenePrompt}</span>
              </div>
            </div>

            <div className="space-y-1">
              <GlitchCanvas anomalyType={piece.anomalyType} className="w-full h-28" />
              <div className="text-[10px] font-mono text-neutral-400 text-center">
                Vector Anomaly: {piece.anomalyType}
              </div>
            </div>
          </div>

          {/* Fashion Concept */}
          <div className="bg-[#040609] p-4 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#00ff66]">
              <Sparkles className="w-4 h-4" />
              <span>Couture Translation & Fashion Concept</span>
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed">
              {piece.fashionConcept}
            </p>
          </div>

          {/* Deep Garment Mechanics Breakdown */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 border-b border-neutral-800 pb-1">
              Garment Mechanics & Structural Specifications
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#00ff66] font-bold block mb-1">Textiles & Materials</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.materials}</span>
              </div>

              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#66a3ff] font-bold block mb-1">Cuts & Silhouette</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.cutsAndSilhouette}</span>
              </div>

              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#ff8844] font-bold block mb-1">Light Reflection & Specular Sheen</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.lightReflection}</span>
              </div>

              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#00ff66] font-bold block mb-1">Cybernetic Weaving</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.cyberneticWeaving}</span>
              </div>

              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#66a3ff] font-bold block mb-1">0.00G Structural Tension</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.structuralTension}</span>
              </div>

              <div className="bg-[#06080c] p-3 rounded border border-neutral-800">
                <span className="text-[#ff8844] font-bold block mb-1">Colorway Matrix</span>
                <span className="text-neutral-300 leading-relaxed">{piece.garmentMechanics.colorway}</span>
              </div>
            </div>
          </div>

          {/* High Fashion Rendering Prompt */}
          <div className="bg-[#030406] p-4 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ff66]" />
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-semibold">
                  Synthesized Image Prompt (Flux.1 / Midjourney v6 / ComfyUI)
                </span>
              </div>

              <button
                onClick={() => copyToClipboard(piece.imagePrompt, 'modal-prompt')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] text-xs font-mono font-semibold border border-[#00ff66]/40 transition-colors"
              >
                {copiedType === 'modal-prompt' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Prompt!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-[#010203] rounded border border-neutral-800 text-xs font-mono text-neutral-300 leading-relaxed select-all">
              {piece.imagePrompt}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-[#06070a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(getMarkdownCard(), 'modal-md')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-800 transition-colors"
            >
              {copiedType === 'modal-md' ? (
                <Check className="w-3.5 h-3.5 text-[#00ff66]" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Copy Markdown Card</span>
            </button>

            <button
              onClick={() => copyToClipboard(JSON.stringify(piece, null, 2), 'modal-json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono border border-neutral-800 transition-colors"
            >
              {copiedType === 'modal-json' ? (
                <Check className="w-3.5 h-3.5 text-[#00ff66]" />
              ) : (
                <FileJson className="w-3.5 h-3.5" />
              )}
              <span>Copy JSON Schema</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
