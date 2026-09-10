import { SolletPiece, Archetype, ColorwayPillar } from '../types';

export interface ColorwayMeta {
  pillar: ColorwayPillar;
  title: string;
  hex: string;
  accentClass: string;
  badgeBg: string;
  borderClass: string;
  glowClass: string;
  tagline: string;
  textileFocus: string;
  atmosphericRole: string;
}

export const COLORWAY_METADATA: Record<ColorwayPillar, ColorwayMeta> = {
  'Neon Green': {
    pillar: 'Neon Green',
    title: 'Surgical Neon Green (#00FF66)',
    hex: '#00FF66',
    accentClass: 'text-[#00ff66]',
    badgeBg: 'bg-[#00ff66]/15',
    borderClass: 'border-[#00ff66]/40',
    glowClass: 'shadow-[0_0_20px_rgba(0,255,102,0.15)]',
    tagline: 'Kinetic Fissures & High-Tensile Structural Seams',
    textileFocus: 'Vantablack carbon micro-velvet, liquid memory Nitinol wireframe, fluoropolymer glass organza.',
    atmosphericRole: 'Marks razor-sharp spatial fractures, active conductive traces, and pre-stressed tension planes cutting through 0.00G vacuum darkness.',
  },
  'Void Blue': {
    pillar: 'Void Blue',
    title: 'Sharp Void Blue (#0055FF)',
    hex: '#0055FF',
    accentClass: 'text-[#66a3ff]',
    badgeBg: 'bg-[#0055ff]/15',
    borderClass: 'border-[#0055ff]/40',
    glowClass: 'shadow-[0_0_20px_rgba(0,85,255,0.15)]',
    tagline: 'Acoustic Wave Ripple & Zero-G Laminar Dissolution',
    textileFocus: 'Piezoelectric memory-silk taffeta, aerogel-infused chiffon, fiber-optic filament warp.',
    atmosphericRole: 'Expresses fluid boundary collapse, sinusoidal wave interference fringes, and cold vacuum optical refraction.',
  },
  'Alchemical Orange': {
    pillar: 'Alchemical Orange',
    title: 'Warm Alchemical Orange (#FF5500)',
    hex: '#FF5500',
    accentClass: 'text-[#ff8844]',
    badgeBg: 'bg-[#ff5500]/15',
    borderClass: 'border-[#ff5500]/40',
    glowClass: 'shadow-[0_0_20px_rgba(255,85,0,0.15)]',
    tagline: 'Thermal Calx Sublimation & Basalt Transmutation',
    textileFocus: 'Thermo-reactive glass organza, heat-treated copper gauze, compressed basalt-carbon composite.',
    atmosphericRole: 'Embodies thermal phase transitions, molten amber luminescence, and the alchemical union of void and radiant heat.',
  },
};

export function getPrimaryColorway(piece: SolletPiece): ColorwayPillar {
  const cw = (piece.garmentMechanics?.colorway || '').toLowerCase();
  const title = (piece.title || '').toLowerCase();
  const concept = (piece.fashionConcept || '').toLowerCase();
  const scene = (piece.scenePrompt || '').toLowerCase();
  const combined = `${cw} ${title} ${concept} ${scene}`;

  // Direct anomaly correlation
  if (piece.anomalyType === 'Alchemical Calx Sublimation') return 'Alchemical Orange';
  if (piece.anomalyType === 'Spatial Crack') return 'Neon Green';
  if (piece.anomalyType === 'Sine-Wave Distortion') return 'Void Blue';
  if (piece.anomalyType === 'Zero-G Dissolution') return 'Void Blue';

  const hasOrange =
    cw.includes('orange') ||
    cw.includes('ff5500') ||
    cw.includes('ff4500') ||
    cw.includes('amber') ||
    cw.includes('calx') ||
    combined.includes('calx') ||
    combined.includes('molten');

  const hasBlue =
    cw.includes('blue') ||
    cw.includes('0055ff') ||
    cw.includes('0044ff') ||
    cw.includes('sapphire') ||
    cw.includes('cyan') ||
    combined.includes('sinusoidal') ||
    combined.includes('acoustic');

  const hasGreen =
    cw.includes('green') ||
    cw.includes('00ff66') ||
    cw.includes('00ff77') ||
    cw.includes('emerald') ||
    combined.includes('tectonic') ||
    combined.includes('laser');

  if (hasOrange && !hasGreen && !hasBlue) return 'Alchemical Orange';
  if (hasGreen && !hasBlue && !hasOrange) return 'Neon Green';
  if (hasBlue && !hasGreen && !hasOrange) return 'Void Blue';

  if (piece.archetype === 'Solita') {
    return hasGreen ? 'Neon Green' : hasOrange ? 'Alchemical Orange' : 'Void Blue';
  }
  if (piece.archetype === 'Molita') {
    return hasBlue ? 'Void Blue' : hasGreen ? 'Neon Green' : 'Alchemical Orange';
  }
  return hasOrange ? 'Alchemical Orange' : hasGreen ? 'Neon Green' : 'Void Blue';
}

