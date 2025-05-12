
import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import '../globals.css'; // Use relative path for globals.css
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { cn } from '@/lib/utils';
// Removed DashboardThemeProvider import

const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MedScribeAI - Dashboard',
  description: 'Agentic Clinical Documentation Assistant - Dashboard',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Root html and body tags are in the main src/app/layout.tsx
    // This layout applies specifically to dashboard routes
    // Removed DashboardThemeProvider wrapper
    <NextThemesProvider
        attribute="class"
        defaultTheme="system" // next-themes will manage light/dark based on system or user preference
        enableSystem
        disableTransitionOnChange
        // storageKey="next-theme" // Standard key for next-themes
    >
        {children}
        {/* Toaster can be here or in the root layout depending on preference */}
    </NextThemesProvider>
  );
}
