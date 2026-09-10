import React, { useState, useEffect, useMemo } from 'react';
import { SolletPiece, Archetype, AnomalyType, ViewMode } from './types';
import { SOLLET_KATALOG } from './data/katalog';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KeyframeCard } from './components/KeyframeCard';
import { BlueprintMatrix } from './components/BlueprintMatrix';
import { MoodboardView } from './components/MoodboardView';
import { AiStylistLab } from './components/AiStylistLab';
import { JsonCatalogViewer } from './components/JsonCatalogViewer';
import { Galeria } from './components/Galeria';
import { Kreacja } from './components/Kreacja';
import { Marki } from './components/Marki';
import { Dozorca } from './components/Dozorca';
import { GarmentInspectorModal } from './components/GarmentInspectorModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sparkles, Terminal, Layers, ArrowUp, Info } from 'lucide-react';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, themeConfig } = useTheme();
  const [pieces, setPieces] = useState<SolletPiece[]>(SOLLET_KATALOG);
  // ⚠️ Wejście przez GALERIĘ, nie przez karty. Suweren: „pierwsza strona to
  // galeria obrazów w szklanym panelu” — i to ona pokazuje prawdziwy materiał.
  const [viewMode, setViewMode] = useState<ViewMode>('galeria');
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | 'All'>('All');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyType | 'All'>('All');
  const [selectedPhase, setSelectedPhase] = useState<string>('All Phases');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingPiece, setInspectingPiece] = useState<SolletPiece | null>(null);

  // Optional server sync if server catalog has dynamic additions
  useEffect(() => {
    fetch('/api/katalog')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPieces(data);
        }
      })
      .catch(() => {
        // Fall back to local SOLLET_KATALOG
      });
  }, []);

  // Archetype distribution counts
  const solitaCount = useMemo(
    () => pieces.filter((p) => p.archetype === 'Solita').length,
    [pieces]
  );
  const molitaCount = useMemo(
    () => pieces.filter((p) => p.archetype === 'Molita').length,
    [pieces]
  );
  const sovereignCount = useMemo(
    () => pieces.filter((p) => p.archetype === 'Hybrid Sovereign').length,
    [pieces]
  );

  // Filtering logic
  const filteredPieces = useMemo(() => {
    return pieces.filter((piece) => {
      if (selectedArchetype !== 'All' && piece.archetype !== selectedArchetype) {
        return false;
      }
      if (selectedAnomaly !== 'All' && piece.anomalyType !== selectedAnomaly) {
        return false;
      }
      if (selectedPhase !== 'All Phases' && piece.phase !== selectedPhase) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = piece.title.toLowerCase().includes(query);
        const inId = piece.id.toLowerCase().includes(query);
        const inConcept = piece.fashionConcept.toLowerCase().includes(query);
        const inScene = piece.scenePrompt.toLowerCase().includes(query);
        const inMaterials = piece.garmentMechanics.materials.toLowerCase().includes(query);
        const inCuts = piece.garmentMechanics.cutsAndSilhouette.toLowerCase().includes(query);
        const inTags = piece.tags.some((t) => t.toLowerCase().includes(query));
        return inTitle || inId || inConcept || inScene || inMaterials || inCuts || inTags;
      }
      return true;
    });
  }, [pieces, selectedArchetype, selectedAnomaly, selectedPhase, searchQuery]);

  // Export JSON file download
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(pieces, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OtakOs_Fashion_SOLLET_katalog.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddPieceToCatalog = (newPiece: SolletPiece) => {
    setPieces((prev) => [newPiece, ...prev]);
    setViewMode('runway-cards');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050608] text-neutral-100 flex flex-col relative overflow-x-hidden selection:bg-[var(--accent-subtle)] selection:text-[var(--accent)]">
      {/* Dynamic Ambient Background Illumination corresponding to active Collection Mood */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700 z-0"
        style={{ backgroundColor: themeConfig.hex }}
      />

      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalPieces={pieces.length}
        solitaCount={solitaCount}
        molitaCount={molitaCount}
        sovereignCount={sovereignCount}
        onExportJson={handleExportJson}
      />

      {/* Filter and Query Bar (visible in cards, matrix, and moodboard views) */}
      {(viewMode === 'galeria' || viewMode === 'kreacja' || viewMode === 'runway-cards' || viewMode === 'blueprint-matrix' || viewMode === 'moodboard') && (
        <FilterBar
          selectedArchetype={selectedArchetype}
          setSelectedArchetype={setSelectedArchetype}
          selectedAnomaly={selectedAnomaly}
          setSelectedAnomaly={setSelectedAnomaly}
          selectedPhase={selectedPhase}
          setSelectedPhase={setSelectedPhase}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalFiltered={filteredPieces.length}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Pierwsza tafla — klik w kafelek otwiera inspektora, czyli kolejną taflę. */}
        {viewMode === 'galeria' && (
          <Galeria pieces={filteredPieces} onWybierz={setInspectingPiece} />
        )}

        {/* Druga tafla — tu koncepcja staje się widoczną sztuką odzieży. */}
        {viewMode === 'kreacja' && <Kreacja pieces={filteredPieces} />}

        {/* Trzecia tafla — kto to firmuje i ile jest warte. */}
        {viewMode === 'marki' && <Marki />}

        {/* Czwarta tafla — kto pilnuje, czy to żyje. */}
        {viewMode === 'ai' && <Dozorca />}

        {viewMode === 'runway-cards' && (
          <div className="space-y-6">
            {/* Visual Language Directive Callout */}
            <div
              className="p-4 rounded-xl border bg-[#080a0f] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono transition-colors"
              style={{ borderColor: themeConfig.borderHex }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded bg-neutral-900 border flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: themeConfig.borderHex,
                    color: themeConfig.hex,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <span>0.00G CATHEDRAL VISUAL CODEX: SOLITA & MOLITA ARCHETYPES</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded border uppercase"
                      style={{
                        backgroundColor: themeConfig.subtleHex,
                        color: themeConfig.hex,
                        borderColor: themeConfig.borderHex,
                      }}
                    >
                      Active Mood: {theme}
                    </span>
                  </div>
                  <p className="text-neutral-400 mt-0.5 max-w-3xl">
                    Translating 62 environmental physics keyframes into explicit cyber-alchemical haute couture.
                    Currently tuned to <strong style={{ color: themeConfig.hex }}>{themeConfig.name}</strong> ({themeConfig.moodSubtitle}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => setViewMode('ai-stylist')}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap border"
                  style={{
                    backgroundColor: themeConfig.subtleHex,
                    color: themeConfig.hex,
                    borderColor: themeConfig.borderHex,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Stylist Lab</span>
                </button>
              </div>
            </div>

            {/* Grid of Runway Cards */}
            {filteredPieces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPieces.map((piece) => (
                  <KeyframeCard
                    key={piece.id}
                    piece={piece}
                    onInspect={(p) => setInspectingPiece(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl border border-neutral-800 bg-[#080a0f] space-y-3">
                <p className="font-mono text-sm text-neutral-400">
                  No haute couture pieces match the active filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedArchetype('All');
                    setSelectedAnomaly('All');
                    setSelectedPhase('All Phases');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded bg-neutral-800 text-white text-xs font-mono hover:bg-neutral-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'blueprint-matrix' && (
          <div className="space-y-6">
            <BlueprintMatrix
              pieces={filteredPieces}
              onInspect={(p) => setInspectingPiece(p)}
            />
          </div>
        )}

        {viewMode === 'moodboard' && (
          <div className="space-y-6">
            <MoodboardView
              pieces={filteredPieces}
              onInspect={(p) => setInspectingPiece(p)}
            />
          </div>
        )}

        {viewMode === 'ai-stylist' && (
          <AiStylistLab
            onAddPieceToCatalog={handleAddPieceToCatalog}
            onInspect={(p) => setInspectingPiece(p)}
          />
        )}

        {viewMode === 'raw-json' && (
          <JsonCatalogViewer
            pieces={pieces}
            onDownload={handleExportJson}
          />
        )}
      </main>

      {/* Floating Scroll to Top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-2.5 rounded-full bg-neutral-900/90 border border-neutral-700 shadow-lg transition-all z-30 group"
        style={{
          boxShadow: `0 0 15px ${themeConfig.subtleHex}`,
        }}
        title="Scroll to Top"
      >
        <ArrowUp className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" style={{ color: themeConfig.hex }} />
      </button>

      {/* Detailed Modal Spec Inspector */}
      {inspectingPiece && (
        <GarmentInspectorModal
          piece={inspectingPiece}
          onClose={() => setInspectingPiece(null)}
        />
      )}

      {/* Sovereign Couture Footer */}
      <footer className="border-t border-neutral-800/80 bg-[#030406] py-6 text-xs font-mono text-neutral-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full transition-colors duration-300"
              style={{ backgroundColor: themeConfig.hex }}
            />
            <span>OTAKOS FASHION // 0.00G SOVEREIGN HAUTE COUTURE CATHEDRAL</span>
          </div>
          <div className="text-neutral-400 flex items-center gap-2">
            <span>SOLLET Collection · 62 Keyframe Physics Analyses</span>
            <span className="text-neutral-600">|</span>
            <span style={{ color: themeConfig.hex }}>Mood: {themeConfig.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
