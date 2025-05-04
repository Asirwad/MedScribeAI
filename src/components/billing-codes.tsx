
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils'; // Import cn

// Define the structure of a single billing code entry
export interface BillingCodeEntry {
  code: string;
  description: string;
  estimatedBillAmountRange: string;
}

interface BillingCodesProps {
  codes: BillingCodeEntry[]; // Expect an array of BillingCodeEntry objects
  isLoading: boolean;
  className?: string; // Add className prop
}

export function BillingCodes({ codes, isLoading, className }: BillingCodesProps) {

  const renderContent = () => {
     if (isLoading) {
      return (
        // Use flex-grow for skeleton container
        <div className="space-y-2 flex-grow">
           <Skeleton className="h-8 w-full rounded-md" />
           <Skeleton className="h-8 w-full rounded-md" />
           <Skeleton className="h-8 w-full rounded-md" />
        </div>
      );
    }

    // Check if codes is an array and has items
    if (!Array.isArray(codes) || codes.length === 0) {
      // Use flex-grow for no codes message
      return <p className="text-muted-foreground text-sm flex-grow flex items-center justify-center">No billing codes suggested yet.</p>;
    }

    return (
      // Make table container grow and scroll if needed
      <div className="flex-grow overflow-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-card"> {/* Sticky header */}
            <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[200px]">Est. Bill Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {codes.map((entry, index) => (
                <TableRow key={index}>
                <TableCell className="font-medium">{entry.code}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell className="text-right">{entry.estimatedBillAmountRange}</TableCell>
                </TableRow>
            ))}
            </TableBody>
            {/* Optional: Add a caption if needed */}
            {/* <TableCaption>Suggested billing codes based on the SOAP note.</TableCaption> */}
        </Table>
      </div>
    );
  };


  return (
    // Apply className and flex structure
    <Card className={cn("shadow-md flex flex-col h-full", className)}>
      <CardHeader className="pb-2 flex-shrink-0"> {/* Prevent header shrink */}
        <CardTitle>Suggested Billing Codes</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden pt-0"> {/* Allow content to grow and hide overflow initially */}
         {renderContent()}
      </CardContent>
    </Card>
  );
}
