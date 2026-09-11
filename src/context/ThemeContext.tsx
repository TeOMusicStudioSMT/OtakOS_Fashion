import React, { createContext, useContext, useState, useEffect } from 'react';
import { GlobalTheme } from '../types';

export interface ThemeConfig {
  id: GlobalTheme;
  key: 'neon-green' | 'void-blue' | 'alchemical-orange';
  name: string;
  hex: string;
  subtleHex: string;
  borderHex: string;
  rgb: string;
  moodSubtitle: string;
  archetypeAffinity: string;
  atmosphericDescription: string;
  accentTextClass: string;
  badgeClass: string;
  borderClass: string;
  glowClass: string;
}

export const THEMES: Record<GlobalTheme, ThemeConfig> = {
  'Neon Green': {
    id: 'Neon Green',
    key: 'neon-green',
    name: 'Surgical Neon Green',
    hex: '#00ff66',
    subtleHex: 'rgba(0, 255, 102, 0.12)',
    borderHex: 'rgba(0, 255, 102, 0.35)',
    rgb: '0, 255, 102',
    moodSubtitle: 'Laser Fissures & Nitinol Kinetic Tension',
    archetypeAffinity: 'Solita Crystalline Alignment',
    atmosphericDescription: 'Razor-sharp emerald optical vectors, surgical seam fractures, and hyper-tensile carbon nanostructures.',
    accentTextClass: 'text-[#00ff66]',
    badgeClass: 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/40',
    borderClass: 'border-[#00ff66]/40',
    glowClass: 'shadow-[0_0_20px_rgba(0,255,102,0.25)]',
  },
  'Void Blue': {
    id: 'Void Blue',
    key: 'void-blue',
    name: 'Sharp Void Blue',
    hex: '#0055ff',
    subtleHex: 'rgba(0, 85, 255, 0.15)',
    borderHex: 'rgba(0, 85, 255, 0.4)',
    rgb: '0, 85, 255',
    moodSubtitle: 'Acoustic Interference & Vacuum Dissolution',
    archetypeAffinity: 'Molita Fluid Wave Alignment',
    atmosphericDescription: 'Weightless liquid mercury ripples, sinusoidal acoustic wavefields, and deep sapphire vacuum dispersion.',
    accentTextClass: 'text-[#66a3ff]',
    badgeClass: 'bg-[#0055ff]/15 text-[#66a3ff] border-[#0055ff]/40',
    borderClass: 'border-[#0055ff]/40',
    glowClass: 'shadow-[0_0_20px_rgba(0,85,255,0.25)]',
  },
  'Alchemical Orange': {
    id: 'Alchemical Orange',
    key: 'alchemical-orange',
    name: 'Warm Alchemical Orange',
    hex: '#ff5500',
    subtleHex: 'rgba(255, 85, 0, 0.15)',
    borderHex: 'rgba(255, 85, 0, 0.4)',
    rgb: '255, 85, 0',
    moodSubtitle: 'Calx Sublimation & Molten Transmutation',
    archetypeAffinity: 'Hybrid Sovereign Alignment',
    atmosphericDescription: 'Thermal plasma phase changes, calcined basalt composites, and scorched amber luminescence.',
    accentTextClass: 'text-[#ff8844]',
    badgeClass: 'bg-[#ff5500]/15 text-[#ff8844] border-[#ff5500]/40',
    borderClass: 'border-[#ff5500]/40',
    glowClass: 'shadow-[0_0_20px_rgba(255,85,0,0.25)]',
  },
};

interface ThemeContextType {
  theme: GlobalTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: GlobalTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'Neon Green',
  themeConfig: THEMES['Neon Green'],
  setTheme: () => {},
});

const STORAGE_KEY = 'otakos-global-accent-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<GlobalTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'Neon Green' || saved === 'Void Blue' || saved === 'Alchemical Orange')) {
        return saved as GlobalTheme;
      }
    } catch {
      // ignore
    }
    return 'Neon Green';
  });

  const themeConfig = THEMES[theme] || THEMES['Neon Green'];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    // Update document root data attribute and CSS variables
    const root = document.documentElement;
    root.setAttribute('data-theme', themeConfig.key);
    root.style.setProperty('--accent', themeConfig.hex);
    root.style.setProperty('--accent-rgb', themeConfig.rgb);
    root.style.setProperty('--accent-subtle', themeConfig.subtleHex);
    root.style.setProperty('--accent-border', themeConfig.borderHex);
    root.style.setProperty('--accent-glow', `rgba(${themeConfig.rgb}, 0.25)`);
  }, [theme, themeConfig]);

  const setTheme = (newTheme: GlobalTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
