
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Observation, Encounter } from '@/services/ehr_client';

interface MaximizedViewOverlayProps {
  type: 'observations' | 'encounters';
  data: Observation[] | Encounter[];
  onClose: () => void;
  // Pass necessary helpers/maps from PatientSummary
  observationCodeMap: { [key: string]: string };
  encounterClassMap: { [key: string]: string };
  formatDate: (dateString: string | undefined) => string;
  getReadableName: (code: string, map: { [key: string]: string }) => string;
  groupObservationsByDate: (observations: Observation[]) => Record<string, Observation[]>;
}

export function MaximizedViewOverlay({
  type,
  data,
  onClose,
  observationCodeMap,
  encounterClassMap,
  formatDate,
  getReadableName,
  groupObservationsByDate,
}: MaximizedViewOverlayProps) {

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15, delay: 0.1 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  const renderObservations = () => {
    const observations = data as Observation[];
    if (!observations || observations.length === 0) return <p className="text-muted-foreground text-center p-4">No observations found.</p>;

    const grouped = groupObservationsByDate(observations);
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
      <div className="space-y-4">
        {sortedDates.map((dateKey, dateIndex) => (
          <div key={dateKey}>
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1 px-1 -mx-1 z-10 border-b border-border/30"> {/* Sticky Date Header */}
              <Badge variant="secondary" className="whitespace-nowrap text-sm">{formatDate(dateKey)}</Badge>
              {dateIndex === 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium hover:bg-green-200 px-2.5 py-0.5 rounded-sm dark:bg-green-900 dark:text-green-300">New</Badge>
              )}
            </div>
            <ul className="space-y-2 ml-2"> {/* Indent items slightly */}
              {grouped[dateKey].map((obs) => (
                <li key={obs.id} className="flex items-start gap-2 text-sm">
                  <strong className="font-medium w-32 shrink-0">{getReadableName(obs.code, observationCodeMap)}:</strong>
                  <span className="flex-grow break-words">{obs.value}{obs.units ? ` ${obs.units}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderEncounters = () => {
    const encounters = data as Encounter[];
    if (!encounters || encounters.length === 0) return <p className="text-muted-foreground text-center p-4">No encounters found.</p>;

    return (
      <ul className="space-y-3">
        {encounters.map((enc, index) => (
          <li key={enc.id} className="border-b border-border/30 pb-3 last:border-b-0">
            <div className="flex justify-between items-start mb-1">
              <strong className="font-medium text-base">{getReadableName(enc.class, encounterClassMap)}</strong>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                 <Badge variant="secondary" className="whitespace-nowrap">{formatDate(enc.startDate)}</Badge>
                 {index === 0 && (
                     <Badge variant="default" className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-sm hover:bg-green-200 dark:bg-green-900 dark:text-green-300">New</Badge>
                 )}
             </div>
            </div>
            {enc.reason && <p className="text-sm text-muted-foreground">Reason: {enc.reason}</p>}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <motion.div
      key="maximized-overlay"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose} // Close on clicking the backdrop
    >
      <motion.div
        variants={cardVariants}
        className={cn(
           "bg-card/95 backdrop-blur-lg border border-border/50 shadow-xl rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden", // Glassmorphism effect
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 border-b border-border/30 flex-shrink-0">
          <CardTitle className="text-xl">
            Maximized View: {type === 'observations' ? 'Observations' : 'Encounters'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            {type === 'observations' ? renderObservations() : renderEncounters()}
          </ScrollArea>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}
