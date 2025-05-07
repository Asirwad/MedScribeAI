
'use client'; // Add this directive

import React from 'react';
import { DashboardThemeProvider, useDashboardTheme } from '@/context/dashboard-theme-provider'; // Import ThemeProvider
import { cn } from '@/lib/utils';

// Inner component to consume theme context
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboardTheme(); // Use the dashboard theme context

  React.useEffect(() => {
     // This log confirms the theme value received by the layout component
     console.log(`[DashboardLayoutContent] Current theme from context: ${theme}. Applying class: theme-${theme}`);
     // Add class to the body element directly to ensure global application within the dashboard
     document.body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            document.body.classList.remove(className);
        }
     });
     document.body.classList.add(`theme-${theme}`);

     // Cleanup function to remove theme class when component unmounts or theme changes
     return () => {
        console.log(`[DashboardLayoutContent] Cleaning up theme class: theme-${theme}`);
        document.body.classList.remove(`theme-${theme}`);
     };
  }, [theme]); // Re-run effect when theme changes

  return (
    // Main container doesn't need the theme class anymore as it's applied to body
    <div className={cn(
      "flex flex-col min-h-screen" // Ensure layout takes full height
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

