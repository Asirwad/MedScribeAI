
import React from 'react';
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface PatientSummaryProps {
  patient: Patient | null;
  observations: Observation[];
  encounters: Encounter[];
  isLoading: boolean; // Add isLoading prop
}

export function PatientSummary({ patient, observations, encounters, isLoading }: PatientSummaryProps) {
  if (isLoading) {
    return (
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" /> {/* Skeleton for Name */}
          <Skeleton className="h-4 w-full" /> {/* Skeleton for Description */}
        </CardHeader>
        <Separator className="my-2" />
        <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-6 w-1/2 mb-2" /> {/* Skeleton for Observations Title */}
            <div className="h-40 border rounded-md p-2 bg-secondary/50 space-y-2">
               <Skeleton className="h-4 w-5/6" />
               <Skeleton className="h-4 w-4/6" />
               <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div>
             <Skeleton className="h-6 w-1/2 mb-2" /> {/* Skeleton for Encounters Title */}
             <div className="h-40 border rounded-md p-2 bg-secondary/50 space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  if (!patient) {
    return (
       <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Patient Summary</CardTitle>
          <CardDescription>Select a patient to view their summary.</CardDescription>
        </CardHeader>
         <CardContent>
             <p className="text-muted-foreground text-sm">No patient selected.</p>
         </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle>{patient.name}</CardTitle>
        <CardDescription>
          ID: {patient.id} | DOB: {patient.dateOfBirth} | Gender: {patient.gender}
        </CardDescription>
      </CardHeader>
      <Separator className="my-2" />
      <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Observations</h3>
          <ScrollArea className="h-40 border rounded-md p-2 bg-secondary/50">
            {observations.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {observations.map((obs) => (
                  <li key={obs.id}>
                    <strong>{obs.code}:</strong> {obs.value} {obs.units} ({new Date(obs.date).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No recent observations found.</p>
            )}
          </ScrollArea>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Encounters</h3>
          <ScrollArea className="h-40 border rounded-md p-2 bg-secondary/50">
             {encounters.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {encounters.map((enc) => (
                    <li key={enc.id}>
                      <strong>{new Date(enc.startDate).toLocaleDateString()}:</strong> {enc.class} - {enc.reason || 'N/A'}
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
