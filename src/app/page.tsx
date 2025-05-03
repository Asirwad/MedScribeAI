
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Keep import if needed elsewhere, but removed wrapper
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain } from 'lucide-react'; // Removed Mic icons, handled in LiveTranscription
import { AddPatientForm } from '@/components/add-patient-form';
import { AgentVisualizationOverlay, AgentState } from '@/components/agent-visualization-overlay';

// Minimum time (in ms) to display each agent state in the overlay
const MIN_AGENT_STATE_DISPLAY_TIME = 1500; // Increased for better readability

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
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const agentStateTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref to track state transition timer
  const [isListening, setIsListening] = useState<boolean>(false); // State for mic listening

  const { toast } = useToast();

  // Helper function to manage agent state transitions with minimum display time
  const transitionAgentState = useCallback((newState: AgentState, nextState: AgentState | null = null) => {
    if (agentStateTimerRef.current) {
      clearTimeout(agentStateTimerRef.current);
    }
    setAgentState(newState);

    // Clear timer immediately if the new state is 'idle' or 'error'
    if (newState === 'idle' || newState === 'error') {
      agentStateTimerRef.current = null;
      return; // Don't schedule further transitions if we are already idle or errored
    }

    const transitionToNext = () => {
       setAgentState((currentState) => {
           // Only transition if the state hasn't changed to something else (like error) in the meantime
           if (currentState === newState && nextState !== null) {
               return nextState; // Transition to the planned next state
           } else if (currentState === newState) {
                // If no explicit next state, go to idle after delay
                return 'idle';
           }
           // If state changed meanwhile (e.g., error), keep that state
           return currentState;
       });
       agentStateTimerRef.current = null;
    };

    agentStateTimerRef.current = setTimeout(transitionToNext, MIN_AGENT_STATE_DISPLAY_TIME);

  }, []); // No dependencies needed for this helper itself


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
    transitionAgentState('fetching_data'); // Start fetching state
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
      setIsListening(false); // Reset listening state

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
      // Fetch successful, transition to idle after minimum display time
      transitionAgentState('fetching_data', 'idle');


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
      setPatientHistory('');
      transitionAgentState('error'); // Set error state directly
    } finally {
      setIsFetchingData(false);
       // Final state handled by transitionAgentState logic
    }
  }, [toast, transitionAgentState]); // Removed agentState dependency


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
    // No agent transition needed for manual changes unless we want to explicitly show 'idle'
  }, []);

  // Handler for transcription results from the agent
  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    // Append new chunk to existing transcript
    setTranscript(prev => prev ? `${prev}\n${newTranscriptChunk}` : newTranscriptChunk);
    // Do not reset downstream here, as transcription might be ongoing
    // The final SOAP/Codes generation will use the full transcript later
  }, []);


 // Handler for processing audio blob (Real-Time Listening Agent)
 const handleAudioBlob = useCallback(async (audioBlob: Blob) => {
    if (!selectedPatient) return; // Ensure patient context exists
    if (audioBlob.size === 0) {
        toast({ title: "Empty Audio", description: "No audio data was captured.", variant: "default" });
        setIsTranscribing(false); // Ensure state is reset
        setIsListening(false); // Also ensure listening stops
        transitionAgentState('idle'); // Go back to idle if recording stopped with no data
        return;
    }


    setIsTranscribing(true);
    transitionAgentState('transcribing'); // Start transcribing state
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
       // Transcription successful, transition to idle after minimum display time
       transitionAgentState('transcribing', 'idle');

    } catch (error) {
      console.error("Transcription failed:", error);
      toast({ title: "Transcription Error", description: "Failed to process audio segment.", variant: "destructive" });
      transitionAgentState('error'); // Set error state directly
    } finally {
      setIsTranscribing(false);
      // Final state handled by transitionAgentState logic
    }
 }, [selectedPatient, handleTranscriptionResult, toast, transitionAgentState]); // Added dependencies


 // *** IMPORTANT: Define handleGenerateBillingCodes BEFORE handleGenerateSoapNote ***

 // Handler for generating billing codes (Documentation Agent - Step 2)
 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    setIsGeneratingCodes(true);
    // No state transition here, as it's part of the SOAP->Codes flow started by handleGenerateSoapNote
    // transitionAgentState('generating_codes'); // This is handled by handleGenerateSoapNote now

    try {
      // Call AI flow to suggest billing codes
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(result.billingCodes);
      toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
      // Code generation successful, transition to idle after minimum display time for 'generating_codes' state
      transitionAgentState('generating_codes', 'idle');

    } catch (error) {
      console.error('Error generating billing codes:', error);
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
      transitionAgentState('error'); // Set error state directly
    } finally {
      // Reset only code generation state here, SOAP state reset by caller or success transition
      setIsGeneratingCodes(false);
      // Final state handled by transitionAgentState logic
    }
  }, [toast, transitionAgentState]); // Removed agentState dependency


 // Handler for generating SOAP note (Documentation Agent - Step 1)
 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory) {
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript and history.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setSoapNote(''); // Clear previous note
    setBillingCodes(''); // Clear previous codes
    transitionAgentState('generating_soap', 'generating_codes'); // Plan to transition to 'generating_codes' next

    try {
        // Call AI flow to generate SOAP note
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory, // Use the summary from Pre-Visit Agent
        });

        setSoapNote(result.soapNote);
        toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below. Generating codes...' });

        // Chain to billing code generation ONLY after successful SOAP generation
        // The transitionAgentState call above handles the visual progression
        await handleGenerateBillingCodes(result.soapNote); // Pass the generated note directly

    } catch (error) {
        console.error('Error generating SOAP note:', error);
        toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setIsGeneratingSoap(false); // Ensure loading state is reset on error
        setIsGeneratingCodes(false); // Also reset code loading state if SOAP fails
        transitionAgentState('error'); // Set error state directly
    } finally {
        setIsGeneratingSoap(false); // Ensure loading state is reset in finally block as well
        // Code generation loading state is handled by handleGenerateBillingCodes finally block
    }
 }, [selectedPatient, transcript, patientHistory, toast, handleGenerateBillingCodes, transitionAgentState]); // Removed agentState dependency


  // Handler for saving the final note (EHR Agent)
  const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient) {
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
    transitionAgentState('saving'); // Start saving state
    try {
      // Call EHR client to post the note
      await postNote(selectedPatient.id, finalNote);
      setSoapNote(finalNote); // Update the displayed note to the saved version
      toast({ title: 'Note Saved', description: 'SOAP note successfully submitted to EHR.' });
      // Saving successful, transition to idle after minimum display time
      transitionAgentState('saving', 'idle');

    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
       transitionAgentState('error'); // Set error state directly
    } finally {
      setIsSavingNote(false);
       // Final state handled by transitionAgentState logic
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
      handleSelectPatient(patients[0].id);
    }
     if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        if (patients.length > 0) {
          handleSelectPatient(patients[0].id);
        } else {
          setSelectedPatient(null);
        }
     }
  }, [patients, selectedPatient, handleSelectPatient, isFetchingData]);

   // Determine if actions should be disabled based on agent states or ongoing operations
   // Note: isListening check is handled primarily within LiveTranscription now
   const isActionDisabled = isFetchingData || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote;
   const isAgentBusy = agentState !== 'idle' && agentState !== 'error'; // Agent is visually busy


  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
    >
        {/* Main content container, remove ScrollArea wrapper */}
        <div className="flex-1 p-4 md:p-6 relative"> {/* Added relative */}
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
                disabled={isActionDisabled} // Pass general disabled state (LiveTranscription handles its own logic for stop btn)
                isListening={isListening}
                setIsListening={setIsListening} // Pass state and setter down
            />

            {/* Button to trigger the Documentation Agent (SOAP + Codes) */}
            {/* Show button if there's a transcript, a patient, and NOT currently listening */}
            {transcript && selectedPatient && !isListening && (
                <div className="flex justify-end">
                <Button
                    onClick={handleGenerateSoapNote} // Starts Documentation Agent workflow
                    // Disable if other actions/agent busy, or no transcript/history, or currently listening
                    disabled={isActionDisabled || isAgentBusy || !transcript || !patientHistory}
                >
                    {isGeneratingSoap || isGeneratingCodes ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Generate SOAP & Codes
                </Button>
                </div>
            )}


            <SOAPNote
                initialNote={soapNote}
                isLoading={isGeneratingSoap} // Only show SOAP loading state here
                isSaving={isSavingNote}
                onSave={handleSaveNote} // Trigger EHR Agent
                // Disable editing/saving based on actions or busy agent or if listening
                disabled={isActionDisabled || isAgentBusy || isListening}
            />

            <BillingCodes
                codes={billingCodes}
                isLoading={isGeneratingCodes} // Show loading state specifically for codes
            />
            </div>
            {/* Agent Visualization Overlay - Pass the current agent state */}
            <AgentVisualizationOverlay agentState={agentState} />
        </div>
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
