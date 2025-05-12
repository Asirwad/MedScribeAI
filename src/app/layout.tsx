
import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google'; // Import Poppins
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
// Removed ThemeProvider from here as it's handled by sub-layouts
import { cn } from '@/lib/utils'; // Import cn

// Configure Open Sans for body text
const openSans = Open_Sans({
  variable: '--font-open-sans',
  subsets: ['latin'],
});

// Configure Poppins for headings/logo (adjust weights as needed)
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Include weights for regular, semibold, bold
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
    // Apply both font variables to the html tag
    <html lang="en" className={cn(openSans.variable, poppins.variable)} suppressHydrationWarning>
      <body
        className="antialiased font-sans" // Use the default sans font which now includes Open Sans
      >
        {/* ThemeProvider is now in specific layouts (landing/layout.tsx and dashboard/layout.tsx) */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
