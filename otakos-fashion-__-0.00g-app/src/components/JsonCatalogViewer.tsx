import React, { useState } from 'react';
import { SolletPiece } from '../types';
import { Copy, Check, Download, Search, Terminal } from 'lucide-react';

interface JsonCatalogViewerProps {
  pieces: SolletPiece[];
  onDownload: () => void;
}

export const JsonCatalogViewer: React.FC<JsonCatalogViewerProps> = ({ pieces, onDownload }) => {
  const [copied, setCopied] = useState(false);
  const [selectedKeyframe, setSelectedKeyframe] = useState<number | 'all'>('all');

  const getFilteredJson = () => {
    if (selectedKeyframe === 'all') {
      return JSON.stringify(pieces, null, 2);
    }
    const single = pieces.find((p) => p.keyframe === selectedKeyframe);
    return JSON.stringify(single || {}, null, 2);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(getFilteredJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-800 bg-[#080a0f]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00ff66]" />
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-200 font-semibold">
            OtakOs_Fashion/katalog.json Viewer ({pieces.length} Entities)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-400">Target:</span>
            <select
              value={selectedKeyframe}
              onChange={(e) =>
                setSelectedKeyframe(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-[#030406] border border-neutral-800 text-neutral-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-[#00ff66]/60"
            >
              <option value="all">Entire Collection (62 Pieces)</option>
              {pieces.map((p) => (
                <option key={p.id} value={p.keyframe}>
                  {p.id}: {p.title.slice(0, 35)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ff66]" />
                <span className="text-[#00ff66]">Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] text-xs font-mono font-semibold border border-[#00ff66]/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download katalog.json</span>
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="rounded-xl border border-neutral-800 bg-[#030406] p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-[70vh] leading-relaxed shadow-inner">
        <pre className="text-[11.5px] leading-snug">
          <code>{getFilteredJson()}</code>
        </pre>
      </div>
    </div>
  );
};