export function getAllColorways(piece: SolletPiece): ColorwayPillar[] {
  const cw = (piece.garmentMechanics?.colorway || '').toLowerCase();
  const prompt = (piece.imagePrompt || '').toLowerCase();
  const title = (piece.title || '').toLowerCase();
  const text = `${cw} ${prompt} ${title}`;

  const list: ColorwayPillar[] = [];
  if (text.includes('green') || text.includes('00ff66') || text.includes('00ff77') || text.includes('emerald')) {
    list.push('Neon Green');
  }
  if (text.includes('blue') || text.includes('0055ff') || text.includes('0044ff') || text.includes('sapphire') || text.includes('cyan')) {
    list.push('Void Blue');
  }
  if (text.includes('orange') || text.includes('ff5500') || text.includes('ff4500') || text.includes('amber') || text.includes('calx')) {
    list.push('Alchemical Orange');
  }

  if (list.length === 0) {
    list.push(getPrimaryColorway(piece));
  }
  return list;
}

export interface AestheticSummaryData {
  totalCount: number;
  colorwayCounts: Record<ColorwayPillar, number>;
  colorwayPercentages: Record<ColorwayPillar, number>;
  archetypeCounts: Record<Archetype, number>;
  archetypePercentages: Record<Archetype, number>;
  dominantTextiles: { name: string; count: number }[];
  dominantSilhouettes: { name: string; count: number }[];
  curatorialTone: string;
  atmosphericMood: string;
  paletteSynthesis: string;
}

