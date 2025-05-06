
'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeletePatientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  onConfirm: () => Promise<void>; // Make confirm async
}

// Define the confirmation text constant
const CONFIRM_TEXT = "delete";

export function DeletePatientDialog({
  isOpen,
  onOpenChange,
  patientName,
  onConfirm,
}: DeletePatientDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmationMatch = inputValue === CONFIRM_TEXT;

  // Reset input when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
     if (!isConfirmationMatch) return;
     setIsDeleting(true);
     try {
         await onConfirm();
         // Success handling (toast, close) is done in the parent component (AppLayout)
     } catch (error) {
        // Error handling (toast) is done in the parent component
     } finally {
         setIsDeleting(false);
         // Parent component will close the dialog on success/failure
     }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
             <div className="p-3 rounded-full bg-destructive/10">
               <AlertTriangle className="h-8 w-8 text-destructive" />
             </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">Delete Patient Permanently?</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            This action is irreversible. All data associated with{' '}
            <strong className="text-foreground">{patientName}</strong>, including encounters, observations, and notes, will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="delete-confirm" className="text-sm font-medium">
            To confirm, please type "<strong className="text-destructive">{CONFIRM_TEXT}</strong>" below:
          </Label>
          <Input
            id="delete-confirm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className="border-destructive/50 focus:border-destructive focus:ring-destructive/50"
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={!isConfirmationMatch || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

