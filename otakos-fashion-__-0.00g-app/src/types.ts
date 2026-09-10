export interface GarmentMechanics {
  materials: string;
  cutsAndSilhouette: string;
  lightReflection: string;
  cyberneticWeaving: string;
  structuralTension: string;
  colorway: string;
}

export type Archetype = 'Solita' | 'Molita' | 'Hybrid Sovereign';

export type AnomalyType =
  | 'Spatial Crack'
  | 'Sine-Wave Distortion'
  | 'Chromatic Abnormality'
  | 'Alchemical Calx Sublimation'
  | 'Zero-G Dissolution'
  | 'Gravitational Lensing';

export interface SolletPiece {
  id: string;
  keyframe: number;
  title: string;
  archetype: Archetype;
  phase: string;
  anomalyType: AnomalyType;
  scenePrompt: string;
  fashionConcept: string;
  garmentMechanics: GarmentMechanics;
  imagePrompt: string;
  tags: string[];
}

/**
 * ⚠️ `galeria` JEST PIERWSZA — to ona pokazuje PRAWDZIWY materiał.
 * Pozostałe widoki przyszły z szablonu AI Studio i operują na samych opisach.
 */
export type ViewMode = 'galeria' | 'kreacja' | 'marki' | 'runway-cards' | 'blueprint-matrix' | 'moodboard' | 'ai-stylist' | 'raw-json';

export type ColorwayPillar = 'Neon Green' | 'Void Blue' | 'Alchemical Orange';

export type GlobalTheme = 'Neon Green' | 'Void Blue' | 'Alchemical Orange';
