
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PatientSummary } from '@/components/patient-summary';
import { LiveTranscription } from '@/components/live-transcription';
import { SOAPNote } from '@/components/soap-note';
import { BillingCodes } from '@/components/billing-codes';
import { getPatient, getObservations, getEncounters, postNote, createPatient } from '@/services/ehr_client';
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { generateSoapNote } from '@/ai/flows/generate-soap-note';
import { generateBillingCodes } from '@/ai/flows/generate-billing-codes';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain } from 'lucide-react';
import { AddPatientForm } from '@/components/add-patient-form'; // Import the new component

// Mock patient list for the sidebar - This will now be dynamic
// const mockPatients: Patient[] = [
//   { id: '123', name: 'John Doe', dateOfBirth: '1970-01-01', gender: 'Male' },
//   { id: '456', name: 'Jane Smith', dateOfBirth: '1985-05-15', gender: 'Female' },
//   { id: '789', name: 'Robert Johnson', dateOfBirth: '1992-11-30', gender: 'Male' },
// ];

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]); // Start with an empty array
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [soapNote, setSoapNote] = useState<string>('');
  const [billingCodes, setBillingCodes] = useState<string>('');
  const [isGeneratingSoap, setIsGeneratingSoap] = useState<boolean>(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [patientHistory, setPatientHistory] = useState<string>(''); // Store combined history
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false); // State for dialog

  const { toast } = useToast();

   // Load initial patients (could be from an API in a real app)
   useEffect(() => {
    // Simulate fetching initial patients
    const initialPatients: Patient[] = [
      { id: '123', name: 'John Doe', dateOfBirth: '1970-01-01', gender: 'Male' },
      { id: '456', name: 'Jane Smith', dateOfBirth: '1985-05-15', gender: 'Female' },
      { id: '789', name: 'Robert Johnson', dateOfBirth: '1992-11-30', gender: 'Male' },
    ];
    setPatients(initialPatients);
  }, []);


  const fetchPatientData = useCallback(async (patientId: string) => {
    try {
      // Reset state for new patient
      setTranscript('');
      setSoapNote('');
      setBillingCodes('');
      setIsGeneratingSoap(false);
      setIsGeneratingCodes(false);
      setIsSavingNote(false);
      setPatientHistory('');

      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId),
        getEncounters(patientId),
      ]);

      setSelectedPatient(patientData);
      setObservations(obsData);
      setEncounters(encData);

      // Create a simple patient history string
       const history = `
        Patient: ${patientData.name}, DOB: ${patientData.dateOfBirth}, Gender: ${patientData.gender}
        Observations: ${obsData.map(o => `${o.code}: ${o.value} ${o.units || ''} (${new Date(o.date).toLocaleDateString()})`).join(', ')}
        Encounters: ${encData.map(e => `${new Date(e.startDate).toLocaleDateString()}: ${e.class} - ${e.reason || 'N/A'}`).join(', ')}
      `.trim();
      setPatientHistory(history);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: 'Error Fetching Data',
        description: 'Could not load patient details.',
        variant: 'destructive',
      });
      setSelectedPatient(null); // Reset selection on error
      setObservations([]);
      setEncounters([]);
    }
  }, [toast]);


  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
       fetchPatientData(patientId);
    }
  };

  const handleTranscriptUpdate = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    // Reset downstream results when transcript changes
    setSoapNote('');
    setBillingCodes('');
  }, []);


 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory) {
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setSoapNote(''); // Clear previous note
    setBillingCodes(''); // Clear previous codes
    try {
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory,
        });
        setSoapNote(result.soapNote);
        toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below.' });
        // Automatically trigger billing code generation after SOAP note
        handleGenerateBillingCodes(result.soapNote);
    } catch (error) {
        console.error('Error generating SOAP note:', error);
        toast({ title: 'Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
    } finally {
        setIsGeneratingSoap(false);
    }
 }, [selectedPatient, transcript, patientHistory, toast]);


 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    if (!noteToCode) {
      // No need to show a toast here, just skip if no note
      return;
    }
    setIsGeneratingCodes(true);
    setBillingCodes(''); // Clear previous codes
    try {
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(result.billingCodes);
      toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
    } catch (error) {
      console.error('Error generating billing codes:', error);
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
    } finally {
      setIsGeneratingCodes(false);
    }
  }, [toast]);


  const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient) {
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
    try {
      await postNote(selectedPatient.id, finalNote);
      setSoapNote(finalNote); // Update state with the saved version
      toast({ title: 'Note Saved', description: 'SOAP note successfully submitted to EHR.' });
       // Optionally re-fetch data or update UI state after saving
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handlePatientAdded = (newPatient: Patient) => {
    setPatients(prevPatients => [...prevPatients, newPatient]);
    // Optionally select the newly added patient
    handleSelectPatient(newPatient.id);
  };


  // Select the first patient by default on initial load if patients exist
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      handleSelectPatient(patients[0].id);
    }
     // If the selected patient is removed (e.g., in a real app), select the first available one
     if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        if (patients.length > 0) {
          handleSelectPatient(patients[0].id);
        } else {
          setSelectedPatient(null); // No patients left
        }
     }
  }, [patients, selectedPatient, handleSelectPatient]);

   // Determine if actions should be disabled
   const isActionDisabled = !selectedPatient || isGeneratingSoap || isSavingNote;


  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)} // Add prop to open dialog
    >
      <ScrollArea className="h-full flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <PatientSummary
            patient={selectedPatient}
            observations={observations}
            encounters={encounters}
          />

          <LiveTranscription
             onTranscriptUpdate={handleTranscriptUpdate}
             disabled={!selectedPatient} // Disable if no patient selected
           />

          {transcript && selectedPatient && (
             <div className="flex justify-end">
               <Button
                 onClick={handleGenerateSoapNote}
                 disabled={isGeneratingSoap || !transcript}
               >
                 {isGeneratingSoap ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                 Generate SOAP & Codes
               </Button>
             </div>
           )}


          <SOAPNote
            initialNote={soapNote}
            isLoading={isGeneratingSoap}
            isSaving={isSavingNote}
            onSave={handleSaveNote}
            disabled={isActionDisabled}
          />

          <BillingCodes
             codes={billingCodes}
             isLoading={isGeneratingCodes}
           />
        </div>
      </ScrollArea>
    </AppLayout>
     <AddPatientForm
       isOpen={isAddPatientDialogOpen}
       onOpenChange={setIsAddPatientDialogOpen}
       onPatientAdded={handlePatientAdded}
     />
     </>
  );
}

