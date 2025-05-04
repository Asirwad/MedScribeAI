
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { type Patient } from '@/services/ehr_client'; // Only import type
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

const patientFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date of Birth must be in YYYY-MM-DD format.',
  }),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: "Gender is required.",
  }),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface AddPatientFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Changed signature: expects patient data, not the created Patient object
  onPatientAdded: (newPatientData: Omit<Patient, 'id'>) => void;
}

export function AddPatientForm({ isOpen, onOpenChange, onPatientAdded }: AddPatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); // Keep toast for potential form-level errors if needed
  const isMobile = useIsMobile(); // Check if mobile

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      gender: undefined, // Make sure Select has a placeholder
    },
  });

  // onSubmit no longer calls createPatient directly
  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      // Call the parent handler with the form data
      // The parent (Home component) is now responsible for calling createPatient
      await onPatientAdded(data);
      // Parent handles success toast and state updates (refetching list)

      form.reset(); // Reset form after successful submission
      onOpenChange(false); // Close the dialog
    } catch (error) {
      // This catch block might handle errors thrown by onPatientAdded if it awaits something risky,
      // or can be used for form-specific errors. Parent handles creation errors.
      console.error('Error submitting patient form or in parent handler:', error);
      // Show a generic error toast for form submission issues
      toast({
        title: 'Submission Error',
        description: 'Could not submit patient details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter the details for the new patient below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alex Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Patient'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
