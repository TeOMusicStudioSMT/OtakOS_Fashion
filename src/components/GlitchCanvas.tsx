import React, { useEffect, useRef } from 'react';
import { AnomalyType } from '../types';

interface GlitchCanvasProps {
  anomalyType: AnomalyType;
  colorway?: string;
  className?: string;
}

export const GlitchCanvas: React.FC<GlitchCanvasProps> = ({
  anomalyType,
  className = 'w-full h-32',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Deep void background with slight persistence
      ctx.fillStyle = 'rgba(5, 6, 8, 0.25)';
      ctx.fillRect(0, 0, w, h);

      t += 0.03;

      if (anomalyType === 'Sine-Wave Distortion') {
        // Draw undulating sine wave interference fringes
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = i === 0 ? 'rgba(0, 255, 102, 0.7)' : i === 1 ? 'rgba(0, 85, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)';
          for (let x = 0; x < w; x += 4) {
            const freq = 0.02 + i * 0.005;
            const y = h / 2 + Math.sin(x * freq + t + i) * (18 + i * 6) + Math.cos(x * 0.04 - t * 0.5) * 8;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (anomalyType === 'Spatial Crack') {
        // Razor-thin emerald laser fractures and spatial fissures
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        const startX = (w * 0.3) + Math.sin(t * 0.5) * 20;
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + 15, h * 0.35);
        ctx.lineTo(startX - 25, h * 0.65);
        ctx.lineTo(startX + 40, h);
        ctx.stroke();

        // Secondary cross fissure
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(w * 0.7, h * 0.1);
        ctx.lineTo(w * 0.55, h * 0.5);
        ctx.lineTo(w * 0.8, h * 0.9);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (anomalyType === 'Alchemical Calx Sublimation') {
        // Molten orange and amber particles rising
        ctx.fillStyle = 'rgba(255, 85, 0, 0.8)';
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 8;
        for (let p = 0; p < 12; p++) {
          const px = ((p * 47 + t * 30) % w);
          const py = h - ((p * 29 + t * 40) % h);
          const r = 1 + (p % 3);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (anomalyType === 'Chromatic Abnormality') {
        // Red, green, blue prism shears
        const offset = Math.sin(t * 2) * 5;
        ctx.fillStyle = 'rgba(0, 255, 102, 0.35)';
        ctx.fillRect(w * 0.2 - offset, h * 0.2, w * 0.6, 2);
        ctx.fillStyle = 'rgba(0, 85, 255, 0.35)';
        ctx.fillRect(w * 0.2 + offset, h * 0.45, w * 0.6, 2);
        ctx.fillStyle = 'rgba(255, 85, 0, 0.35)';
        ctx.fillRect(w * 0.2, h * 0.7 - offset, w * 0.6, 2);
      } else if (anomalyType === 'Zero-G Dissolution') {
        // Floating decoupled starlight specks
        ctx.fillStyle = 'rgba(220, 240, 255, 0.7)';
        for (let p = 0; p < 16; p++) {
          const px = (p * 53 + Math.sin(t + p) * 15) % w;
          const py = (p * 37 + Math.cos(t * 0.8 + p) * 20) % h;
          ctx.fillRect(px, py, 1.5, 1.5);
        }
      } else {
        // Gravitational Lensing / Curvature rings
        ctx.strokeStyle = 'rgba(0, 85, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const cx = w / 2;
        const cy = h / 2;
        const radius = 25 + Math.sin(t) * 8;
        ctx.ellipse(cx, cy, radius * 2, radius * 0.7, 0.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, (radius + 15) * 2, (radius + 15) * 0.7, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [anomalyType]);

  return (
    <div className={`relative overflow-hidden rounded-md border border-neutral-800/80 bg-[#030406] ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-1.5 left-2 font-mono text-[9px] tracking-widest text-neutral-500 uppercase flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse"></span>
        0.00G TELEMETRY // {anomalyType}
      </div>
    </div>
  );
};
