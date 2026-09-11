import React from 'react';
import { Archetype, AnomalyType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  selectedArchetype: Archetype | 'All';
  setSelectedArchetype: (archetype: Archetype | 'All') => void;
  selectedAnomaly: AnomalyType | 'All';
  setSelectedAnomaly: (anomaly: AnomalyType | 'All') => void;
  selectedPhase: string;
  setSelectedPhase: (phase: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalFiltered: number;
}

const archetypesList: (Archetype | 'All')[] = ['All', 'Solita', 'Molita', 'Hybrid Sovereign'];

const anomaliesList: (AnomalyType | 'All')[] = [
  'All',
  'Spatial Crack',
  'Sine-Wave Distortion',
  'Chromatic Abnormality',
  'Alchemical Calx Sublimation',
  'Zero-G Dissolution',
  'Gravitational Lensing',
];

const phasesList = [
  'All Phases',
  'Act I: 0.00G Genesis',
  'Act II: Dynamic Glitch Collapse',
  'Act III: Calx Transmutation',
  'Act IV: Sovereign Cathedral Resonance',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedArchetype,
  setSelectedArchetype,
  selectedAnomaly,
  setSelectedAnomaly,
  selectedPhase,
  setSelectedPhase,
  searchQuery,
  setSearchQuery,
  totalFiltered,
}) => {
  const { themeConfig } = useTheme();

  const hasActiveFilters =
    selectedArchetype !== 'All' ||
    selectedAnomaly !== 'All' ||
    selectedPhase !== 'All Phases' ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setSelectedArchetype('All');
    setSelectedAnomaly('All');
    setSelectedPhase('All Phases');
    setSearchQuery('');
  };

  return (
    <div className="bg-[#080a0e] border-y border-neutral-800/80 py-3 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Row 1: Search & Archetypes */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search textiles, cuts, physics anomalies, or prompt tags..."
              className="w-full pl-9 pr-8 py-1.5 bg-[#030406] border border-neutral-800 rounded-md text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all"
              style={{
                borderColor: searchQuery ? themeConfig.borderHex : undefined,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Archetype Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-neutral-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 transition-colors" style={{ color: themeConfig.hex }} /> Archetype:
            </span>
            {archetypesList.map((arc) => (
              <button
                key={arc}
                onClick={() => setSelectedArchetype(arc)}
                className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                  selectedArchetype === arc
                    ? arc === 'Solita'
                      ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/50 font-semibold'
                      : arc === 'Molita'
                      ? 'bg-[#0055ff]/20 text-[#66a3ff] border border-[#0055ff]/50 font-semibold'
                      : arc === 'Hybrid Sovereign'
                      ? 'bg-[#ff5500]/20 text-[#ff8844] border border-[#ff5500]/50 font-semibold'
                      : 'bg-neutral-800 text-white border font-semibold'
                    : 'bg-neutral-900/80 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
                style={
                  selectedArchetype === arc && arc === 'All'
                    ? {
                        borderColor: themeConfig.borderHex,
                        boxShadow: `0 0 10px ${themeConfig.subtleHex}`,
                      }
                    : {}
                }
              >
                {arc}
              </button>
            ))}
          </div>

        </div>

        {/* Row 2: Physics Glitch Filter & Acts & Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/40 text-xs font-mono">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Anomaly selector */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[11px]">Physics Glitch:</span>
              <select
                value={selectedAnomaly}
                onChange={(e) => setSelectedAnomaly(e.target.value as any)}
                className="bg-[#030406] border border-neutral-800 text-neutral-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#00ff66]/50"
              >
                {anomaliesList.map((anom) => (
                  <option key={anom} value={anom}>
                    {anom}
                  </option>
                ))}
              </select>
            </div>

            {/* Act / Phase selector */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-[11px]">Phase:</span>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="bg-[#030406] border border-neutral-800 text-neutral-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#00ff66]/50"
              >
                {phasesList.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-neutral-400 underline underline-offset-2 ml-1 transition-colors"
                style={{
                  color: themeConfig.hex,
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="text-neutral-400 text-[11px]">
            Showing <span className="text-white font-semibold">{totalFiltered}</span> of 62 Haute Couture Pieces
          </div>

        </div>
      </div>
    </div>
  );
};
