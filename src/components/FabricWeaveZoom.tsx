import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SolletPiece } from '../types';
import { ZoomIn, Crosshair, Lock, Unlock, Sliders, Sparkles, Layers, Info } from 'lucide-react';

interface FabricWeaveZoomProps {
  piece: SolletPiece;
  className?: string;
}

type WeaveMode = 'composite' | 'micro-carbon' | 'conductive-circuit';

export const FabricWeaveZoom: React.FC<FabricWeaveZoomProps> = ({
  piece,
  className = 'w-full h-36',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(3.5);
  const [weaveMode, setWeaveMode] = useState<WeaveMode>('composite');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 120, y: 60 });
  const [showDetails, setShowDetails] = useState(false);

  // Derive accent color based on anomaly and colorway
  const getAccentHex = useCallback(() => {
    const cw = (piece.garmentMechanics.colorway || '').toLowerCase();
    if (cw.includes('orange') || cw.includes('ff5500') || cw.includes('amber') || cw.includes('calx')) {
      return '#ff5500';
    }
    if (cw.includes('blue') || cw.includes('0055ff') || cw.includes('0044ff') || cw.includes('sapphire')) {
      return '#0055ff';
    }
    return '#00ff66';
  }, [piece.garmentMechanics.colorway]);

  const accentHex = getAccentHex();

  // Draw the base canvas (Macro View)
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Deep obsidian background with slight persistence for motion blur
      ctx.fillStyle = 'rgba(5, 6, 8, 0.3)';
      ctx.fillRect(0, 0, w, h);

      t += 0.025;

      // 1. Draw subtle carbon fiber textile weave grid
      const threadSpacing = 6;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += threadSpacing) {
        ctx.strokeStyle = (Math.floor(x / threadSpacing) % 2 === 0)
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.02)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = 0; y < h; y += threadSpacing) {
        ctx.strokeStyle = (Math.floor(y / threadSpacing) % 2 === 0)
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.02)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Draw sub-dermal conductive warp/weft traces (Pulsing cybernetic threads)
      const conductiveY = Math.floor(h * 0.4) + Math.sin(t) * 8;
      ctx.strokeStyle = `${accentHex}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, conductiveY);
      for (let x = 0; x < w; x += 15) {
        const jitter = Math.sin(x * 0.1 + t * 2) * 2;
        ctx.lineTo(x, conductiveY + jitter);
      }
      ctx.stroke();

      // 3. Render specific anomaly physics overlay
      const anomaly = piece.anomalyType;
      if (anomaly === 'Sine-Wave Distortion') {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = i === 0 ? `${accentHex}b3` : i === 1 ? 'rgba(0, 85, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)';
          for (let x = 0; x < w; x += 3) {
            const freq = 0.02 + i * 0.006;
            const y = h / 2 + Math.sin(x * freq + t + i) * (14 + i * 5) + Math.cos(x * 0.03 - t * 0.6) * 6;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (anomaly === 'Spatial Crack') {
        ctx.strokeStyle = `${accentHex}e6`;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const startX = w * 0.35 + Math.sin(t * 0.6) * 15;
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + 14, h * 0.35);
        ctx.lineTo(startX - 20, h * 0.65);
        ctx.lineTo(startX + 30, h);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (anomaly === 'Alchemical Calx Sublimation') {
        ctx.fillStyle = `${accentHex}cc`;
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 8;
        for (let p = 0; p < 10; p++) {
          const px = (p * 47 + t * 25) % w;
          const py = h - ((p * 29 + t * 35) % h);
          const r = 1 + (p % 2.5);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        // Gravitational Lensing / Chromatic / Zero-G
        ctx.strokeStyle = `${accentHex}88`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, Math.abs(Math.sin(t * 0.5)) * 30 + 15, 12, t * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
    };
  }, [piece.anomalyType, accentHex]);

  // Draw the magnified zoom canvas (Microscopic Full-Scale Weave View)
  useEffect(() => {
    if (!isHovered && !isLocked) return;
    const zoomCanvas = zoomCanvasRef.current;
    if (!zoomCanvas) return;
    const ctx = zoomCanvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let microTime = 0;

    const size = 160; // diameter of the circular zoom loupe
    zoomCanvas.width = size * window.devicePixelRatio;
    zoomCanvas.height = size * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const renderZoom = () => {
      microTime += 0.03;

      // Clear loupe area
      ctx.clearRect(0, 0, size, size);

      // Save for circular clipping mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      // Ultra-deep carbon matrix background
      ctx.fillStyle = '#030406';
      ctx.fillRect(0, 0, size, size);

      // Calculate focal offset based on mouse position & magnification
      const focalX = mousePos.x * zoomLevel;
      const focalY = mousePos.y * zoomLevel;

      // Draw high-resolution woven carbon micro-fibers (Warp & Weft interlacing)
      const threadPitch = 12 * (zoomLevel / 3.5); // scaled thread width

      // Draw Weft threads (horizontal)
      for (let y = -threadPitch; y < size + threadPitch; y += threadPitch) {
        const actualY = y - (focalY % threadPitch);
        const isAlternate = Math.floor((actualY + focalY) / threadPitch) % 2 === 0;

        // Individual fiber bundles inside thread
        const gradient = ctx.createLinearGradient(0, actualY, 0, actualY + threadPitch);
        gradient.addColorStop(0, '#0a0d14');
        gradient.addColorStop(0.5, isAlternate ? '#1a2233' : '#141a29');
        gradient.addColorStop(1, '#05070a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, actualY, size, threadPitch - 1.5);

        // Micro-striations along each filament
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, actualY + threadPitch * 0.3);
        ctx.lineTo(size, actualY + threadPitch * 0.3);
        ctx.moveTo(0, actualY + threadPitch * 0.7);
        ctx.lineTo(size, actualY + threadPitch * 0.7);
        ctx.stroke();
      }

      // Draw Warp threads (vertical interlaced over/under)
      for (let x = -threadPitch; x < size + threadPitch; x += threadPitch) {
        const actualX = x - (focalX % threadPitch);
        const colIdx = Math.floor((actualX + focalX) / threadPitch);

        for (let y = -threadPitch; y < size + threadPitch; y += threadPitch) {
          const actualY = y - (focalY % threadPitch);
          const rowIdx = Math.floor((actualY + focalY) / threadPitch);

          // Plain/Twill weave pattern: alternate which is on top
          const isWarpOnTop = (colIdx + rowIdx) % 2 === 0;

          if (isWarpOnTop) {
            const vGrad = ctx.createLinearGradient(actualX, 0, actualX + threadPitch, 0);
            vGrad.addColorStop(0, '#080a0f');
            vGrad.addColorStop(0.5, '#222d42');
            vGrad.addColorStop(1, '#05070b');

            ctx.fillStyle = vGrad;
            ctx.fillRect(actualX, actualY, threadPitch - 1.5, threadPitch);

            // Specular sheen along thread curve
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(actualX + threadPitch * 0.5, actualY);
            ctx.lineTo(actualX + threadPitch * 0.5, actualY + threadPitch);
            ctx.stroke();
          }
        }
      }

      // Draw Cybernetic Conductive Circuit Traces (Gold/Emerald/Sapphire filaments)
      if (weaveMode === 'composite' || weaveMode === 'conductive-circuit') {
        const pulse = Math.sin(microTime * 2) * 0.2 + 0.8;
        ctx.strokeStyle = accentHex;
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 8 * pulse;
        ctx.lineWidth = 1.8;

        // Conductive trace traversing through warp gaps
        ctx.beginPath();
        for (let x = 0; x < size; x += 10) {
          const cy = size / 2 + Math.sin(x * 0.05 + microTime + (focalX * 0.01)) * 18;
          if (x === 0) ctx.moveTo(x, cy);
          else ctx.lineTo(x, cy);
        }
        ctx.stroke();

        // Sub-dermal micro-nodes (conductive junctions)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
          const nx = (i * 45 + microTime * 15) % size;
          const ny = size / 2 + Math.sin(nx * 0.05 + microTime + (focalX * 0.01)) * 18;
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw Optical Grid & Micro-Scale Graticule
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(10, 10, size - 20, size - 20);

      // Central Crosshair Target
      ctx.strokeStyle = `${accentHex}cc`;
      ctx.lineWidth = 1;
      const c = size / 2;
      ctx.beginPath();
      // Center dot
      ctx.arc(c, c, 3, 0, Math.PI * 2);
      ctx.stroke();
      // Reticle ticks
      ctx.moveTo(c - 16, c); ctx.lineTo(c - 6, c);
      ctx.moveTo(c + 6, c); ctx.lineTo(c + 16, c);
      ctx.moveTo(c, c - 16); ctx.lineTo(c, c - 6);
      ctx.moveTo(c, c + 6); ctx.lineTo(c, c + 16);
      ctx.stroke();

      ctx.restore();

      // Outer bezel ring of the loupe
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();

      // HUD text on top of bezel
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${zoomLevel.toFixed(1)}X`, 14, size - 14);
      ctx.fillStyle = accentHex;
      ctx.fillText('10µm', size - 40, size - 14);

      animId = requestAnimationFrame(renderZoom);
    };

    animId = requestAnimationFrame(renderZoom);
    return () => cancelAnimationFrame(animId);
  }, [isHovered, isLocked, zoomLevel, mousePos, weaveMode, accentHex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setMousePos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !e.touches[0]) return;
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.touches[0].clientY - rect.top, rect.height));
    setMousePos({ x, y });
  };

  // Loupe position with clamping so it stays visible inside or neat the bounds
  const loupeSize = 160;
  const clampedLoupeX = Math.max(
    loupeSize / 2,
    Math.min(mousePos.x, (containerRef.current?.clientWidth || 300) - loupeSize / 2)
  );
  const clampedLoupeY = Math.max(
    loupeSize / 2,
    Math.min(mousePos.y, (containerRef.current?.clientHeight || 150) - loupeSize / 2)
  );

  return (
    <div className="space-y-2">
      {/* Visual Canvas Container with Hover-to-Zoom */}
      <div
        ref={containerRef}
        id={`weave-inspector-${piece.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isLocked) setIsHovered(false);
        }}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsHovered(true)}
        onTouchMove={handleTouchMove}
        className={`relative ${className} rounded-lg overflow-hidden border border-neutral-800/80 bg-[#040508] cursor-crosshair select-none group/canvas transition-colors`}
      >
        {/* Macro Base Canvas */}
        <canvas ref={baseCanvasRef} className="w-full h-full block" />

        {/* Static HUD Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/70 border border-neutral-700/80 text-[10px] font-mono text-neutral-300 flex items-center gap-1 backdrop-blur-xs">
            <ZoomIn className="w-3 h-3 text-[#00ff66]" />
            <span>{isHovered || isLocked ? `ZOOM ${zoomLevel}X` : 'HOVER TO ZOOM'}</span>
          </span>

          <span className="px-1.5 py-0.5 rounded bg-black/70 border border-neutral-700/80 text-[10px] font-mono text-neutral-400 backdrop-blur-xs hidden sm:inline-block">
            {piece.anomalyType}
          </span>
        </div>

        {/* Quick Toolbar on top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLocked(!isLocked);
            }}
            className={`p-1 rounded text-[10px] font-mono border transition-colors ${
              isLocked
                ? 'bg-[#00ff66]/20 border-[#00ff66] text-[#00ff66]'
                : 'bg-black/70 border-neutral-700/80 text-neutral-400 hover:text-white'
            }`}
            title={isLocked ? 'Unlock zoom lens' : 'Lock zoom reticle in place'}
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className={`p-1 rounded text-[10px] font-mono border transition-colors ${
              showDetails
                ? 'bg-[#00ff66]/20 border-[#00ff66] text-[#00ff66]'
                : 'bg-black/70 border-neutral-700/80 text-neutral-400 hover:text-white'
            }`}
            title="Toggle full-scale cybernetic weave telemetry"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        {/* Floating Magnified Weave Loupe (Active on hover or lock) */}
        {(isHovered || isLocked) && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75"
            style={{
              left: `${clampedLoupeX}px`,
              top: `${clampedLoupeY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              <canvas
                ref={zoomCanvasRef}
                style={{ width: `${loupeSize}px`, height: `${loupeSize}px` }}
                className="rounded-full shadow-[0_0_25px_rgba(0,0,0,0.95)] border-2 border-[#00ff66]/80"
              />

              {/* Coordinates Pill under Loupe */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/90 border border-neutral-700 rounded px-1.5 py-0.5 text-[9px] font-mono text-neutral-300 whitespace-nowrap shadow-md flex items-center gap-1">
                <Crosshair className="w-2.5 h-2.5 text-[#00ff66]" />
                <span>
                  X:{Math.round(mousePos.x)} Y:{Math.round(mousePos.y)}
                </span>
                <span className="text-[#00ff66]">[{zoomLevel}X]</span>
              </div>
            </div>
          </div>
        )}

        {/* Subtle hover callout prompt when not hovered */}
        {!isHovered && !isLocked && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-neutral-800 text-[10px] font-mono text-neutral-400 pointer-events-none opacity-80 group-hover/canvas:opacity-100 transition-opacity">
            Hover to inspect micro-weave
          </div>
        )}
      </div>

      {/* Live Zoom Controls & Spec Bar (Always visible or toggleable) */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-[#05070a] border border-neutral-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="text-[10px] uppercase text-neutral-500 font-semibold">Mag:</span>
          {[2.5, 3.5, 5.0].map((level) => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                zoomLevel === level
                  ? 'bg-neutral-800 text-[#00ff66] font-bold border border-[#00ff66]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {level}X
            </button>
          ))}
        </div>

        {/* Micro-Weave Layer Filter */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setWeaveMode('composite')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              weaveMode === 'composite'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Composite fabric and circuitry"
          >
            Composite
          </button>
          <button
            onClick={() => setWeaveMode('conductive-circuit')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              weaveMode === 'conductive-circuit'
                ? 'bg-neutral-800 text-[#00ff66] font-semibold'
                : 'text-neutral-500 hover:text-[#00ff66]'
            }`}
            title="Conductive sub-dermal threads"
          >
            Circuit
          </button>
        </div>
      </div>

      {/* Full-Scale Cybernetic Weave & Fabric Spec Telemetry (Expandable on hover or click) */}
      {(showDetails || isLocked || isHovered) && (
        <div className="p-2.5 rounded-lg border border-neutral-800/90 bg-[#020305] text-[11px] font-mono space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1">
            <span className="text-[10px] text-[#00ff66] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Full-Scale Weave Telemetry
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold">
              0.00G Textile Resolution
            </span>
          </div>

          <div className="space-y-1">
            <div>
              <span className="text-[#66a3ff] font-semibold">Cybernetic Weaving: </span>
              <span className="text-neutral-300 leading-snug">
                {piece.garmentMechanics.cyberneticWeaving}
              </span>
            </div>

            <div>
              <span className="text-[#00ff66] font-semibold">Micro-Textile: </span>
              <span className="text-neutral-400">
                {piece.garmentMechanics.materials}
              </span>
            </div>

            <div className="text-[10.5px]">
              <span className="text-[#ff8844] font-semibold">Optical Reflectance: </span>
              <span className="text-neutral-400">
                {piece.garmentMechanics.lightReflection}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
