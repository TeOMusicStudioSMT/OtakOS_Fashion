// Script to generate the comprehensive 62-keyframe OtakOs SOLLET fashion catalog
import fs from 'fs';
import path from 'path';

const anomalies = [
  "Spatial Crack",
  "Sine-Wave Distortion",
  "Chromatic Abnormality",
  "Alchemical Calx Sublimation",
  "Zero-G Dissolution",
  "Gravitational Lensing"
];

const archetypes = ["Solita", "Molita", "Hybrid Sovereign"];

// Specific keyframe scene definitions ensuring all 62 keyframes are rich, distinct, and avant-garde
const keyframeThemes = [
  // ACT I: Keyframes 1-15 (The Zero-G Genesis & Spatial Cracks / Solita Archetype Dominance)
  {
    title: "Vantablack Tectonic Sheath with Laser-Etched Fracture Seams",
    archetype: "Solita",
    anomaly: "Spatial Crack",
    scene: "OtakOS Cathedral 0.00G chamber: Sudden vacuum decompression creating vertical spatial micro-fractures in the ambient field, splitting light into razor-thin emerald laser fissures against pitch-black void.",
    concept: "Translating vertical spatial ruptures into rigid, origami-creased carbon velvet sheaths split by electroluminescent neon-green filament sutures.",
    materials: "Vantablack carbon micro-velvet, liquid memory Nitinol wireframe, fluoropolymer glass organza.",
    cuts: "Asymmetric tectonic column sheath, severed shoulder mantle levitating 4cm above clavicle on negative-gravity magnetic pins.",
    reflection: "Zero-scatter light absorption on primary bodice contrasted with mirror-finish chromium titanium edges.",
    weaving: "Sub-dermal micro-coaxial conductive ribbons running along spine tension lines.",
    tension: "High-tensile carbon monofilament keeping split hip panels in static suspension.",
    colorway: "Deep Absorption Black (#050508) with Surgical Neon Green (#00FF66) fissure accents and Titanium Chrome (#E0E5EB)."
  },
  {
    title: "Sine-Wave Phase-Shifted Taffeta Kimono",
    archetype: "Molita",
    anomaly: "Sine-Wave Distortion",
    scene: "Cathedral transept: Acoustic frequency resonance distorting planar geometry into cascading sinusoidal ripples, bending light in soft emerald and sapphire harmonics.",
    concept: "Oscillating acoustic wave equations materialized as micro-pleated memory taffeta that undulates continuously without gravitational sagging.",
    materials: "Piezoelectric memory-silk taffeta, aerogel-infused polymer chiffon, fiber-optic filament warp.",
    cuts: "Deconstructed spatial kimono with flowing undulating lapels, fluted bell sleeves hovering in zero-gravity orbit.",
    reflection: "Moiré diffraction grating generating iridescent interference fringes under direct light.",
    weaving: "Bi-directional optical glass weft interwoven with conductive carbon yarn.",
    tension: "Equilibrium floating seams balanced by internal pneumatic pressure bladders.",
    colorway: "Void Black base, Sharp Void Blue (#0055FF) ripple contours, Surgical Neon Green wavecrest phosphorescence."
  },
  {
    title: "Alchemical Calx Molten Organza Peplum Armour",
    archetype: "Hybrid Sovereign",
    anomaly: "Alchemical Calx Sublimation",
    scene: "Alchemical furnace alcove: Thermal flash boundary where solid matter transitions instantly to ionized gas, casting deep amber-orange flares through obsidian dust.",
    concept: "The phase change of calcination captured in stiffened carbon cuirass transitioning into blistering, scorched molten orange translucent organza.",
    materials: "Thermo-reactive glass organza, heat-treated copper gauze, compressed basalt-carbon composite.",
    cuts: "Sculpted hourglass cuirass tapering into an explosive asymmetric peplum that fans out in radial Zero-G flares.",
    reflection: "Deep amber internal luminescence glowing through micro-perforated carbon scales.",
    weaving: "Electro-spun copper nano-wires creating localized warmth fields across sternum.",
    tension: "Pre-stressed ballistic carbon stays holding the peplum at a permanent 45-degree levitation angle.",
    colorway: "Deep Obsidian Black, Warm Alchemical Orange (#FF5500), Scorched Gold Leaf (#E6A100)."
  },
  {
    title: "Gravitational Lensing Monolith Trench",
    archetype: "Solita",
    anomaly: "Gravitational Lensing",
    scene: "Central nave: Massive micro-singularity warping spatial perspective, bending peripheral architectural pillars into curved parabolic arcs.",
    concept: "Hyper-extended tailoring where lapels and storm flaps bend around invisible curvature radii, simulating the optical distortion of a black hole event horizon.",
    materials: "Ultra-heavy double-face wool-graphite blend, liquid mercury polyvinyl sheeting, tungsten micro-buckles.",
    cuts: "Exaggerated curvilinear storm trench with swept-forward high collar and parabolically curving lapels.",
    reflection: "High-gloss wet-look wet-finish on inner facings, matte non-reflective light dampening on exterior shell.",
    weaving: "Orthogonal carbon twill with integrated shielding foil layers.",
    tension: "Rigid cantilevered shoulder horns extending horizontally without internal shoulder pads.",
    colorway: "Pitch Absorption Black (#020204), Edge Glint Chrome (#D1D9E6), Deep Indigo Void (#0B1021)."
  },
  {
    title: "Chromatic Abnormality Pleated Ballerina Shroud",
    archetype: "Molita",
    anomaly: "Chromatic Abnormality",
    scene: "Upper gallery: Optical prism rupture splitting white zero-point rays into uncoupled red, neon green, and cyan spatial vectors across the floor.",
    concept: "Micro-accordion pleating where each fold peak is dyed a surgical neon green and each valley a cyan-blue, revealing shifting colors as the wearer rotates in space.",
    materials: "Prismatic refractive mylar foil, triple-dyed mulberry silk organza, shape-memory polymer ribs.",
    cuts: "Multi-tiered kinetic crinoline shroud floating spherically around the lower body in microgravity.",
    reflection: "Directional chromatic aberration flashing green to blue depending on viewing perspective.",
    weaving: "Tri-axial prism-strand jacquard weaving with variable optical density.",
    tension: "Centrifugal hoop ribs holding circular geometry through rotational inertia.",
    colorway: "Surgical Neon Green (#00FF66), Sharp Void Blue (#0044EE), Shadow Coal (#111317)."
  },
  {
    title: "Zero-G Dissolution Filament Robe",
    archetype: "Molita",
    anomaly: "Zero-G Dissolution",
    scene: "High altar: Ambient gravity reaches absolute zero; crystalline columns fragment into micro-debris that drifts upward in slow laminar streams.",
    concept: "A garment whose hem does not terminate, dissolving into hundreds of individually levitating carbon-silk micro-streamers.",
    materials: "Featherweight carbon-silk filament gossamer, static-charged polymer threads, silver ion misting.",
    cuts: "Seamless tubular tunic dissolving from dense opaque collar down into thousands of floating tendrils.",
    reflection: "Starlight scintillation on suspended silver nanoparticles along each yarn tip.",
    weaving: "Progressively loosened warp count transitioning from 200 TPI at neckline to 4 TPI at hem.",
    tension: "Zero structural tension; silhouette dictated entirely by local electrostatic repulsion.",
    colorway: "Deep Space Black (#040507), Frost Emerald (#22FF88), Starlight Silver (#F0F4F8)."
  },
  {
    title: "Cryo-Glitch Monofilament Corsetry",
    archetype: "Solita",
    anomaly: "Spatial Crack",
    scene: "Sub-level crypt: Coolant breach venting liquid nitrogen across magnetic rails, creating jagged crystallographic frost fractures across black alloy floor.",
    concept: "Exoskeletal corset engineered from 3D-printed black zirconia ceramic ribs bound by tensioned fluorocarbon cables.",
    materials: "Zirconia ceramic stays, tensioned fluorocarbon wire, laser-cut neoprene mesh, emerald LED micro-piping.",
    cuts: "Hyper-articulated skeletal waist cincher with decoupled floating hip spurs and sternum dagger guard.",
    reflection: "Specular ceramic glaze with razor-sharp green specular highlights along bone lines.",
    weaving: "Interlocking chain-link Kevlar webbing at lateral flex zones.",
    tension: "Spring-loaded ratchet tensioners allowing dynamic breathing expansion under high mechanical load.",
    colorway: "Matte Ceramic Black, Surgical Neon Green (#00FF77), Cold Steel (#8E9BAE)."
  },
  {
    title: "Bifurcated Void-Jump Flight Caftan",
    archetype: "Hybrid Sovereign",
    anomaly: "Gravitational Lensing",
    scene: "Airlock gate: Portal ignition creating twin counter-rotating vortices, warping space into a dual-funnel topology with electric blue discharge.",
    concept: "Dual-chambered split caftan with twin billowing trains that counter-rotate in microgravity drafts, stabilized by magnetic hem weights.",
    materials: "Ballistic parachute silk, metalized ripstop nylon, neodymium magnetic ring weights.",
    cuts: "Floor-length dual-vent caftan with plunging hexagonal neckline and levitating batwing drapery.",
    reflection: "Metallic ripstop grid reflecting geometric grid reflections under directional spotlights.",
    weaving: "Ripstop grid embedded with electro-conductive silver grid lines.",
    tension: "Magnetic repulsion rings along split hems preventing fabric entanglement.",
    colorway: "Void Absorption Black (#06070A), Electric Sharp Blue (#0066FF), Alchemical Amber (#FF6B00)."
  },
  {
    title: "Sublimated Sulfur Calx Halter Cuirass",
    archetype: "Solita",
    anomaly: "Alchemical Calx Sublimation",
    scene: "Transmutation crucible: Superheated sulfur and antimony boiling into thick vapor clouds, casting an intense fiery amber glow across obsidian pillars.",
    concept: "Cast-carbon breastplate with heat-tempered alchemical orange gradient enamel, fastened with industrial quick-release harness webbing.",
    materials: "Thermoformed carbon fiber, vitreous orange enamel, mil-spec nylon webbing, anodized orange aluminum buckles.",
    cuts: "Anatomical molded breastplate with sharp cantilevered shoulder epaulettes and exposed floating back armature.",
    reflection: "Deep crystalline candy-coat orange luminescence over raw carbon fiber weave texture.",
    weaving: "Braided aramid harness straps with high-contrast safety stitching in neon green.",
    tension: "Multi-point torso harness with cam-lock tension distribution.",
    colorway: "Alchemical Calx Orange (#FF4500), Raw Twill Carbon Black (#141518), Surgical Green Accent (#10FF60)."
  },
  {
    title: "Laminar Flow Interference Capelet",
    archetype: "Molita",
    anomaly: "Sine-Wave Distortion",
    scene: "Aerodynamic wind tunnel: Microgravity atmospheric currents forming perfect laminar shear layers illuminated by emerald particle tracer lasers.",
    concept: "Multi-layered aerogel organza capelet cut on the bias, responding to wearer movement by creating standing wave aerodynamic ripples.",
    materials: "Ultra-thin aerogel silica organza, monofilament nylon, laser-cut iridescent film.",
    cuts: "Concentric circular tiered capelet with stepped undulating hems that cascade down the back.",
    reflection: "Thin-film interference producing oil-slick chromatic gradients between emerald and cyan.",
    weaving: "Ultra-dense circular circular-loom weave with variable tension gradient.",
    tension: "Negative-buoyancy weighted hem beadings keeping tiers separated during zero-G rotation.",
    colorway: "Liquid Oil Black (#08080C), Neon Green Sheen (#00FF88), Peacock Void Blue (#004080)."
  },
  {
    title: "Quantum Entanglement Bonded Jumpsuit",
    archetype: "Solita",
    anomaly: "Spatial Crack",
    scene: "Cathedral data sanctuary: Fiber-optic quantum trunks snapping under spatial strain, spraying coherent photons in discontinuous pulse sequences.",
    concept: "Second-skin compression jumpsuit featuring laser-welded bonding seams that mimic broken circuit pathways across muscle groups.",
    materials: "Four-way stretch graphene elastomer, polyurethane bonded seams, electroluminescent wire traces.",
    cuts: "Ergonomic catsuit with articulated geometric compression paneling and mock-neck spatial collar.",
    reflection: "Ultra-matte non-reflective skin with bright pulsed luminescent fracture lines.",
    weaving: "Seamless circular knit with localized compression zones engineered to prevent zero-G blood pooling.",
    tension: "Variable modulus elasticity providing postural stabilization for the spine.",
    colorway: "Carbon Black (#0A0A0E), Surgical Neon Green (#00FF55), Pure Quantum White (#FFFFFF)."
  },
  {
    title: "Molten Calx Asymmetric Draped Sarong",
    archetype: "Molita",
    anomaly: "Alchemical Calx Sublimation",
    scene: "Slag runoff canal: Rivers of molten alchemical gold and cinnabar flowing beneath transparent floor gratings, projecting flickering thermal caustics upward.",
    concept: "Fluid heavy-silk charmeuse saturated in cadmium and cinnabar orange dyes, draped asymmetrically around hips with charred raw hems.",
    materials: "Heavy 40mm silk charmeuse, liquid metal leaf, distressed carbonized linen.",
    cuts: "Spiral-draped sarong skirting anchored by a single titanium hip carabiner, sweeping into an undulating side-train.",
    reflection: "High-specular liquid silk gloss reflecting ambient lights like molten metal.",
    weaving: "Dense satin weave with slubbed raw-silk accent threads.",
    tension: "Single-point gravity-defying hip drape suspended from a tensioned carbon wire belt.",
    colorway: "Warm Alchemical Orange (#FF5000), Molten Gold (#FF9900), Deep Charred Black (#050507)."
  },
  {
    title: "Event Horizon Ergonomic Balaclava Gown",
    archetype: "Hybrid Sovereign",
    anomaly: "Gravitational Lensing",
    scene: "Observatory dome: Spatial curvature pinching light rays into a luminous ring encircling the dark silhouette of the cathedral spire.",
    concept: "All-in-one balaclava evening gown transitioning seamlessly from a skin-tight face veil into an architectural fluted trumpet skirt.",
    materials: "Micro-mesh light-trapping jersey, structured horsehair braid hem, liquid latex coating.",
    cuts: "Seamless continuous cocoon silhouette wrapping from skull to floor with zero side seams.",
    reflection: "Matte velvet texture from crown to waist, transitioning into high-gloss liquid latex at the hem.",
    weaving: "Seamless 3D circular micro-knit with variable opacity zones over eyes and ears.",
    tension: "Radial horsehair hem framing maintaining circular perimeter even in weightlessness.",
    colorway: "Vantablack Absorption, Event Horizon Chrome (#C8D2DC), Sharp Void Cyan (#00E5FF)."
  },
  {
    title: "Vector-Shear Pleated Origami Tunic",
    archetype: "Solita",
    anomaly: "Spatial Crack",
    scene: "Structural support nexus: Cantilever beams experiencing shear stress, causing planar deflection along 30-degree diagonal fault planes.",
    concept: "Rigid Miura-fold tessellated origami tunic that compresses flat along fracture planes and expands into a three-dimensional protective carapace.",
    materials: "Aramid-reinforced coated paper-cloth, carbon fiber battens, ultrasonic welded hinges.",
    cuts: "Geometric box-silhouette tunic constructed from 64 interlocking folded triangular facets.",
    reflection: "Anisotropic matte paper sheen with stark cast shadows between adjacent facets.",
    weaving: "Non-woven high-density polyethylene fiber bonded with aramid matrix.",
    tension: "Pre-creased bistable mechanical joints that snap between collapsed and expanded states.",
    colorway: "Void Obsidian Black (#030304), Sharp Neon Green (#00FF66) crease highlights, Gunmetal Grey (#4A5260)."
  },
  {
    title: "Atmospheric Re-entry Ionization Mantle",
    archetype: "Hybrid Sovereign",
    anomaly: "Alchemical Calx Sublimation",
    scene: "Cathedral thermal shielding shield: Compression shockwave creating incandescent orange-violet plasma sheath during planetary orbital entry.",
    concept: "Voluminous standing collar mantle lined with heat-reactive iridescent silica that glows orange when exposed to environmental friction.",
    materials: "Ceramic thermal barrier fabric, aluminized mylar thermal lining, titanium memory alloy collar stay.",
    cuts: "Hyperbolic flared standing collar framing the head like an alchemical halo, falling into an elongated cape.",
    reflection: "Aluminized mirror underside throwing warm orange reflected light onto the wearer's neck.",
    weaving: "Multi-layered woven silica refractory yarn used in orbital spacecraft heat shielding.",
    tension: "Shape-memory alloy skeleton that expands into full protective fan flare at elevated kinetic velocities.",
    colorway: "Deep Charcoal Black, Burning Alchemical Orange (#FF4800), Ionization Violet (#8800FF)."
  }
];

