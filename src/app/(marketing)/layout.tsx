
import React from 'react';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is minimal and doesn't include dashboard-specific providers or styles
  return <>{children}</>;
}
