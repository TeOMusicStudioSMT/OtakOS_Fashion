import React, { useState } from 'react';
import { SolletPiece } from '../types';
import { Copy, Check, Eye } from 'lucide-react';

interface BlueprintMatrixProps {
  pieces: SolletPiece[];
  onInspect: (piece: SolletPiece) => void;
}

export const BlueprintMatrix: React.FC<BlueprintMatrixProps> = ({ pieces, onInspect }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-[#07090d] shadow-2xl">
      <table className="w-full text-left border-collapse text-xs font-mono">
        <thead>
          <tr className="border-b border-neutral-800 bg-[#0a0d14] text-neutral-400 uppercase tracking-wider text-[10px]">
            <th className="py-3.5 px-4 font-semibold">ID / Keyframe</th>
            <th className="py-3.5 px-4 font-semibold">Archetype</th>
            <th className="py-3.5 px-4 font-semibold">Physics Glitch</th>
            <th className="py-3.5 px-4 font-semibold">Piece Title</th>
            <th className="py-3.5 px-4 font-semibold">Materials</th>
            <th className="py-3.5 px-4 font-semibold">Cuts & Silhouette</th>
            <th className="py-3.5 px-4 font-semibold">Colorway</th>
            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {pieces.map((piece) => {
            const archetypeColor =
              piece.archetype === 'Solita'
                ? 'text-[#00ff66]'
                : piece.archetype === 'Molita'
                ? 'text-[#66a3ff]'
                : 'text-[#ff8844]';

            return (
              <tr
                key={piece.id}
                className="hover:bg-neutral-850/40 transition-colors group"
              >
                {/* ID */}
                <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                  <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                    {piece.id}
                  </span>
                </td>

                {/* Archetype */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`font-semibold ${archetypeColor}`}>
                    {piece.archetype}
                  </span>
                </td>

                {/* Anomaly */}
                <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px]">
                    {piece.anomalyType}
                  </span>
                </td>

                {/* Title */}
                <td className="py-3 px-4 font-syne font-semibold text-neutral-200 max-w-xs truncate">
                  {piece.title}
                </td>

                {/* Materials */}
                <td className="py-3 px-4 text-neutral-400 max-w-xs truncate">
                  {piece.garmentMechanics.materials}
                </td>

                {/* Cuts */}
                <td className="py-3 px-4 text-neutral-400 max-w-xs truncate">
                  {piece.garmentMechanics.cutsAndSilhouette}
                </td>

                {/* Colorway */}
                <td className="py-3 px-4 text-neutral-400 max-w-xs truncate">
                  {piece.garmentMechanics.colorway}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyPrompt(piece.id, piece.imagePrompt)}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-[#00ff66]/20 text-neutral-300 hover:text-[#00ff66] border border-neutral-800 hover:border-[#00ff66]/40 transition-colors text-[11px] flex items-center gap-1"
                      title="Copy Midjourney/Flux Prompt"
                    >
                      {copiedId === piece.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#00ff66]" />
                          <span className="text-[#00ff66]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onInspect(piece)}
                      className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                      title="Inspect Full Spec Sheet"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