// Generate 62 rich entries programmatically by combining curated base archetypes with deep mathematical & couture variations
const fullCatalog = [];

for (let i = 1; i <= 62; i++) {
  const baseTheme = keyframeThemes[(i - 1) % keyframeThemes.length];
  const archetype = archetypes[(i - 1) % 3];
  const anomaly = anomalies[(i - 1) % anomalies.length];
  const id = `SOLLET-KF${String(i).padStart(2, '0')}`;

  // Unique modifiers and variations for each keyframe
  const phase = i <= 15 ? "Act I: 0.00G Genesis" : i <= 30 ? "Act II: Dynamic Glitch Collapse" : i <= 45 ? "Act III: Calx Transmutation" : "Act IV: Sovereign Cathedral Resonance";
  
  const title = `SOLLET-KF${String(i).padStart(2, '0')}: ${archetype} ${baseTheme.title.replace(/SOLLET-KF\d+:\s*/, '')} [${anomaly.toUpperCase()}]`;

  const scenePrompt = `[0.00G OtakOS Cathedral - Scene ${i}/62 - ${phase}]: Environmental physics anomaly: ${anomaly}. Ambient zero-gravity vacuum chamber with ${
    anomaly === "Spatial Crack" ? "planar tearing, razor-sharp fracture voids, emerald laser stitching through abyssal darkness" :
    anomaly === "Sine-Wave Distortion" ? "acoustic wave interference fringes, undulating gravitational pressure waves in sapphire and neon green" :
    anomaly === "Chromatic Abnormality" ? "refractive prism split across structural pilasters, dispersing pure cobalt blue and surgical green chromatic aberration" :
    anomaly === "Alchemical Calx Sublimation" ? "calcined thermal vapor flash, molten alchemical orange sublimation erupting through carbon dust" :
    anomaly === "Zero-G Dissolution" ? "complete gravitational decoupling, dissolving particulate boundaries floating in silent laminar currents" :
    "curved spacetime horizons, optical deflection bending light rays around floating architectural anchors"
  }. Atmospheric density 0.00 atm, localized kinetic shear vectors.`;

  const fashionConcept = `Translation of Scene ${i} physics: Transforming ${anomaly.toLowerCase()} phenomena into an avant-garde ${archetype.toLowerCase()} haute couture silhouette. The garment explores ${
    archetype === "Solita" ? "architectural rigidity, razor-sharp tension planes, crystalline drape, and negative-gravity cantilevered panels" :
    archetype === "Molita" ? "amorphous fluid morphology, liquid mercury drape, phase-shifting boundary membranes, and zero-G undulating wave trains" :
    "the synthesis of sovereign alchemical transmutation, uniting rigid carbon armour plates with dissolving liquid-crystal drapery"
  }.`;

  const materials = `${baseTheme.materials} Reactive photoluminescent filaments, ultra-matte carbon nanostructure.`;
  const cuts = `${baseTheme.cuts} Engineered specifically for 0.00G suspension without hem droop.`;
  const lightReflection = `${baseTheme.reflection} Tuned for dramatic runway chiaroscuro under directional xenon and laser spot illumination.`;
  const cyberneticWeaving = `${baseTheme.weaving} Conductive micro-pathways calibrated for 0.00G static dissipation.`;
  const structuralTension = `${baseTheme.tension} Counter-balanced against orbital micro-drift.`;
  
  const colorway = i % 4 === 0 
    ? "Deep Absorption Black (#030305), Surgical Neon Green (#00FF66), Sharp Void Blue (#0055FF)" 
    : i % 4 === 1
    ? "Deep Obsidian Black (#040406), Warm Alchemical Orange (#FF5500), Titanium Chrome (#DDE3EA)"
    : i % 4 === 2
    ? "Pitch Black (#020203), Surgical Neon Green (#00FF66), Alchemical Calx Orange (#FF4500)"
    : "Absorption Black (#050508), Sharp Void Blue (#0044FF), Surgical Neon Green (#00FF77), Molten Amber (#FFAA00)";

  const imagePrompt = `Editorial haute couture runway photograph from OtakOS Fashion "SOLLET" collection, piece ${id} (${archetype} Archetype). Full-body avant-garde fashion showcase featuring a stunning architectural zero-gravity garment: ${cuts}. Constructed from ${materials}. Color palette strictly deep light-absorbing absorption black contrasted with ${colorway}. Hyper-detailed macro textile weave, liquid-metal reflections, sharp surgical neon green seam highlights, spatial crack edge glow, zero-gravity levitating fabric layers floating in perfect suspension. Shot on Hasselblad H6D-100c, 85mm f/1.4 lens, dramatic chiaroscuro studio lighting, hyper-realistic, 8k resolution, Vogue Italia cyber-couture editorial. --ar 3:4 --style raw --v 6.0`;

  fullCatalog.push({
    id,
    keyframe: i,
    title,
    archetype,
    phase,
    anomalyType: anomaly,
    scenePrompt,
    fashionConcept,
    garmentMechanics: {
      materials,
      cutsAndSilhouette: cuts,
      lightReflection,
      cyberneticWeaving,
      structuralTension,
      colorway
    },
    imagePrompt,
    tags: [archetype, anomaly, "0.00G", "SOLLET", "Haute Couture", "Cyber-Alchemical"]
  });
}

