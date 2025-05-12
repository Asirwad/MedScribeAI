
import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import '../globals.css'; // Use relative path for globals.css
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes'; // Standard NextThemesProvider
import { cn } from '@/lib/utils';

// Font configurations are still useful for metadata or if any specific styling needs them directly,
// but for global font application, RootLayout handles it.
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
  title: 'MedScribeAI - Welcome',
  description: 'Agentic Clinical Documentation Assistant - Landing Page',
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removed <html> and <body> tags.
  // The cn(openSans.variable, poppins.variable) and "antialiased font-sans"
  // are applied by the RootLayout.
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        {/* Toaster is also in RootLayout. This might be redundant but doesn't cause the hydration error.
            For cleaner structure, one might remove this if RootLayout's Toaster is sufficient. */}
        <Toaster />
    </NextThemesProvider>
  );
}
