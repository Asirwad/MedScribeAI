
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn

interface SOAPNoteProps {
  initialNote: string;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (note: string) => void;
  disabled?: boolean;
  className?: string; // Add className prop
}

interface ParsedNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

// Basic parser, assumes clear section headers
const parseSoapNote = (note: string): ParsedNote => {
  const subjectiveMatch = note.match(/Subjective:\s*([\s\S]*?)(Objective:|Assessment:|Plan:|$)/i);
  const objectiveMatch = note.match(/Objective:\s*([\s\S]*?)(Subjective:|Assessment:|Plan:|$)/i);
  const assessmentMatch = note.match(/Assessment:\s*([\s\S]*?)(Subjective:|Objective:|Plan:|$)/i);
  const planMatch = note.match(/Plan:\s*([\s\S]*?)(Subjective:|Objective:|Assessment:|$)/i);

  return {
    subjective: subjectiveMatch ? subjectiveMatch[1].trim() : '',
    objective: objectiveMatch ? objectiveMatch[1].trim() : '',
    assessment: assessmentMatch ? assessmentMatch[1].trim() : '',
    plan: planMatch ? planMatch[1].trim() : '',
  };
};

const formatSoapNote = (parsedNote: ParsedNote): string => {
  // Ensure sections are not null/undefined before joining
  const subj = parsedNote.subjective || '';
  const obj = parsedNote.objective || '';
  const assess = parsedNote.assessment || '';
  const plan = parsedNote.plan || '';
  return `Subjective:\n${subj}\n\nObjective:\n${obj}\n\nAssessment:\n${assess}\n\nPlan:\n${plan}`;
};


export function SOAPNote({ initialNote, isLoading, isSaving, onSave, disabled = false, className }: SOAPNoteProps) {
  const [noteSections, setNoteSections] = useState<ParsedNote>(parseSoapNote(initialNote || ''));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const parsed = parseSoapNote(initialNote || '');
    if (!isLoading && initialNote) {
      setNoteSections(parsed);
      setIsEditing(false); // Reset editing state when new note loads
    }
     if (isLoading) {
      // Reset fields when loading starts
       setNoteSections({ subjective: '', objective: '', assessment: '', plan: '' });
       setIsEditing(false);
    }
    // Only re-run if initialNote or isLoading changes
  }, [initialNote, isLoading]);


  const handleSectionChange = (section: keyof ParsedNote, value: string) => {
    setNoteSections(prev => ({ ...prev, [section]: value }));
    if (!isEditing) setIsEditing(true); // Automatically enable editing on change
  };

  const handleSave = () => {
    const fullNote = formatSoapNote(noteSections);
    onSave(fullNote);
    setIsEditing(false); // Exit editing mode after save attempt
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4 flex-grow"> {/* Added flex-grow for skeleton */}
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16 w-full" />
           <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16 w-full" />
           <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    const hasContent = noteSections.subjective || noteSections.objective || noteSections.assessment || noteSections.plan;

     if (!hasContent && !isEditing) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 flex-grow">
                <Pencil className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No SOAP note generated yet, or transcript is empty.</p>
                <p className="text-muted-foreground text-sm mt-1">Generate one from the transcript or start typing below.</p>
                 {/* Add a button to explicitly start editing if needed, or rely on typing */}
                 {/* <Button variant="outline" size="sm" onClick={toggleEdit} className="mt-4">Start Manual Note</Button> */}
             </div>
        )
     }

    return (
      // Removed fixed height, use flex-grow on parent CardContent
      <div className="space-y-4 flex-grow">
        <div>
          <Label htmlFor="subjective">Subjective</Label>
          <Textarea
            id="subjective"
            value={noteSections.subjective}
            onChange={(e) => handleSectionChange('subjective', e.target.value)}
            rows={4}
            readOnly={!isEditing}
            className={cn('w-full min-h-[80px]', !isEditing ? 'bg-muted/50 border-none' : '')} // Added min-h
            disabled={disabled || isSaving} // Disable textarea when saving too
            placeholder={isEditing ? "Patient's reported symptoms, history..." : ""}
          />
        </div>
        <div>
          <Label htmlFor="objective">Objective</Label>
          <Textarea
            id="objective"
            value={noteSections.objective}
            onChange={(e) => handleSectionChange('objective', e.target.value)}
            rows={4}
             readOnly={!isEditing}
            className={cn('w-full min-h-[80px]', !isEditing ? 'bg-muted/50 border-none' : '')} // Added min-h
            disabled={disabled || isSaving}
            placeholder={isEditing ? "Vitals, exam findings, lab results..." : ""}
          />
        </div>
        <div>
          <Label htmlFor="assessment">Assessment</Label>
          <Textarea
            id="assessment"
            value={noteSections.assessment}
            onChange={(e) => handleSectionChange('assessment', e.target.value)}
            rows={4}
            readOnly={!isEditing}
            className={cn('w-full min-h-[80px]', !isEditing ? 'bg-muted/50 border-none' : '')} // Added min-h
            disabled={disabled || isSaving}
             placeholder={isEditing ? "Diagnosis, differential diagnosis..." : ""}
          />
        </div>
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Textarea
            id="plan"
            value={noteSections.plan}
            onChange={(e) => handleSectionChange('plan', e.target.value)}
            rows={4}
            readOnly={!isEditing}
            className={cn('w-full min-h-[80px]', !isEditing ? 'bg-muted/50 border-none' : '')} // Added min-h
            disabled={disabled || isSaving}
            placeholder={isEditing ? "Treatment, tests, referrals, follow-up..." : ""}
          />
        </div>
      </div>
    );
  };


  return (
    // Apply className and flex structure
    <Card className={cn("shadow-md flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
        <CardTitle>SOAP Note</CardTitle>
         {/* Show Edit/Cancel button only if not loading and there's content OR if explicitly editing */}
         {(!isLoading && (initialNote || isEditing)) && (
             <Button variant="ghost" size="icon" onClick={toggleEdit} disabled={disabled || isSaving} aria-label={isEditing ? 'Cancel Edit' : 'Edit Note'}>
               <Pencil className="h-4 w-4" />
             </Button>
           )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col"> {/* Make content grow */}
        {renderContent()}
      </CardContent>
       {/* Show Save button only if editing and not loading/saving */}
       {(isEditing && !isLoading) && (
         <CardFooter className="flex justify-end flex-shrink-0 pt-4">
             <Button onClick={handleSave} disabled={isSaving || disabled || !isEditing}>
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
               Save Note
             </Button>
         </CardFooter>
        )}
         {/* Show disabled Save button if there is content but not editing (implies note loaded) */}
        {(!isEditing && initialNote && !isLoading && !isSaving) && (
         <CardFooter className="flex justify-end flex-shrink-0 pt-4">
             <Button disabled>
               <Save className="mr-2 h-4 w-4" />
               Save Note (Click Edit)
             </Button>
         </CardFooter>
        )}
    </Card>
  );
}
