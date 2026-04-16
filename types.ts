import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  gold: string;       // accent color
  ink: string;        // primary text/dark color
  offWhite: string;   // background
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'classic-gold',   name: 'Classic Gold',   gold: '#D4AF37', ink: '#121212', offWhite: '#FFFFFF' },
  { id: 'royal-blue',     name: 'Royal Blue',     gold: '#3B82F6', ink: '#0F172A', offWhite: '#F8FAFC' },
  { id: 'emerald',        name: 'Emerald',        gold: '#10B981', ink: '#0A1F1A', offWhite: '#F0FDF4' },
  { id: 'rose-gold',      name: 'Rose Gold',      gold: '#C2786A', ink: '#1A0F0E', offWhite: '#FFF8F7' },
  { id: 'platinum',       name: 'Platinum',       gold: '#9CA3AF', ink: '#111827', offWhite: '#F9FAFB' },
  { id: 'deep-purple',    name: 'Deep Purple',    gold: '#8B5CF6', ink: '#1E1B4B', offWhite: '#FAF5FF' },
  { id: 'crimson',        name: 'Crimson Red',    gold: '#EF4444', ink: '#1A0000', offWhite: '#FFF5F5' },
  { id: 'orange-luxury',  name: 'Orange Luxury',  gold: '#F97316', ink: '#1C0A00', offWhite: '#FFF7ED' },
  { id: 'teal',           name: 'Teal Ocean',     gold: '#14B8A6', ink: '#042F2E', offWhite: '#F0FDFA' },
  { id: 'champagne',      name: 'Champagne',      gold: '#C9A84C', ink: '#1C1410', offWhite: '#FDFBF6' },
];

const STORAGE_KEY = 'luxaThemeId';

interface ThemeContextType {
  theme: ThemePreset;
  setThemeById: (id: string) => void;
  presets: ThemePreset[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyTheme = (t: ThemePreset) => {
  const root = document.documentElement;
  root.style.setProperty('--color-gold', t.gold);
  root.style.setProperty('--color-ink', t.ink);
  root.style.setProperty('--color-off-white', t.offWhite);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = THEME_PRESETS.find(p => p.id === saved) || THEME_PRESETS[0];
  const [theme, setTheme] = useState<ThemePreset>(initial);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setThemeById = (id: string) => {
    const found = THEME_PRESETS.find(p => p.id === id);
    if (found) {
      setTheme(found);
      localStorage.setItem(STORAGE_KEY, id);
      applyTheme(found);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeById, presets: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
