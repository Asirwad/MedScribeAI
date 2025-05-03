
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

// Define the structure of a single billing code entry
export interface BillingCodeEntry {
  code: string;
  description: string;
  estimatedBillAmountRange: string;
}

interface BillingCodesProps {
  codes: BillingCodeEntry[]; // Expect an array of BillingCodeEntry objects
  isLoading: boolean;
}

export function BillingCodes({ codes, isLoading }: BillingCodesProps) {

  const renderContent = () => {
     if (isLoading) {
      return (
        <div className="space-y-2">
           <Skeleton className="h-8 w-full rounded-md" />
           <Skeleton className="h-8 w-full rounded-md" />
           <Skeleton className="h-8 w-full rounded-md" />
        </div>
      );
    }

    // Check if codes is an array and has items
    if (!Array.isArray(codes) || codes.length === 0) {
      return <p className="text-muted-foreground text-sm">No billing codes suggested yet.</p>;
    }

    return (
      <Table>
        <TableHeader>
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
