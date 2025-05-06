
'use client'; // Ensure this is at the top

import React, { useState } from 'react'; // Import useState
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button'; // Import Button
import { Maximize } from 'lucide-react'; // Import Maximize icon
import { MaximizedViewOverlay } from '@/components/maximized-view-overlay'; // Import the new overlay component
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence for overlay animation

interface PatientSummaryProps {
  patient: Patient | null;
  observations: Observation[];
  encounters: Encounter[];
  isLoading: boolean;
}

// Helper function to format date strings (YYYY-MM-DD or ISO) into a readable format
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string encountered: ${dateString}`);
            return dateString;
        }
        return format(date, 'MM/dd/yyyy');
    } catch (error) {
        console.error(`Error formatting date: ${dateString}`, error);
        return dateString;
    }
};

// Mapping for common observation codes to readable names
const observationCodeMap: { [key: string]: string } = {
    'blood_pressure': 'Blood Pressure',
    'heart_rate': 'Heart Rate',
    'body_temperature': 'Temperature',
    'respiratory_rate': 'Respiratory Rate',
    'oxygen_saturation': 'Oxygen Saturation',
    'ChiefComplaint': 'Chief Complaint',
    'ObjectiveSummary': 'Objective Findings',
    'PlanSummary': 'Plan Summary',
    'Diagnosis': 'Diagnosis',
};

// Mapping for encounter classes
const encounterClassMap: { [key: string]: string } = {
    'inpatient': 'Inpatient Stay',
    'outpatient': 'Outpatient Visit',
    'ambulatory': 'Ambulatory Visit',
    'emergency': 'Emergency Visit',
    'home': 'Home Health Visit',
    'virtual': 'Virtual Visit',
};

// Helper to get readable name or fallback to original code/class
const getReadableName = (code: string, map: { [key: string]: string }): string => {
    return map[code] || code;
};

// Function to group observations by date
const groupObservationsByDate = (observations: Observation[]): Record<string, Observation[]> => {
    const grouped: Record<string, Observation[]> = {};
    observations.forEach(obs => {
        const dateKey = obs.date;
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(obs);
    });
    return grouped;
};

export function PatientSummary({ patient, observations, encounters, isLoading }: PatientSummaryProps) {
  const [maximizedSection, setMaximizedSection] = useState<'observations' | 'encounters' | 'none'>('none');

  if (isLoading) {
    return (
      <Card className={cn(
          "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm"
        )}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <Separator className="my-2 bg-border/50" />
        <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <div className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30 space-y-2">
               <Skeleton className="h-4 w-5/6 bg-muted/50" />
               <Skeleton className="h-4 w-4/6 bg-muted/50" />
               <Skeleton className="h-4 w-5/6 bg-muted/50" />
            </div>
          </div>
          <div>
             <Skeleton className="h-6 w-1/2 mb-2" />
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
       <Card className={cn(
          "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm"
        )}>
        <CardHeader>
          <CardTitle>Patient Summary</CardTitle>
          <CardDescription>Select a patient to view their summary.</CardDescription>
        </CardHeader>
         <CardContent className="pt-4">
             <p className="text-muted-foreground text-sm">No patient selected.</p>
         </CardContent>
      </Card>
    );
  }

  const formattedDOB = formatDate(patient.dateOfBirth);
  const groupedObservations = groupObservationsByDate(observations);
  const sortedDates = Object.keys(groupedObservations).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <Card className={cn(
          "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm"
        )}>
        <CardHeader>
          <CardTitle>{patient.name}</CardTitle>
          <CardDescription>
            ID: {patient.id} | DOB: {formattedDOB} | Gender: {patient.gender}
          </CardDescription>
        </CardHeader>
        <Separator className="my-2 bg-border/50" />
        <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
          {/* Observations Section */}
          <div>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-lg font-semibold text-card-foreground">Recent Observations</h3>
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-6 w-6 text-muted-foreground hover:text-foreground"
                 onClick={() => setMaximizedSection('observations')}
                 aria-label="Maximize Observations"
                 disabled={observations.length === 0}
                >
                  <Maximize className="h-4 w-4" />
               </Button>
             </div>
            <ScrollArea className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30">
              {observations.length > 0 ? (
                <div className="space-y-3 text-sm text-foreground/90">
                   {sortedDates.map((dateKey, dateIndex) => (
                      <div key={dateKey} className="pl-1">
                          <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="whitespace-nowrap">{formatDate(dateKey)}</Badge>
                              {dateIndex === 0 && (
                                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium hover:bg-green-200 me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-300">New</Badge>
                              )}
                          </div>
                          <ul className="space-y-1 pl-3 border-l border-border/50 ml-2">
                          {groupedObservations[dateKey].map((obs) => (
                              <li key={obs.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <strong className="font-medium">{getReadableName(obs.code, observationCodeMap)}:</strong>
                                  <span>{obs.value}{obs.units ? ` ${obs.units}` : ''}</span>
                              </li>
                          ))}
                          </ul>
                      </div>
                   ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm p-4 text-center">No recent observations found.</p>
              )}
            </ScrollArea>
          </div>

           {/* Encounters Section */}
          <div>
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-card-foreground">Recent Encounters</h3>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6 text-muted-foreground hover:text-foreground"
                   onClick={() => setMaximizedSection('encounters')}
                   aria-label="Maximize Encounters"
                   disabled={encounters.length === 0}
                 >
                    <Maximize className="h-4 w-4" />
                 </Button>
             </div>
            <ScrollArea className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30">
               {encounters.length > 0 ? (
                  <ul className="space-y-2 text-sm text-foreground/90">
                    {encounters.map((enc, index) => (
                      <li key={enc.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <strong className="font-medium">{getReadableName(enc.class, encounterClassMap)}</strong>
                        <span>{enc.reason ? `- ${enc.reason}` : ''}</span>
                        <div className="flex items-center gap-1">
                           <Badge variant="secondary" className="whitespace-nowrap">{formatDate(enc.startDate)}</Badge>
                           {index === 0 && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm hover:bg-green-200 dark:bg-green-900 dark:text-green-300">New</Badge>
                           )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-muted-foreground text-sm p-4 text-center">No recent encounters found.</p>
                )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Maximized View Overlay */}
      <AnimatePresence>
        {maximizedSection !== 'none' && (
          <MaximizedViewOverlay
            type={maximizedSection}
            data={maximizedSection === 'observations' ? observations : encounters}
            onClose={() => setMaximizedSection('none')}
            observationCodeMap={observationCodeMap} // Pass maps
            encounterClassMap={encounterClassMap}
            formatDate={formatDate} // Pass helper functions
            getReadableName={getReadableName}
            groupObservationsByDate={groupObservationsByDate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