// Write to OtakOs_Fashion/katalog.json
const katalogJsonPath = path.resolve('OtakOs_Fashion', 'katalog.json');
fs.writeFileSync(katalogJsonPath, JSON.stringify(fullCatalog, null, 2));
console.log(`Generated ${fullCatalog.length} entries to ${katalogJsonPath}`);

// Also export as TypeScript file for direct import in frontend
const tsExport = `// Autogenerated OtakOS Fashion SOLLET Catalog
export interface GarmentMechanics {
  materials: string;
  cutsAndSilhouette: string;
  lightReflection: string;
  cyberneticWeaving: string;
  structuralTension: string;
  colorway: string;
}

export interface SolletPiece {
  id: string;
  keyframe: number;
  title: string;
  archetype: "Solita" | "Molita" | "Hybrid Sovereign";
  phase: string;
  anomalyType: "Spatial Crack" | "Sine-Wave Distortion" | "Chromatic Abnormality" | "Alchemical Calx Sublimation" | "Zero-G Dissolution" | "Gravitational Lensing";
  scenePrompt: string;
  fashionConcept: string;
  garmentMechanics: GarmentMechanics;
  imagePrompt: string;
  tags: string[];
}

export const SOLLET_KATALOG: SolletPiece[] = ${JSON.stringify(fullCatalog, null, 2)};
`;

fs.writeFileSync(path.resolve('src', 'data', 'katalog.ts'), tsExport);
console.log(`Exported TypeScript catalog to src/data/katalog.ts`);
