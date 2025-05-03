
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SOAPNoteProps {
  initialNote: string;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (note: string) => void;
  disabled?: boolean;
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
  return `Subjective:\n${parsedNote.subjective}\n\nObjective:\n${parsedNote.objective}\n\nAssessment:\n${parsedNote.assessment}\n\nPlan:\n${parsedNote.plan}`;
};

export function SOAPNote({ initialNote, isLoading, isSaving, onSave, disabled = false }: SOAPNoteProps) {
  const [noteSections, setNoteSections] = useState<ParsedNote>(parseSoapNote(initialNote));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && initialNote) {
      setNoteSections(parseSoapNote(initialNote));
      setIsEditing(false); // Reset editing state when new note loads
    }
     if (isLoading) {
      // Reset fields when loading starts
       setNoteSections({ subjective: '', objective: '', assessment: '', plan: '' });
       setIsEditing(false);
    }
  }, [initialNote, isLoading]);

  const handleSectionChange = (section: keyof ParsedNote, value: string) => {
    setNoteSections(prev => ({ ...prev, [section]: value }));
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
        <div className="space-y-4 p-4">
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

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="subjective">Subjective</Label>
          <Textarea
            id="subjective"
            value={noteSections.subjective}
            onChange={(e) => handleSectionChange('subjective', e.target.value)}
            rows={4}
            readOnly={!isEditing}
            className={`w-full ${!isEditing ? 'bg-muted/50 border-none' : ''}`}
            disabled={disabled}
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
            className={`w-full ${!isEditing ? 'bg-muted/50 border-none' : ''}`}
            disabled={disabled}
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
            className={`w-full ${!isEditing ? 'bg-muted/50 border-none' : ''}`}
            disabled={disabled}
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
            className={`w-full ${!isEditing ? 'bg-muted/50 border-none' : ''}`}
            disabled={disabled}
          />
        </div>
      </div>
    );
  };


  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>SOAP Note</CardTitle>
         {!isLoading && (
             <Button variant="ghost" size="icon" onClick={toggleEdit} disabled={disabled || isSaving}>
               <Pencil className="h-4 w-4" />
               <span className="sr-only">{isEditing ? 'Cancel Edit' : 'Edit Note'}</span>
             </Button>
           )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      <CardFooter className="flex justify-end">
         {(isEditing || (initialNote && !isLoading)) && ( // Show save button if editing or if there's a loaded note
             <Button onClick={handleSave} disabled={!isEditing || isSaving || disabled}>
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
               Save Note
             </Button>
           )}
      </CardFooter>
    </Card>
  );
}
