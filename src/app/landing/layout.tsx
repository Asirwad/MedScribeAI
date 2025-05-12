
import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import '../globals.css'; // Use relative path for globals.css
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider as NextThemesProvider } from 'next-themes'; // Standard NextThemesProvider
import { cn } from '@/lib/utils';
import { DashboardThemeProvider } from '@/context/dashboard-theme-provider';


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

export default function LandingLayout({ // Changed name from MarketingLayout
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(openSans.variable, poppins.variable)} suppressHydrationWarning>
      <body
        className="antialiased font-sans"
      >
        {/* Landing page uses the standard NextThemesProvider without Dashboard specific themes */}
        {/* Wrap with DashboardThemeProvider to ensure context is available if any component needs it, though landing page doesn't use its themes */}
        <DashboardThemeProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </NextThemesProvider>
        </DashboardThemeProvider>
      </body>
    </html>
  );
}
