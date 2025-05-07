
import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider'; // Use the standard ThemeProvider
import { cn } from '@/lib/utils';

// Font configurations remain the same
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
  title: 'MedScribeAI',
  description: 'Agentic Clinical Documentation Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(openSans.variable, poppins.variable)} suppressHydrationWarning>
      <body className="antialiased font-sans">
        {/* Use the standard ThemeProvider from next-themes for light/dark mode */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children} {/* Render the active page (landing or dashboard) */}
          <Toaster /> {/* Keep toaster accessible globally */}
        </ThemeProvider>
      </body>
    </html>
  );
}
