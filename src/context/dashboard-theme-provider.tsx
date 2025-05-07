
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type DashboardTheme = 'blue' | 'pink' | 'green' | 'dracula' | 'high-contrast';
const DEFAULT_THEME: DashboardTheme = 'blue';
const LOCAL_STORAGE_KEY = 'dashboard-theme';

interface DashboardThemeContextProps {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextProps | undefined>(undefined);

interface DashboardThemeProviderProps {
  children: ReactNode;
}

export function DashboardThemeProvider({ children }: DashboardThemeProviderProps) {
  const [theme, setThemeState] = useState<DashboardTheme>(DEFAULT_THEME);

  // Load theme from local storage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTheme && ['blue', 'pink', 'green', 'dracula', 'high-contrast'].includes(storedTheme)) {
      setThemeState(storedTheme as DashboardTheme);
       console.log(`[DashboardTheme] Loaded theme from localStorage: ${storedTheme}`);
    } else {
      console.log(`[DashboardTheme] No valid theme in localStorage, using default: ${DEFAULT_THEME}`);
    }
  }, []);

  const setTheme = useCallback((newTheme: DashboardTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
      console.log(`[DashboardTheme] Saved theme to localStorage: ${newTheme}`);
    } catch (error) {
      console.error("[DashboardTheme] Failed to save theme to localStorage:", error);
    }
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme(): DashboardThemeContextProps {
  const context = useContext(DashboardThemeContext);
  if (context === undefined) {
    throw new Error('useDashboardTheme must be used within a DashboardThemeProvider');
  }
  return context;
}
