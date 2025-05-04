
import React from 'react';
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { cn } from '@/lib/utils'; // Import cn

interface PatientSummaryProps {
  patient: Patient | null;
  observations: Observation[];
  encounters: Encounter[];
  isLoading: boolean; // Add isLoading prop
}

export function PatientSummary({ patient, observations, encounters, isLoading }: PatientSummaryProps) {
  if (isLoading) {
    return (
      // Apply glassmorphism to loading state card
      <Card className={cn(
          "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm" // Glassmorphism classes
        )}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" /> {/* Skeleton for Name */}
          <Skeleton className="h-4 w-full" /> {/* Skeleton for Description */}
        </CardHeader>
        <Separator className="my-2 bg-border/50" /> {/* Make separator semi-transparent */}
        <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-6 w-1/2 mb-2" /> {/* Skeleton for Observations Title */}
            {/* Adjust background for better visibility with blur */}
            <div className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30 space-y-2">
               <Skeleton className="h-4 w-5/6 bg-muted/50" />
               <Skeleton className="h-4 w-4/6 bg-muted/50" />
               <Skeleton className="h-4 w-5/6 bg-muted/50" />
            </div>
          </div>
          <div>
             <Skeleton className="h-6 w-1/2 mb-2" /> {/* Skeleton for Encounters Title */}
             {/* Adjust background for better visibility with blur */}
             <div className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30 space-y-2">
                <Skeleton className="h-4 w-5/6 bg-muted/50" />
                <Skeleton className="h-4 w-4/6 bg-muted/50" />
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  if (!patient) {
    return (
       // Apply glassmorphism to placeholder card
       <Card className={cn(
          "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm" // Glassmorphism classes
        )}>
        <CardHeader>
          <CardTitle>Patient Summary</CardTitle>
          <CardDescription>Select a patient to view their summary.</CardDescription>
        </CardHeader>
         <CardContent className="pt-4"> {/* Added pt-4 for consistency */}
             <p className="text-muted-foreground text-sm">No patient selected.</p>
         </CardContent>
      </Card>
    );
  }

  return (
    // Apply glassmorphism to main card
    <Card className={cn(
        "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm" // Glassmorphism classes
      )}>
      <CardHeader>
        <CardTitle>{patient.name}</CardTitle>
        <CardDescription>
          ID: {patient.id} | DOB: {patient.dateOfBirth} | Gender: {patient.gender}
        </CardDescription>
      </CardHeader>
      <Separator className="my-2 bg-border/50" /> {/* Make separator semi-transparent */}
      <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">Recent Observations</h3>
          {/* Adjust background for better visibility with blur */}
          <ScrollArea className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30">
            {observations.length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground/90"> {/* Slightly adjust text opacity */}
                {observations.map((obs) => (
                  <li key={obs.id}>
                    <strong className="font-medium">{obs.code}:</strong> {obs.value} {obs.units} ({new Date(obs.date).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No recent observations found.</p>
            )}
          </ScrollArea>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">Recent Encounters</h3>
          {/* Adjust background for better visibility with blur */}
          <ScrollArea className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30">
             {encounters.length > 0 ? (
                <ul className="space-y-1 text-sm text-foreground/90"> {/* Slightly adjust text opacity */}
                  {encounters.map((enc) => (
                    <li key={enc.id}>
                      <strong className="font-medium">{new Date(enc.startDate).toLocaleDateString()}:</strong> {enc.class} - {enc.reason || 'N/A'}
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-muted-foreground text-sm">No recent encounters found.</p>
              )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

