import React from 'react';
import { ViewMode } from '../types';
import { Sparkles, Download, Layers, Grid3X3, Palette, Code2, Cpu } from 'lucide-react';
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

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  totalPieces,
  solitaCount,
  molitaCount,
  sovereignCount,
  onExportJson,
}) => {
  const { themeConfig } = useTheme();

  return (
    <header className="border-b border-neutral-800/80 bg-[#050608]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Brand & Collection Title */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded border bg-neutral-900/90 flex items-center justify-center transition-all"
            style={{
              borderColor: themeConfig.borderHex,
              color: themeConfig.hex,
              boxShadow: `0 0 15px ${themeConfig.subtleHex}`,
            }}
          >
            <span className="font-cinzel text-lg font-bold tracking-tighter">0G</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-base tracking-[0.2em] text-white uppercase">
                OtakOS Fashion
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider border transition-colors"
                style={{
                  backgroundColor: themeConfig.subtleHex,
                  color: themeConfig.hex,
                  borderColor: themeConfig.borderHex,
                }}
              >
                0.00G CATHEDRAL
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono tracking-wide">
              SOLLET Haute Couture Codex · {totalPieces} Keyframe Garment Analyses
            </p>
          </div>
        </div>

        {/* Global Accent Mood Theme Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-center">
          <ThemeSwitcher />

          {/* Archetype Metrics (Desktop) */}
          <div className="hidden xl:flex items-center gap-3.5 text-xs font-mono border-l border-neutral-800/80 pl-3">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#00ff66]"></span>
              <span>Solita ({solitaCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#0055ff]"></span>
              <span>Molita ({molitaCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-[#ff5500]"></span>
              <span>Sovereign ({sovereignCount})</span>
            </div>
          </div>
        </div>

        {/* Navigation Modes & Export */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center p-0.5 rounded-lg border border-neutral-800 bg-[#090b10]">
            <button
              onClick={() => setViewMode('galeria')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'galeria'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'galeria' ? { color: themeConfig.hex } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>

            <button
              onClick={() => setViewMode('kreacja')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'kreacja'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'kreacja' ? { color: themeConfig.hex } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>

            <button
              onClick={() => setViewMode('marki')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'marki'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'marki' ? { color: themeConfig.hex } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>

            <button
              onClick={() => setViewMode('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'ai'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'ai' ? { color: themeConfig.hex } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>

            <button
              onClick={() => setViewMode('runway-cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'runway-cards'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'runway-cards' ? { color: themeConfig.hex } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Runway Cards</span>
            </button>

            <button
              onClick={() => setViewMode('blueprint-matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'blueprint-matrix'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'blueprint-matrix' ? { color: themeConfig.hex } : {}}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Blueprint Matrix</span>
            </button>

            <button
              onClick={() => setViewMode('moodboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'moodboard'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'moodboard' ? { color: themeConfig.hex } : {}}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Moodboard</span>
            </button>

            <button
              onClick={() => setViewMode('ai-stylist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'ai-stylist'
                  ? 'bg-neutral-800 shadow-sm font-semibold border'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={
                viewMode === 'ai-stylist'
                  ? {
                      backgroundColor: themeConfig.subtleHex,
                      color: themeConfig.hex,
                      borderColor: themeConfig.borderHex,
                    }
                  : {}
              }
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.hex }} />
              <span>AI Stylist Lab</span>
            </button>

            <button
              onClick={() => setViewMode('raw-json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                viewMode === 'raw-json'
                  ? 'bg-neutral-800 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              style={viewMode === 'raw-json' ? { color: themeConfig.hex } : {}}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Stream</span>
            </button>
          </div>

          <button
            onClick={onExportJson}
            title="Download full katalog.json"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 text-xs font-mono transition-all hover:bg-neutral-800"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">katalog.json</span>
          </button>
        </div>

      </div>
    </header>
  );
};

