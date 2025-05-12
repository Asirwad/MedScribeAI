
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component will now simply redirect to the marketing page.
// The actual dashboard content will be in src/app/dashboard/page.tsx
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/landing'); // Redirect to the marketing landing page
  }, [router]);

  return null; // Render nothing, or a loading indicator if preferred
}

