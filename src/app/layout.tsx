import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google'; // Import Open Sans
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider'; // Import ThemeProvider

const openSans = Open_Sans({ // Configure Open Sans
  variable: '--font-open-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MedScribeAI', // Renamed from MediScribeAI
  description: 'Agentic Clinical Documentation Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning recommended for next-themes */}
      <body
        className={`${openSans.variable} antialiased`} // Use Open Sans variable
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