export function generateAestheticSummary(pieces: SolletPiece[]): AestheticSummaryData {
  const total = pieces.length;

  const colorwayCounts: Record<ColorwayPillar, number> = {
    'Neon Green': 0,
    'Void Blue': 0,
    'Alchemical Orange': 0,
  };

  const archetypeCounts: Record<Archetype, number> = {
    Solita: 0,
    Molita: 0,
    'Hybrid Sovereign': 0,
  };

  const textileFrequencies: Record<string, number> = {};
  const silhouetteFrequencies: Record<string, number> = {};

  pieces.forEach((p) => {
    const col = getPrimaryColorway(p);
    colorwayCounts[col]++;
    archetypeCounts[p.archetype]++;

    // Textile parsing
    const rawMaterials = p.garmentMechanics?.materials || '';
    const mats = rawMaterials.split(/[,.]+/).map((m) => m.trim()).filter((m) => m.length > 4);
    mats.forEach((mat) => {
      // Normalize common textiles
      let key = mat;
      if (/carbon/i.test(mat)) key = 'Vantablack Carbon Velvet';
      else if (/nitinol/i.test(mat)) key = 'Liquid Memory Nitinol';
      else if (/organza/i.test(mat)) key = 'Fluoropolymer Glass Organza';
      else if (/taffeta/i.test(mat)) key = 'Piezoelectric Memory-Silk';
      else if (/aerogel|chiffon/i.test(mat)) key = 'Aerogel-Infused Chiffon';
      else if (/copper/i.test(mat)) key = 'Heat-Treated Copper Gauze';
      else if (/basalt/i.test(mat)) key = 'Basalt-Carbon Composite';
      else if (/photoluminescent/i.test(mat)) key = 'Photoluminescent Filaments';

      textileFrequencies[key] = (textileFrequencies[key] || 0) + 1;
    });

    // Silhouette parsing
    const rawSil = p.garmentMechanics?.cutsAndSilhouette || '';
    const sils = rawSil.split(/[,.]+/).map((s) => s.trim()).filter((s) => s.length > 5);
    sils.slice(0, 2).forEach((s) => {
      let key = s;
      if (/cantilever|levitat/i.test(s)) key = 'Floating Magnetic Cantilever';
      else if (/tectonic|column|sheath/i.test(s)) key = 'Asymmetric Tectonic Sheath';
      else if (/kimono|flowing|undulating/i.test(s)) key = 'Undulating Wave Kimono';
      else if (/peplum|cuirass/i.test(s)) key = 'Radial 0G Peplum Cuirass';
      else if (/bell|sleeve/i.test(s)) key = 'Orbital Bell Sleeves';
      else if (/origami|facet/i.test(s)) key = 'Pre-Stressed Origami Facets';

      silhouetteFrequencies[key] = (silhouetteFrequencies[key] || 0) + 1;
    });
  });

  const colorwayPercentages: Record<ColorwayPillar, number> = {
    'Neon Green': total ? Math.round((colorwayCounts['Neon Green'] / total) * 100) : 0,
    'Void Blue': total ? Math.round((colorwayCounts['Void Blue'] / total) * 100) : 0,
    'Alchemical Orange': total ? Math.round((colorwayCounts['Alchemical Orange'] / total) * 100) : 0,
  };

  const archetypePercentages: Record<Archetype, number> = {
    Solita: total ? Math.round((archetypeCounts['Solita'] / total) * 100) : 0,
    Molita: total ? Math.round((archetypeCounts['Molita'] / total) * 100) : 0,
    'Hybrid Sovereign': total ? Math.round((archetypeCounts['Hybrid Sovereign'] / total) * 100) : 0,
  };

  const dominantTextiles = Object.entries(textileFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const dominantSilhouettes = Object.entries(silhouetteFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Curatorial thesis synthesis
  let curatorialTone = 'Equilibrium Cathedral Synthesis';
  let atmosphericMood =
    'Harmonious zero-gravity dialogue bridging rigid crystalline tension, undulating wavefield drapery, and transmuted calx luminescence.';
  let paletteSynthesis =
    'Deep absorption Vantablack grounds high-contrast tripartite dialogs between surgical laser green, cold abyssal blue, and warm molten amber.';

  if (colorwayCounts['Neon Green'] > colorwayCounts['Void Blue'] + colorwayCounts['Alchemical Orange']) {
    curatorialTone = 'Hyper-Surgical Laser Tension';
    atmosphericMood =
      'Dominated by razor-sharp spatial fissures, pre-stressed Nitinol wireframes, and zero-scatter carbon nanostructures evoking uncompromising structural sovereignty.';
    paletteSynthesis =
      'High-contrast emerald photon shearing cutting through abyssal Vantablack, emphasizing precision engineering and anti-gravitational cantilever geometry.';
  } else if (colorwayCounts['Void Blue'] > colorwayCounts['Neon Green'] + colorwayCounts['Alchemical Orange']) {
    curatorialTone = 'Abyssal Laminar Wave Resonance';
    atmosphericMood =
      'Weightless fluid dissolution governed by acoustic interference fringes, where garments ripple like liquid mercury in an unbounded vacuum cathedral.';
    paletteSynthesis =
      'Cold sapphire diffraction and moiré iridescence dissolving structural contours into kinetic fields of blue-shifted vacuum glow.';
  } else if (colorwayCounts['Alchemical Orange'] > colorwayCounts['Neon Green'] + colorwayCounts['Void Blue']) {
    curatorialTone = 'Thermonuclear Calx Transmutation';
    atmosphericMood =
      'Scorched basalt and incandescent copper vapor celebrating matter undergoing spontaneous zero-G calcination from solid obsidian into radiant plasma.';
    paletteSynthesis =
      'Rich amber, scorched gold leaf, and vibrant thermal orange radiating through micro-perforated carbon cuirasses.';
  }

  return {
    totalCount: total,
    colorwayCounts,
    colorwayPercentages,
    archetypeCounts,
    archetypePercentages,
    dominantTextiles,
    dominantSilhouettes,
    curatorialTone,
    atmosphericMood,
    paletteSynthesis,
  };
}
