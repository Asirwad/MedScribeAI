
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useDashboardTheme } from '@/context/dashboard-theme-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Moon, Sun, Laptop, Paintbrush, Palette, Contrast } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define available dashboard themes (same as before)
const dashboardThemes = [
    { value: 'blue', label: 'Default Blue', icon: Palette },
    { value: 'pink', label: 'Sakura Pink', icon: Paintbrush },
    { value: 'green', label: 'Emerald Green', icon: Paintbrush },
    { value: 'dracula', label: 'Dracula Purple', icon: Paintbrush },
    { value: 'high-contrast', label: 'High Contrast', icon: Contrast },
] as const;

type DashboardThemeValue = typeof dashboardThemes[number]['value'];

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme(); // For light/dark/system
  const { theme: dashboardTheme, setTheme: setDashboardTheme } = useDashboardTheme(); // For dashboard accent themes

  const handleDashboardThemeChange = (value: string) => {
    if (dashboardThemes.some(t => t.value === value)) {
      setDashboardTheme(value as DashboardThemeValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Adjust application appearance and other settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
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
                      className="sr-only"
                      aria-label={themeOption.label}
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <themeOption.icon className="h-5 w-5" />
                      <span className="font-semibold">{themeOption.label}</span>
                    </div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
