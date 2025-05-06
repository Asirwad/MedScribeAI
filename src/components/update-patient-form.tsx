
'use client';

import React, { useState, useEffect } from 'react';
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
} from "@/components/ui/select";

// Schema can be the same as Add Patient Form
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

interface UpdatePatientFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: Patient; // Receive existing patient data
  onPatientUpdated: (updatedData: Omit<Patient, 'id'>) => Promise<void>; // Callback for successful update
}

export function UpdatePatientForm({
    isOpen,
    onOpenChange,
    patientData,
    onPatientUpdated
}: UpdatePatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    // Initialize form with existing patient data
    defaultValues: {
      name: patientData.name,
      dateOfBirth: patientData.dateOfBirth,
      gender: patientData.gender,
    },
  });

   // Reset form if patientData changes (e.g., opening dialog for a different patient)
   useEffect(() => {
    if (patientData) {
      form.reset({
        name: patientData.name,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
      });
    }
  }, [patientData, form]);

  // onSubmit handler calls the parent's update function
  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      // Call the parent handler with the updated data
      // The parent (AppLayout -> Home) is responsible for calling updatePatient
      await onPatientUpdated(data);
      // Parent handles success toast and state updates (refetching list)

      onOpenChange(false); // Close the dialog on success
    } catch (error) {
      // Error is already handled (toast shown) by the parent component (AppLayout -> Home)
      console.error('Error submitting patient update form:', error);
      // Optionally show a generic form-level error if needed, but parent handles backend errors
      // toast({
      //   title: 'Submission Error',
      //   description: 'Could not submit patient details. Please try again.',
      //   variant: 'destructive',
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isSubmitting) { // Prevent closing while submitting
            onOpenChange(open);
        }
     }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Patient Details</DialogTitle>
          <DialogDescription>
            Modify the patient information below.
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
                    Updating...
                  </>
                ) : (
                  'Update Patient'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
