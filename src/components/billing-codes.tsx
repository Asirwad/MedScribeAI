
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface BillingCodesProps {
  codes: string;
  isLoading: boolean;
}

export function BillingCodes({ codes, isLoading }: BillingCodesProps) {

  // Simple parsing assuming comma-separated codes
  const parseCodes = (codeString: string): string[] => {
    if (!codeString) return [];
    return codeString.split(',').map(code => code.trim()).filter(code => code.length > 0);
  };

  const parsedCodes = parseCodes(codes);

  const renderContent = () => {
     if (isLoading) {
      return (
        <div className="flex flex-wrap gap-2">
           <Skeleton className="h-6 w-20 rounded-full" />
           <Skeleton className="h-6 w-24 rounded-full" />
           <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      );
    }

    if (!codes || parsedCodes.length === 0) {
      return <p className="text-muted-foreground text-sm">No billing codes suggested yet.</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {parsedCodes.map((code, index) => (
                 <Badge key={index} variant="secondary">{code}</Badge>
            ))}
        </div>
    );
  };


  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Suggested Billing Codes</CardTitle>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>
    </Card>
  );
}
