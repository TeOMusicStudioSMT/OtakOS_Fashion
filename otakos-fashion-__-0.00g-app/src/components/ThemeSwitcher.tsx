import React, { useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { GlobalTheme } from '../types';
import { Palette, Sparkles, Check, ChevronDown, Radio } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
  variant?: 'compact' | 'pill-bar' | 'expanded';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  variant = 'pill-bar',
}) => {
  const { theme, themeConfig, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: GlobalTheme[] = ['Neon Green', 'Void Blue', 'Alchemical Orange'];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Pill-Bar Segmented Selector */}
      <div
        className="flex items-center p-1 rounded-lg border border-neutral-800 bg-[#080a0f]/90 shadow-sm"
        title={`Current Accent: ${themeConfig.name} (${themeConfig.archetypeAffinity})`}
      >
        {/* Leading icon & Label */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] font-mono text-neutral-400 border-r border-neutral-800/80 mr-1">
          <Palette className="w-3 h-3 transition-colors" style={{ color: themeConfig.hex }} />
          <span className="uppercase text-[10px] tracking-wider">Mood:</span>
        </div>

        {/* 3 Colorway Trigger Buttons */}
        <div className="flex items-center gap-1">
          {themeOptions.map((opt) => {
            const config = THEMES[opt];
            const isSelected = theme === opt;

            return (
              <button
                key={opt}
                onClick={() => setTheme(opt)}
                className={`group/theme-btn relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-200 ${
                  isSelected
                    ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
                style={
                  isSelected
                    ? {
                        boxShadow: `0 0 12px ${config.subtleHex}`,
                        borderColor: config.borderHex,
                      }
                    : {}
                }
              >
                {/* Glowing Chromatic Dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full transition-transform group-hover/theme-btn:scale-110"
                  style={{
                    backgroundColor: config.hex,
                    boxShadow: isSelected ? `0 0 8px ${config.hex}` : 'none',
                  }}
                />

                {/* Short Label */}
                <span className="text-[11px] hidden md:inline-block whitespace-nowrap">
                  {opt === 'Neon Green'
                    ? 'Neon'
                    : opt === 'Void Blue'
                    ? 'Void'
                    : 'Alchemical'}
                </span>

                {/* Active Underline indicator on selected */}
                {isSelected && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ backgroundColor: config.hex }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Info dropdown trigger for mobile or deep inspect */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 ml-1 text-neutral-500 hover:text-neutral-300 rounded transition-colors"
          title="Inspect collection mood details"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mood Detail Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-800 bg-[#07090e] p-4 shadow-2xl z-50 text-xs font-mono space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.hex }} />
                <span className="text-[11px] text-white font-bold uppercase tracking-wider">
                  Collection Mood Codex
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">Global Accent</span>
            </div>

            <div className="space-y-2">
              {themeOptions.map((opt) => {
                const config = THEMES[opt];
                const isSelected = theme === opt;

                return (
                  <div
                    key={opt}
                    onClick={() => {
                      setTheme(opt);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-700 shadow-sm'
                        : 'bg-[#030406] border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: config.hex,
                            boxShadow: `0 0 6px ${config.hex}`,
                          }}
                        />
                        <span className="font-semibold text-white text-[11px]">
                          {config.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" style={{ color: config.hex }} />}
                    </div>

                    <div className="text-[10px] text-neutral-400 pl-4 space-y-0.5">
                      <div style={{ color: config.hex }}>{config.archetypeAffinity}</div>
                      <div className="text-neutral-500">{config.atmosphericDescription}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-500 text-center">
              Active accent dynamically updates HUD, reticles, meters & selection glows.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
