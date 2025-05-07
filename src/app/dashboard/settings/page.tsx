
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useDashboardTheme } from '@/context/dashboard-theme-provider'; // Import dashboard theme hook
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Moon, Sun, Laptop, Paintbrush, Palette, Contrast } from 'lucide-react'; // Added more icons
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/app-layout'; // Import AppLayout for consistent structure

// Define available dashboard themes
const dashboardThemes = [
    { value: 'blue', label: 'Default Blue', icon: Palette },
    { value: 'pink', label: 'Sakura Pink', icon: Paintbrush },
    { value: 'green', label: 'Emerald Green', icon: Paintbrush },
    { value: 'dracula', label: 'Dracula Purple', icon: Paintbrush },
    { value: 'high-contrast', label: 'High Contrast', icon: Contrast },
] as const; // Use "as const" for stricter type checking

type DashboardThemeValue = typeof dashboardThemes[number]['value'];


export default function SettingsPage() {
    const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme(); // For light/dark/system
    const { theme: dashboardTheme, setTheme: setDashboardTheme } = useDashboardTheme(); // For dashboard accent themes

    const handleDashboardThemeChange = (value: string) => {
        // Ensure the value is one of the allowed themes before setting
        if (dashboardThemes.some(t => t.value === value)) {
            setDashboardTheme(value as DashboardThemeValue);
        }
    };

  // Dummy patient data for AppLayout props (replace with actual logic if needed, maybe fetch from context?)
  const dummyPatients = [];
  const dummySelectedPatient = null;


  return (
     // Wrap settings content in AppLayout for consistent navigation/sidebar
     // Pass necessary props to AppLayout - might need adjustment based on actual state management
     <AppLayout
        patients={dummyPatients}
        selectedPatient={dummySelectedPatient}
        onSelectPatient={() => {}}
        onAddPatient={() => {}}
        onReturnToLanding={() => { /* Navigate to landing */ }}
        onPatientDeleted={() => {}}
        onPatientUpdated={async () => {}} // Provide async stub
     >
        <div className="flex-1 p-4 md:p-8 lg:p-12 bg-background">
            <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                 {/* Light/Dark Mode Settings Card */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Laptop className="h-5 w-5 text-primary" />
                            Display Mode
                        </CardTitle>
                        <CardDescription>Choose your preferred light or dark mode.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant={mode === 'light' ? 'default' : 'outline'}
                            onClick={() => setMode('light')}
                            className="flex-1 justify-center gap-2"
                            aria-pressed={mode === 'light'}
                        >
                            <Sun className="h-4 w-4" /> Light
                        </Button>
                        <Button
                            variant={mode === 'dark' ? 'default' : 'outline'}
                            onClick={() => setMode('dark')}
                             className="flex-1 justify-center gap-2"
                             aria-pressed={mode === 'dark'}
                        >
                            <Moon className="h-4 w-4" /> Dark
                        </Button>
                        <Button
                            variant={mode === 'system' ? 'default' : 'outline'}
                            onClick={() => setMode('system')}
                             className="flex-1 justify-center gap-2"
                             aria-pressed={mode === 'system'}
                        >
                           <Laptop className="h-4 w-4" /> System
                        </Button>
                    </CardContent>
                </Card>

                {/* Dashboard Accent Theme Settings Card */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <Palette className="h-5 w-5 text-primary" />
                             Dashboard Theme
                        </CardTitle>
                        <CardDescription>Select the accent color theme for the dashboard.</CardDescription>
                    </CardHeader>
                     <CardContent>
                       {/* Use RadioGroup for theme selection */}
                        <RadioGroup
                           value={dashboardTheme}
                           onValueChange={handleDashboardThemeChange}
                           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                           {dashboardThemes.map((themeOption) => (
                             <Label
                               key={themeOption.value}
                               htmlFor={`theme-${themeOption.value}`}
                                className={cn(
                                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                  dashboardTheme === themeOption.value ? "border-primary ring-2 ring-primary" : ""
                                )}
                             >
                               <RadioGroupItem
                                 value={themeOption.value}
                                 id={`theme-${themeOption.value}`}
                                 className="sr-only" // Hide the actual radio button visually
                                 aria-label={themeOption.label}
                               />
                               <div className="flex items-center gap-2 mb-2">
                                   <themeOption.icon className="h-5 w-5" />
                                   <span className="font-semibold">{themeOption.label}</span>
                               </div>
                               {/* Use inline styles with CSS variables for preview */}
                               <div className="flex gap-1 mt-1">
                                   <span
                                     className="h-4 w-4 rounded-full border border-border"
                                     style={{ backgroundColor: `hsl(var(--${themeOption.value}-background, var(--background)))` }}
                                    ></span>
                                   <span
                                       className="h-4 w-4 rounded-full border border-border"
                                       style={{ backgroundColor: `hsl(var(--${themeOption.value}-primary, var(--primary)))` }}
                                   ></span>
                                   <span
                                       className="h-4 w-4 rounded-full border border-border"
                                       style={{ backgroundColor: `hsl(var(--${themeOption.value}-accent, var(--accent)))` }}
                                   ></span>
                               </div>

                             </Label>
                           ))}
                        </RadioGroup>
                     </CardContent>
                </Card>

                 {/* Add more settings cards here if needed */}

            </div>
        </div>
     </AppLayout>
  );
}

    