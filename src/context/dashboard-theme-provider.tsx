
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
    try {
      const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
      console.log(`[DashboardTheme] Attempting to load theme from localStorage. Found: ${storedTheme}`);
      if (storedTheme && ['blue', 'pink', 'green', 'dracula', 'high-contrast'].includes(storedTheme)) {
        setThemeState(storedTheme as DashboardTheme);
        console.log(`[DashboardTheme] Loaded theme from localStorage: ${storedTheme}`);
      } else {
        console.log(`[DashboardTheme] No valid theme in localStorage or theme invalid (${storedTheme}), using default: ${DEFAULT_THEME}`);
        // Optionally set the default theme in localStorage if none is found
        // localStorage.setItem(LOCAL_STORAGE_KEY, DEFAULT_THEME);
      }
    } catch (error) {
       console.error("[DashboardTheme] Error accessing localStorage:", error);
       // Fallback to default if localStorage is inaccessible
       setThemeState(DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((newTheme: DashboardTheme) => {
    console.log(`[DashboardTheme] setTheme called with: ${newTheme}`);
    setThemeState(newTheme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
      console.log(`[DashboardTheme] Saved theme to localStorage: ${newTheme}`);
    } catch (error) {
      console.error("[DashboardTheme] Failed to save theme to localStorage:", error);
    }
  }, []);

  // Log when the theme state actually changes
  useEffect(() => {
    console.log(`[DashboardTheme] Theme state updated to: ${theme}`);
  }, [theme]);


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

