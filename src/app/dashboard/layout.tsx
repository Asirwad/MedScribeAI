
'use client'; // Add this directive

import React from 'react';
import { DashboardThemeProvider, useDashboardTheme } from '@/context/dashboard-theme-provider'; // Import ThemeProvider
import { cn } from '@/lib/utils';

// Inner component to consume theme context
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboardTheme(); // Use the dashboard theme context

  return (
    <div className={cn(
      "flex flex-col min-h-screen", // Ensure layout takes full height
      `theme-${theme}` // Apply the theme class dynamically
    )}>
      {children}
    </div>
  );
}


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // Wrap the dashboard layout with the specific DashboardThemeProvider
    <DashboardThemeProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardThemeProvider>
  );
}
