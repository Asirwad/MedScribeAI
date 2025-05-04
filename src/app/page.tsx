
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PatientSummary } from '@/components/patient-summary';
import { LiveTranscription } from '@/components/live-transcription';
import { SOAPNote } from '@/components/soap-note';
import { BillingCodes, BillingCodeEntry } from '@/components/billing-codes';
// Update imports to use Firestore-backed functions
import {
    getPatient,
    getObservations,
    getEncounters,
    postNote,
    createPatient,
    getPatientsList // Import the new function to get all patients
} from '@/services/ehr_client';
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { generateSoapNote } from '@/ai/flows/generate-soap-note';
import { generateBillingCodes } from '@/ai/flows/generate-billing-codes';
import { transcribePatientEncounter } from '@/ai/flows/transcribe-patient-encounter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, Brain } from 'lucide-react';
import { AddPatientForm } from '@/components/add-patient-form';
import { AgentVisualizationOverlay, AgentState } from '@/components/agent-visualization-overlay';
import { LandingPage } from '@/components/landing-page'; // Import the LandingPage component
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import { cn } from '@/lib/utils'; // Import cn

// Minimum time (in ms) to display each agent state in the overlay
const MIN_AGENT_STATE_DISPLAY_TIME = 1500;

export default function Home() {
  const [showLandingPage, setShowLandingPage] = useState(true); // State to control landing page visibility
  const [patients, setPatients] = useState<Patient[]>([]); // State for the list of patients
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [soapNote, setSoapNote] = useState<string>('');
  const [billingCodes, setBillingCodes] = useState<BillingCodeEntry[]>([]);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState<boolean>(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false); // Covers both patient list and details
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const agentStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSidebarInitiallyOpen, setIsSidebarInitiallyOpen] = useState(false); // Control initial sidebar state after landing
  const isMobile = useIsMobile(); // Check if mobile

  const { toast } = useToast();

  // Helper function to manage agent state transitions with minimum display time
  const transitionAgentState = useCallback((newState: AgentState, nextState: AgentState | null = null) => {
    if (agentStateTimerRef.current) {
      clearTimeout(agentStateTimerRef.current);
    }
    setAgentState(newState);

    if (newState === 'idle' || newState === 'error') {
      agentStateTimerRef.current = null;
      return;
    }

    const transitionToNext = () => {
       setAgentState((currentState) => {
           // Only transition if the current state is still the one we set
           if (currentState === newState && nextState !== null) {
               return nextState;
           } else if (currentState === newState) {
                // If no next state is specified, transition to idle
                return 'idle';
           }
           // If state changed in the meantime, don't transition
           return currentState;
       });
       agentStateTimerRef.current = null;
    };

    agentStateTimerRef.current = setTimeout(transitionToNext, MIN_AGENT_STATE_DISPLAY_TIME);

  }, []);


   // Load initial list of patients from Firestore when the app loads (not on landing page)
   useEffect(() => {
      const loadPatients = async () => {
          // Only load if not on landing page and not already fetching
          // AND if the local patients list is empty (to avoid re-fetching unnecessarily after local updates)
          if (!showLandingPage && !isFetchingData && patients.length === 0) {
              setIsFetchingData(true); // Indicate loading patient list
              console.log("Initial patient list fetch triggered..."); // Add log
              try {
                  const patientList = await getPatientsList(); // Fetches from DB
                  console.log(`Firestore getPatientsList result: ${patientList.length} patients`); // Add log
                  setPatients(patientList); // Updates state with DB list
                  // Selection of first patient is handled in a separate effect
              } catch (error) {
                  // Log the specific error for debugging
                  console.error('Error fetching initial patient list:', error);
                  // Show a user-friendly toast message
                  toast({
                      title: 'Error Loading Patients',
                      // Provide more context in the description if possible
                      description: `Could not load the patient list. ${error instanceof Error ? error.message : 'Please check console for details.'}`,
                      variant: 'destructive',
                  });
                   setPatients([]); // Ensure patients list is empty on error
              } finally {
                 setIsFetchingData(false); // Set fetching false ONLY after list fetch attempt
                 console.log("Initial patient list fetch finished."); // Add log
              }
          } else {
              console.log("Skipping initial patient list fetch. Conditions:", { showLandingPage, isFetchingData, patientsLength: patients.length });
          }
      };
      loadPatients();
      // Dependencies: showLandingPage triggers fetch when leaving landing page.
      // isFetchingData prevents concurrent fetches.
      // patients.length condition prevents refetch after local update.
  }, [showLandingPage, isFetchingData, toast]); // Added toast to dependencies


  // Reset application state for a new patient or when returning to landing page
  const resetAppState = useCallback(() => {
      console.log("Resetting app state"); // Add log
      setSelectedPatient(null);
      setObservations([]);
      setEncounters([]);
      setTranscript('');
      setSoapNote('');
      setBillingCodes([]);
      setIsGeneratingSoap(false);
      setIsGeneratingCodes(false);
      setIsSavingNote(false);
      setIsTranscribing(false);
      setPatientHistory('');
      setIsListening(false);
      setAgentState('idle');
      if (agentStateTimerRef.current) {
          clearTimeout(agentStateTimerRef.current);
          agentStateTimerRef.current = null;
      }
  }, []);


  // Simulate Pre-Visit Agent: Fetches data for the selected patient
  const fetchPatientData = useCallback(async (patientId: string) => {
    // Prevent fetching if still on landing page
    if (showLandingPage) return;
    console.log(`Fetching data for patient: ${patientId}`); // Add log

    setIsFetchingData(true);
    // Clear previous patient's data but keep the main patient list
    setSelectedPatient(null);
    setObservations([]);
    setEncounters([]);
    setPatientHistory('');
    setTranscript('');
    setSoapNote('');
    setBillingCodes([]);

    transitionAgentState('fetching_data');
    try {
      // Fetch data using Firestore functions
      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId), // Default count is 5 in the service
        getEncounters(patientId),   // Default count is 5
      ]);

       if (!patientData) {
         throw new Error(`Patient ${patientId} data is null after fetch.`);
       }

      console.log(`Successfully fetched data for patient: ${patientData.name}`); // Add log
      setSelectedPatient(patientData);
      setObservations(obsData);
      setEncounters(encData);

      // Generate patient history string from fetched data
      const history = `
        Patient: ${patientData.name}, DOB: ${patientData.dateOfBirth}, Gender: ${patientData.gender}
        Recent Observations: ${obsData.slice(0, 3).map(o => `${o.code}: ${o.value} ${o.units || ''} (${o.date})`).join('; ') || 'None'}
        Recent Encounters: ${encData.slice(0, 3).map(e => `${e.startDate}: ${e.class} - ${e.reason || 'N/A'}`).join('; ') || 'None'}
      `.trim();
      setPatientHistory(history);
      transitionAgentState('fetching_data', 'idle');

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: 'Error Fetching Data',
        description: 'Could not load patient details from the database.',
        variant: 'destructive',
      });
      resetAppState(); // Reset state on error
      transitionAgentState('error');
    } finally {
      setIsFetchingData(false);
      console.log(`Finished fetching data attempt for patient: ${patientId}`); // Add log
    }
  }, [toast, transitionAgentState, showLandingPage, resetAppState]); // Added showLandingPage, resetAppState


  const handleSelectPatient = (patientId: string) => {
    // Prevent selection if still on landing page
    if (showLandingPage) return;
    console.log(`handleSelectPatient called for ID: ${patientId}`); // Add log
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
       console.log(`Found patient locally: ${patient.name}. Triggering fetchPatientData.`); // Add log
       fetchPatientData(patientId);
    } else {
        console.warn(`Patient with ID ${patientId} not found in local list.`);
        // Optional: Could trigger a refetch of the list here if desired
         toast({ title: "Patient Not Found", description:"Selected patient not found in the current list.", variant: "destructive"})
    }
  };

  // Handler for manual transcript changes (user input)
  const handleManualTranscriptChange = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    setSoapNote('');
    setBillingCodes([]);
  }, []);

  // Handler for transcription results from the agent
  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    setTranscript(prev => prev ? `${prev}\n${newTranscriptChunk}` : newTranscriptChunk);
    setSoapNote(''); // Clear SOAP note when transcript changes
    setBillingCodes([]); // Clear codes when transcript changes
  }, []);


 // Handler for processing audio blob (Real-Time Listening Agent)
 const handleAudioBlob = useCallback(async (audioBlob: Blob) => {
    if (!selectedPatient || showLandingPage) return;
    if (audioBlob.size === 0) {
        // Always show empty audio toast
        toast({ title: "Empty Audio", description: "No audio data was captured.", variant: "default" });
        setIsTranscribing(false);
        setIsListening(false); // Ensure listening state is also reset
        transitionAgentState('idle');
        return;
    }

    setIsTranscribing(true);
    transitionAgentState('transcribing');
    let base64Audio: string | null = null;

    try {
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      base64Audio = await readPromise;

      const result = await transcribePatientEncounter({ audioDataUri: base64Audio });
      handleTranscriptionResult(result.transcript); // Update transcript, clear SOAP/codes
      // Show transcription success toast only on non-mobile
      if (!isMobile) {
          toast({ title: "Transcription Segment Processed", description: "Transcript updated." });
      }
      transitionAgentState('transcribing', 'idle');

    } catch (error) {
      console.error("Transcription failed:", error);
      // Always show error toast
      toast({ title: "Transcription Error", description: "Failed to process audio segment.", variant: "destructive" });
      transitionAgentState('error');
    } finally {
      setIsTranscribing(false);
    }
 }, [selectedPatient, handleTranscriptionResult, toast, transitionAgentState, showLandingPage, isMobile]); // Add isMobile


 // Handler for generating billing codes (Documentation Agent - Step 2)
 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    if (showLandingPage) return;
    setIsGeneratingCodes(true);
    // Note: No separate agent state transition here, as it's part of the SOAP generation flow visually

    try {
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(Array.isArray(result.billingCodes) ? result.billingCodes : []);
      // Show codes suggested toast only on non-mobile
       if (!isMobile) {
         toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
       }
       // Transition to idle AFTER codes are generated successfully
       transitionAgentState('generating_codes', 'idle');

    } catch (error) {
      console.error('Error generating billing codes:', error);
      // Always show error toast
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
      transitionAgentState('error'); // Transition to error if codes fail
    } finally {
      setIsGeneratingCodes(false);
    }
  }, [toast, transitionAgentState, showLandingPage, isMobile]); // Add isMobile


 // Handler for generating SOAP note (Documentation Agent - Step 1)
 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory || showLandingPage) {
        // Always show missing info toast
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript and history.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setSoapNote('');
    setBillingCodes([]);
    // Start the agent visualization flow: Generating SOAP -> Generating Codes
    transitionAgentState('generating_soap', 'generating_codes');

    try {
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory,
        });

        setSoapNote(result.soapNote); // Update SOAP note state first
        // Show SOAP generated toast only on non-mobile
        if (!isMobile) {
            toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below. Generating codes...' });
        }

        // IMPORTANT: Now trigger billing code generation using the *newly generated* SOAP note
        // The transition to idle will happen inside handleGenerateBillingCodes on success/error
        await handleGenerateBillingCodes(result.soapNote);


    } catch (error) {
        console.error('Error generating SOAP note:', error);
         // Always show error toast
        toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setIsGeneratingSoap(false); // Ensure soap generation stops on error
        setIsGeneratingCodes(false); // Ensure code generation also stops if SOAP failed
        transitionAgentState('error'); // Transition to error if SOAP generation fails
    } finally {
        setIsGeneratingSoap(false); // Ensure soap generation state is reset regardless of code generation outcome
    }
 }, [selectedPatient, transcript, patientHistory, toast, handleGenerateBillingCodes, transitionAgentState, showLandingPage, isMobile]); // Add isMobile


  // Handler for saving the final note (EHR Agent)
  const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient || showLandingPage) {
      // Always show no patient toast
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
    transitionAgentState('saving');
    try {
        // Use Firestore postNote function
      await postNote(selectedPatient.id, finalNote);
      setSoapNote(finalNote); // Ensure saved note is reflected
      // Always show save success toast
      toast({ title: 'Note Saved', description: 'SOAP note successfully submitted to EHR.' });
      transitionAgentState('saving', 'idle');

    } catch (error) {
      console.error('Error saving note:', error);
       // Always show save failed toast
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
       transitionAgentState('error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Handler for adding a new patient via the form
  const handlePatientAdded = (newPatient: Patient) => {
      console.log(`handlePatientAdded called with: ${newPatient.name}, ID: ${newPatient.id}`); // Add log
      setPatients(prevPatients => {
        console.log(`Updating local patients state. Previous length: ${prevPatients.length}`); // Add log
        const updatedPatients = [...prevPatients, newPatient];
        console.log(`New local patients state length: ${updatedPatients.length}`); // Add log
        return updatedPatients;
      });
    // Always show patient added toast
     toast({
        title: 'Patient Added',
        description: `${newPatient.name} has been added successfully.`,
      });
    // Automatically select and fetch data for the newly added patient
    // only if not on the landing page anymore
    if (!showLandingPage) {
        console.log("Not on landing page, triggering selection for new patient."); // Add log
        handleSelectPatient(newPatient.id);
    } else {
        console.log("On landing page, skipping auto-selection."); // Add log
    }
  };

   // Handle the "Select Patient" button click from the landing page
   const handleEnterApp = () => {
      console.log("Entering app from landing page"); // Add log
      setShowLandingPage(false); // Hide the landing page
      // Patient list loading is triggered by useEffect watching showLandingPage
      setIsSidebarInitiallyOpen(true); // Trigger sidebar open
   };

   // Handle returning to the landing page
   const handleReturnToLanding = useCallback(() => {
     console.log("Returning to landing page"); // Add log
     resetAppState(); // Clear patient data etc.
     setPatients([]); // Clear local patient list to force DB refetch on next entry
     setShowLandingPage(true);
   }, [resetAppState]);

  // Effect to handle patient selection changes after landing page is dismissed
  // Handles initial selection after landing page or if selected patient is removed
  useEffect(() => {
    if (showLandingPage) {
        console.log("Patient Selection Effect: On landing page, skipping."); // Add log
        return;
    }

    // Case 1: Just entered app (showLandingPage became false) OR
    //         patients list loaded/updated, but no patient is selected, and not currently fetching list/details.
    if (patients.length > 0 && !selectedPatient && !isFetchingData) {
        console.log("Patient Selection Effect: Conditions met for selecting first patient."); // Add log
        // Ensure fetchPatientData is called only once after initial load or state change
        // Check if fetch is already in progress (redundant check, but safe)
         if (!isFetchingData) {
             fetchPatientData(patients[0].id);
         }
    }
    // Case 2: Selected patient exists but is no longer in the main list (e.g., deleted elsewhere)
    else if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        console.log("Patient Selection Effect: Selected patient removed, selecting first or resetting."); // Add log
        if (patients.length > 0) {
            fetchPatientData(patients[0].id);
        } else {
            resetAppState(); // No patients left, clear everything
        }
    } else {
         console.log("Patient Selection Effect: Conditions not met for selection/reset.", {
             patientsLength: patients.length,
             hasSelectedPatient: !!selectedPatient,
             isFetchingData
         }); // Add log
    }
    // Dependencies: patients list, current selection, fetching state, and landing page visibility
}, [patients, selectedPatient, fetchPatientData, isFetchingData, showLandingPage, resetAppState]);


   const isActionDisabled = showLandingPage || isFetchingData || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote || isListening;
   const isAgentBusy = agentState !== 'idle' && agentState !== 'error';


  // If showLandingPage is true, render only the LandingPage component
  if (showLandingPage) {
      return <LandingPage onEnterApp={handleEnterApp} />;
  }

  // Otherwise, render the main application layout
  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
      initialSidebarOpen={isSidebarInitiallyOpen} // Pass the initial state
      onReturnToLanding={handleReturnToLanding} // Pass the return function
    >
        {/* Main content area using grid for desktop layout */}
        {/* Apply a subtle background pattern or gradient for depth */}
        <div className={cn(
          "flex-1 p-4 md:p-6 relative overflow-hidden",
          "bg-gradient-to-br from-background via-secondary/10 to-background" // Example gradient
          // Or use a background image pattern: "bg-[url('/path/to/pattern.svg')] bg-repeat"
        )}>
            {/* Grid container */}
            <div className="h-full grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr] gap-6 md:gap-8"> {/* Define grid structure */}

                {/* Patient Summary - Spans both columns at the top */}
                <div className="md:col-span-2">
                    <PatientSummary
                        patient={selectedPatient}
                        observations={observations}
                        encounters={encounters}
                        isLoading={isFetchingData && selectedPatient === null} // Show loading only when switching patients
                    />
                </div>

                {/* Left Column - Transcription */}
                <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden"> {/* Allow transcription card to grow */}
                   <LiveTranscription
                        onManualTranscriptChange={handleManualTranscriptChange}
                        onAudioBlob={handleAudioBlob}
                        isTranscribing={isTranscribing}
                        transcriptValue={transcript}
                        disabled={isActionDisabled}
                        isListening={isListening}
                        setIsListening={setIsListening}
                    />
                    {/* Generate Button - Below Transcription Card */}
                    {transcript && selectedPatient && !isListening && !isGeneratingSoap && !isGeneratingCodes && !isSavingNote && !isTranscribing && !isFetchingData && (
                        <div className="flex justify-end mt-auto pt-4"> {/* Push button to bottom of its container */}
                            <Button
                                onClick={handleGenerateSoapNote}
                                disabled={isActionDisabled || isAgentBusy || !transcript || !patientHistory}
                                // Adjusted button style for glassmorphism context
                                className="bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-md"
                            >
                                {(isGeneratingSoap || isGeneratingCodes) ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                                Generate SOAP & Codes
                            </Button>
                        </div>
                    )}
                </div>


                {/* Right Column - SOAP Note and Billing Codes */}
                <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden"> {/* Column for SOAP and Billing */}
                     {/* Inner container for scrolling */}
                    <div className="flex-grow overflow-y-auto space-y-4 md:space-y-6 pr-1"> {/* Make this part scrollable */}
                        <SOAPNote
                            initialNote={soapNote}
                            isLoading={isGeneratingSoap}
                            isSaving={isSavingNote}
                            onSave={handleSaveNote}
                            disabled={isActionDisabled || isAgentBusy} // Removed isListening here as it's covered by isActionDisabled
                            className="min-h-[300px] md:min-h-0" // Ensure SOAP note has some minimum height
                        />
                        <BillingCodes
                            codes={billingCodes}
                            isLoading={isGeneratingCodes}
                             className="min-h-[150px] md:min-h-0" // Ensure Billing codes has some minimum height
                        />
                    </div>
                </div>
            </div>
             <AgentVisualizationOverlay agentState={agentState} />
        </div>
    </AppLayout>
     <AddPatientForm
       isOpen={isAddPatientDialogOpen}
       onOpenChange={setIsAddPatientDialogOpen}
       onPatientAdded={handlePatientAdded}
     />
     </>
  );
}
