
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
import { transcribePatientEncounter } from '@/ai/flows/transcribe-patient-encounter'; // Import transcription flow
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain } from 'lucide-react';
import { AddPatientForm } from '@/components/add-patient-form';
import { AgentVisualizationOverlay, AgentState } from '@/components/agent-visualization-overlay'; // Import visualization overlay

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [soapNote, setSoapNote] = useState<string>('');
  const [billingCodes, setBillingCodes] = useState<string>('');
  const [isGeneratingSoap, setIsGeneratingSoap] = useState<boolean>(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false); // New state for pre-visit data fetching
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle'); // State for visualization overlay

  const { toast } = useToast();

   // Load initial patients - Simulates pre-existing patient list
   useEffect(() => {
    const initialPatients: Patient[] = [
      { id: '123', name: 'John Doe', dateOfBirth: '1970-01-01', gender: 'Male' },
      { id: '456', name: 'Jane Smith', dateOfBirth: '1985-05-15', gender: 'Female' },
      { id: '789', name: 'Robert Johnson', dateOfBirth: '1992-11-30', gender: 'Male' },
    ];
    setPatients(initialPatients);
  }, []);


  // Simulate Pre-Visit Agent: Fetches data for the selected patient
  const fetchPatientData = useCallback(async (patientId: string) => {
    setIsFetchingData(true);
    setAgentState('fetching_data'); // Update agent state
    try {
      // Reset state for the new patient
      setTranscript('');
      setSoapNote('');
      setBillingCodes('');
      setIsGeneratingSoap(false);
      setIsGeneratingCodes(false);
      setIsSavingNote(false);
      setIsTranscribing(false);
      setPatientHistory('');

      // Fetch data via EHR Agent (ehr_client)
      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId),
        getEncounters(patientId),
      ]);

      setSelectedPatient(patientData);
      setObservations(obsData);
      setEncounters(encData);

      // Generate patient history summary (Pre-Visit Agent output)
      const history = `
        Patient: ${patientData.name}, DOB: ${patientData.dateOfBirth}, Gender: ${patientData.gender}
        Recent Observations: ${obsData.slice(0, 3).map(o => `${o.code}: ${o.value} ${o.units || ''} (${new Date(o.date).toLocaleDateString()})`).join('; ') || 'None'}
        Recent Encounters: ${encData.slice(0, 3).map(e => `${new Date(e.startDate).toLocaleDateString()}: ${e.class} - ${e.reason || 'N/A'}`).join('; ') || 'None'}
      `.trim();
      setPatientHistory(history);
      toast({ title: "Patient Data Loaded", description: `Summary for ${patientData.name} is ready.` });

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: 'Error Fetching Data',
        description: 'Could not load patient details.',
        variant: 'destructive',
      });
      setSelectedPatient(null);
      setObservations([]);
      setEncounters([]);
      setPatientHistory(''); // Clear history on error
    } finally {
      setIsFetchingData(false);
      setAgentState('idle'); // Reset agent state after fetching or error
    }
  }, [toast]);


  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
       fetchPatientData(patientId);
    }
  };

  // Handler for manual transcript changes (user input)
  const handleManualTranscriptChange = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    setSoapNote(''); // Reset downstream outputs if transcript changes manually
    setBillingCodes('');
    setAgentState('idle'); // Manual change means agent is idle
  }, []);

  // Handler for transcription results from the agent
  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    // Append new chunk to existing transcript
    const updatedTranscript = transcript ? `${transcript}\n${newTranscriptChunk}` : newTranscriptChunk;
    setTranscript(updatedTranscript);
    // Do not reset downstream here, as transcription might be ongoing
    // The final SOAP/Codes generation will use the full transcript later
  }, [transcript]);


 // Handler for processing audio blob (Real-Time Listening Agent)
 const handleAudioBlob = useCallback(async (audioBlob: Blob) => {
    if (!selectedPatient) return; // Ensure patient context exists

    setIsTranscribing(true);
    setAgentState('transcribing'); // Update agent state
    let base64Audio: string | null = null;

    try {
      // Convert Blob to base64 Data URI
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      base64Audio = await readPromise;

      // Call AI flow for transcription (part of Real-Time Listening Agent)
      const result = await transcribePatientEncounter({ audioDataUri: base64Audio });
      handleTranscriptionResult(result.transcript); // Append result
      toast({ title: "Transcription Segment Processed", description: "Transcript updated." });

    } catch (error) {
      console.error("Transcription failed:", error);
      toast({ title: "Transcription Error", description: "Failed to process audio segment.", variant: "destructive" });
       setAgentState('error'); // Indicate error state
       // Consider adding a brief delay before resetting to idle on error
       setTimeout(() => setAgentState('idle'), 2000);
    } finally {
      setIsTranscribing(false);
      // Only reset to idle if no other agent process is immediately following
      if(agentState === 'transcribing') { // Check if state wasn't changed by an error
         setAgentState('idle'); // Ready for next segment or action
      }
    }
 }, [selectedPatient, handleTranscriptionResult, toast, agentState]);


 // Handler for generating SOAP note (Documentation Agent - Step 1)
 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory) {
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript and history.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setAgentState('generating_soap'); // Update agent state
    setSoapNote(''); // Clear previous note
    setBillingCodes(''); // Clear previous codes

    try {
        // Call AI flow to generate SOAP note
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory, // Use the summary from Pre-Visit Agent
        });
        setSoapNote(result.soapNote);
        toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below. Generating codes...' });

        // Chain to billing code generation immediately after SOAP note is ready
        await handleGenerateBillingCodes(result.soapNote); // Pass the generated note directly

    } catch (error) {
        console.error('Error generating SOAP note:', error);
        toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setAgentState('error'); // Indicate error state
        setTimeout(() => setAgentState('idle'), 2000);
        setIsGeneratingSoap(false); // Ensure loading state is reset on error
        setIsGeneratingCodes(false); // Also reset code loading state
    }
    // Note: Loading states (isGeneratingSoap, isGeneratingCodes) and agentState are reset within handleGenerateBillingCodes or the catch block
 }, [selectedPatient, transcript, patientHistory, toast]); // Removed handleGenerateBillingCodes dependency from here

 // Handler for generating billing codes (Documentation Agent - Step 2)
 // Now accepts the SOAP note as an argument to ensure it uses the latest generated one.
 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    // No need to check noteToCode here as it's called internally after SOAP generation
    // If called standalone in the future, add checks.
    setIsGeneratingCodes(true);
    setAgentState('generating_codes'); // Update agent state

    try {
      // Call AI flow to suggest billing codes
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(result.billingCodes);
      toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
    } catch (error) {
      console.error('Error generating billing codes:', error);
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
      setAgentState('error'); // Indicate error state
       setTimeout(() => setAgentState('idle'), 2000);
    } finally {
      // Reset all generation-related loading states and agent state
      setIsGeneratingCodes(false);
      setIsGeneratingSoap(false); // Reset SOAP loading state here as well
      // Only reset to idle if no error occurred
      if (agentState !== 'error') {
        setAgentState('idle'); // Final step of documentation agent complete
      }
    }
  }, [toast, agentState]); // Added agentState dependency


  // Handler for saving the final note (EHR Agent)
  const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient) {
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
    setAgentState('saving'); // Update agent state
    try {
      // Call EHR client to post the note
      await postNote(selectedPatient.id, finalNote);
      setSoapNote(finalNote); // Update the displayed note to the saved version
      toast({ title: 'Note Saved', description: 'SOAP note successfully submitted to EHR.' });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
       setAgentState('error'); // Indicate error state
       setTimeout(() => setAgentState('idle'), 2000);
    } finally {
      setIsSavingNote(false);
      // Only reset to idle if no error occurred
      if (agentState !== 'error') {
         setAgentState('idle'); // Final step complete
      }
    }
  };

  // Handler for adding a new patient via the form
  const handlePatientAdded = (newPatient: Patient) => {
    setPatients(prevPatients => [...prevPatients, newPatient]);
    // Automatically select and fetch data for the newly added patient
    handleSelectPatient(newPatient.id);
  };


  // Effect to select the first patient initially or when the selected one is removed
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient && !isFetchingData) {
       // Check !isFetchingData to prevent re-triggering fetch during initial load race condition
      handleSelectPatient(patients[0].id);
    }
    // Handle case where selected patient might be removed (e.g., future delete feature)
     if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        if (patients.length > 0) {
          handleSelectPatient(patients[0].id);
        } else {
          setSelectedPatient(null); // No patients left
        }
     }
  }, [patients, selectedPatient, handleSelectPatient, isFetchingData]);

   // Determine if actions should be disabled based on agent states
   const isActionDisabled = isFetchingData || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote || !selectedPatient;


  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
    >
      <ScrollArea className="h-full flex-1 p-4 md:p-6 relative"> {/* Added relative positioning */}
        <div className="max-w-4xl mx-auto space-y-6 pb-16"> {/* Added padding-bottom */}
          <PatientSummary
            patient={selectedPatient}
            observations={observations}
            encounters={encounters}
            isLoading={isFetchingData} // Pass loading state
          />

          <LiveTranscription
             onManualTranscriptChange={handleManualTranscriptChange}
             onAudioBlob={handleAudioBlob} // Real-Time Listening Agent trigger
             isTranscribing={isTranscribing}
             transcriptValue={transcript}
             disabled={!selectedPatient || isFetchingData || isGeneratingSoap || isGeneratingCodes || isSavingNote} // Disable during fetch and generation too
           />

          {/* Button to trigger the Documentation Agent (SOAP + Codes) */}
          {transcript && selectedPatient && !isFetchingData && (
             <div className="flex justify-end">
               <Button
                 onClick={handleGenerateSoapNote} // Starts Documentation Agent workflow
                 disabled={isGeneratingSoap || isGeneratingCodes || isSavingNote || isTranscribing || !transcript || !patientHistory}
               >
                 {(isGeneratingSoap || isGeneratingCodes) ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                 Generate SOAP & Codes
               </Button>
             </div>
           )}


          <SOAPNote
            initialNote={soapNote}
            isLoading={isGeneratingSoap} // Only show SOAP loading state here
            isSaving={isSavingNote}
            onSave={handleSaveNote} // Trigger EHR Agent
            disabled={isActionDisabled} // Disable editing/saving based on overall state
          />

          <BillingCodes
             codes={billingCodes}
             isLoading={isGeneratingCodes} // Show loading state specifically for codes
           />
        </div>
         {/* Agent Visualization Overlay - Pass the current agent state */}
         <AgentVisualizationOverlay agentState={agentState} />
      </ScrollArea>
    </AppLayout>
     {/* Dialog for adding new patients */}
     <AddPatientForm
       isOpen={isAddPatientDialogOpen}
       onOpenChange={setIsAddPatientDialogOpen}
       onPatientAdded={handlePatientAdded}
     />
     </>
  );
}
