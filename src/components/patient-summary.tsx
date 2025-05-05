
import React from 'react';
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils'; // Import cn
import { format, parseISO } from 'date-fns'; // Import date-fns for formatting

interface PatientSummaryProps {
  patient: Patient | null;
  observations: Observation[];
  encounters: Encounter[];
  isLoading: boolean; // Add isLoading prop
}

// Helper function to format date strings (YYYY-MM-DD or ISO) into a readable format
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    // Attempt to parse as ISO string first (which includes YYYY-MM-DD)
    const date = parseISO(dateString);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
       // Fallback for potentially malformed dates, return original string
       console.warn(`Invalid date string encountered: ${dateString}`);
       return dateString;
    }
    return format(date, 'MM/dd/yyyy'); // Format as MM/DD/YYYY
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return dateString; // Return original string on error
  }
};


// Mapping for common observation codes to readable names
const observationCodeMap: { [key: string]: string } = {
  'blood_pressure': 'Blood Pressure',
  'heart_rate': 'Heart Rate',
  'body_temperature': 'Temperature',
  'respiratory_rate': 'Respiratory Rate',
  'oxygen_saturation': 'Oxygen Saturation',
  'ChiefComplaint': 'Chief Complaint', // Added from saveNote
  'ObjectiveSummary': 'Objective Findings', // Added from saveNote
  // Add more mappings as needed
};

// Mapping for encounter classes
const encounterClassMap: { [key: string]: string } = {
    'inpatient': 'Inpatient Stay',
    'outpatient': 'Outpatient Visit',
    'ambulatory': 'Ambulatory Visit',
    'emergency': 'Emergency Visit',
    'home': 'Home Health Visit',
    'virtual': 'Virtual Visit',
    // Add more mappings as needed
};

// Helper to get readable name or fallback to original code/class
const getReadableName = (code: string, map: { [key: string]: string }): string => {
    return map[code] || code; // Return mapped name or original code if not found
};


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

  // Format patient DOB
  const formattedDOB = formatDate(patient.dateOfBirth);


  return (
    // Apply glassmorphism to main card
    <Card className={cn(
        "mb-6 bg-card/70 backdrop-blur-lg border border-border/50 shadow-sm" // Glassmorphism classes
      )}>
      <CardHeader>
        <CardTitle>{patient.name}</CardTitle>
        <CardDescription>
          {/* Use formatted DOB */}
          ID: {patient.id} | DOB: {formattedDOB} | Gender: {patient.gender}
        </CardDescription>
      </CardHeader>
      <Separator className="my-2 bg-border/50" /> {/* Make separator semi-transparent */}
      <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-card-foreground">Recent Observations</h3>
          {/* Adjust background for better visibility with blur */}
          <ScrollArea className="h-40 border border-border/30 rounded-md p-2 bg-secondary/30">
            {observations.length > 0 ? (
              <ul className="space-y-2 text-sm text-foreground/90"> {/* Slightly adjust text opacity and spacing */}
                {observations.map((obs, index) => (
                  <li key={obs.id} className="flex flex-wrap items-center gap-x-2 gap-y-1"> {/* Use flex for alignment */}
                     {/* Use readable name for code */}
                    <strong className="font-medium">{getReadableName(obs.code, observationCodeMap)}:</strong>
                    <span>{obs.value}{obs.units ? ` ${obs.units}` : ''}</span>
                    {/* Date Badges */}
                    <div className="flex items-center gap-1">
                         <Badge variant="secondary" className="whitespace-nowrap">{formatDate(obs.date)}</Badge>
                         {index === 0 && ( // Add 'New' badge only for the first item
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium hover:bg-green-200 me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-300">New</Badge>
                         )}
                    </div>
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
                <ul className="space-y-2 text-sm text-foreground/90"> {/* Slightly adjust text opacity and spacing */}
                  {encounters.map((enc, index) => (
                    <li key={enc.id} className="flex flex-wrap items-center gap-x-2 gap-y-1"> {/* Use flex for alignment */}
                      {/* Use readable name for class */}
                      <strong className="font-medium">{getReadableName(enc.class, encounterClassMap)}</strong>
                      <span>{enc.reason ? `- ${enc.reason}` : ''}</span>
                       {/* Date Badges */}
                      <div className="flex items-center gap-1">
                         <Badge variant="secondary" className="whitespace-nowrap">{formatDate(enc.startDate)}</Badge>
                         {index === 0 && ( // Add 'New' badge only for the first item
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm hover:bg-green-200 dark:bg-green-900 dark:text-green-300">New</Badge>
                         )}
                      </div>
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
