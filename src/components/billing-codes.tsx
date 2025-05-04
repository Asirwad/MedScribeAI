
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
        <div className="space-y-2 flex-grow p-4"> {/* Add padding for skeletons */}
           <Skeleton className="h-8 w-full rounded-md bg-muted/50" />
           <Skeleton className="h-8 w-full rounded-md bg-muted/50" />
           <Skeleton className="h-8 w-full rounded-md bg-muted/50" />
        </div>
      );
    }

    // Check if codes is an array and has items
    if (!Array.isArray(codes) || codes.length === 0) {
      // Use flex-grow for no codes message
      return <p className="text-muted-foreground text-sm flex-grow flex items-center justify-center p-4">No billing codes suggested yet.</p>;
    }

    return (
      // Make table container grow and scroll if needed
      <div className="flex-grow overflow-auto">
        <Table className="text-foreground/90">
            {/* Sticky header with semi-transparent background */}
            <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
            <TableRow className="border-b border-border/50">
                <TableHead className="w-[100px] text-muted-foreground">Code</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-right w-[200px] text-muted-foreground">Est. Bill Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {codes.map((entry, index) => (
                <TableRow key={index} className="border-b border-border/30 hover:bg-secondary/30">
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
    // Apply glassmorphism to the Card
    <Card className={cn(
        "bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm flex flex-col h-full", // Glassmorphism classes
        className)}>
      <CardHeader className="pb-2 flex-shrink-0"> {/* Prevent header shrink */}
        <CardTitle>Suggested Billing Codes</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden pt-0 p-0"> {/* Remove padding from CardContent */}
         {renderContent()}
      </CardContent>
    </Card>
  );
}
