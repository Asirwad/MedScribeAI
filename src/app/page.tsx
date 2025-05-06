
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
    getPatientsList, // Import the new function to get all patients
    addObservation, // Import addObservation
    addEncounter,   // Import addEncounter
    getCurrentDateString, // Import date helper
    deletePatientAndRelatedData, // Import the delete function
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
  const [isFetchingPatientList, setIsFetchingPatientList] = useState<boolean>(false); // Specific state for list fetching
  const [isFetchingPatientDetails, setIsFetchingPatientDetails] = useState<boolean>(false); // Specific state for details fetching
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const agentStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSidebarInitiallyOpen, setIsSidebarInitiallyOpen] = useState(false); // Control initial sidebar state after landing
  const isMobile = useIsMobile(); // Check if mobile

  const { toast } = useToast();
  // Declare function references before they are used in dependencies
  const fetchPatientDataRef = useRef<((patientId: string, clearGeneratedFields?: boolean) => Promise<void>) | null>(null);
  const loadPatientsListRef = useRef<((selectFirst?: boolean, newPatientId?: string | null) => Promise<void>) | null>(null);
  const handleGenerateBillingCodesRef = useRef<((noteToCode: string) => Promise<void>) | null>(null);


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
  }, []); // No dependencies needed here


   // Simulate Pre-Visit Agent: Fetches data for the selected patient
   const fetchPatientData = useCallback(async (patientId: string, clearGeneratedFields: boolean = true) => {
    // Prevent fetching if still on landing page or already fetching details
    if (showLandingPage || isFetchingPatientDetails) {
        console.log(`[fetchPatientData] Skipping fetch for ${patientId}. Conditions:`, { showLandingPage, isFetchingPatientDetails });
        return;
    }
    console.log(`[fetchPatientData] Fetching data for patient: ${patientId}. Clear generated: ${clearGeneratedFields}`); // Add log

    setIsFetchingPatientDetails(true);
    // Clear previous patient's data but keep the main patient list
    setSelectedPatient(null); // Clear selection first
    setObservations([]);
    setEncounters([]);
    setPatientHistory('');
    // Conditionally clear generated fields
    if (clearGeneratedFields) {
        setTranscript('');
        setSoapNote('');
        setBillingCodes([]);
    }

    transitionAgentState('fetching_data');
    try {
      // Fetch data using Firestore functions
      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId), // Default count is 5 in the service
        getEncounters(patientId),   // Default count is 5
      ]);

       if (!patientData) {
         // If patient data is null, maybe the patient was deleted between list load and detail fetch
         console.warn(`[fetchPatientData] Patient ${patientId} data is null after fetch. Might have been deleted. Reloading list.`);
         // Don't throw an error here, instead reload the list to get the current state
         toast({ title: "Patient Not Found", description:"Selected patient could not be loaded. Reloading list.", variant: "warning"});
         // Call loadPatientsList using the ref if available
         if (loadPatientsListRef.current) {
             await loadPatientsListRef.current(true); // Reload the list and select the first available one
         }
         transitionAgentState('idle'); // Go back to idle after list reload attempt
         setIsFetchingPatientDetails(false); // Reset details fetching state
         return; // Exit this fetch attempt
       }

      console.log(`[fetchPatientData] Successfully fetched data for patient: ${patientData.name}`); // Add log
      setSelectedPatient(patientData); // Set the selected patient state *after* successful fetch
      setObservations(obsData);
      setEncounters(encData);

      // Generate patient history string from fetched data
       // Ensure data exists before accessing properties
        const patientName = patientData?.name ?? 'N/A';
        const patientDOB = patientData?.dateOfBirth ?? 'N/A';
        const patientGender = patientData?.gender ?? 'N/A';

        const recentObsSummary = obsData?.slice(0, 3).map(o => `${o.code}: ${o.value} ${o.units || ''} (${o.date})`).join('; ') || 'None';
        const recentEncSummary = encData?.slice(0, 3).map(e => `${e.startDate}: ${e.class} - ${e.reason || 'N/A'}`).join('; ') || 'None';

        const history = `
            Patient: ${patientName}, DOB: ${patientDOB}, Gender: ${patientGender}
            Recent Observations: ${recentObsSummary}
            Recent Encounters: ${recentEncSummary}
        `.trim();
      setPatientHistory(history);
      transitionAgentState('fetching_data', 'idle');

    } catch (error) {
      console.error('[fetchPatientData] Error fetching patient data:', error);
      toast({
        title: 'Error Fetching Data',
        description: 'Could not load patient details.',
        variant: 'destructive',
      });
      transitionAgentState('error');
    } finally {
      setIsFetchingPatientDetails(false);
      console.log(`[fetchPatientData] Finished fetching data attempt for patient: ${patientId}`); // Add log
    }
   // Removed loadPatientsList from dependencies, call via ref if needed. Added resetAppState
   }, [toast, transitionAgentState, showLandingPage, isFetchingPatientDetails, resetAppState]); // No loadPatientsListRef dependency needed

   // Assign the function to the ref after definition
   useEffect(() => {
      fetchPatientDataRef.current = fetchPatientData;
   }, [fetchPatientData]);


   // Function to load the patient list from Firestore
   const loadPatientsList = useCallback(async (selectFirst = false, newPatientId: string | null = null) => {
     if (isFetchingPatientList) return; // Prevent concurrent fetches
     console.log(`[loadPatientsList] Triggered. selectFirst=${selectFirst}, newPatientId=${newPatientId}`); // Add log
     setIsFetchingPatientList(true);
     try {
         const patientList = await getPatientsList();
         console.log(`[loadPatientsList] Firestore getPatientsList result: ${patientList.length} patients`);
         setPatients(patientList);

         // Determine which patient to select after loading
         let patientToSelectId: string | null = null;
         if (newPatientId && patientList.some(p => p.id === newPatientId)) {
             patientToSelectId = newPatientId; // Select the newly added patient if they exist in the list
         } else if (selectFirst && patientList.length > 0) {
             patientToSelectId = patientList[0].id; // Select the first patient if requested and list is not empty
         } else if (selectedPatient && patientList.some(p => p.id === selectedPatient.id)) {
             // Keep current selection if it still exists in the list and no other instruction was given
             patientToSelectId = selectedPatient.id;
         } else if (selectFirst && patientList.length === 0) {
             // If selectFirst requested but list is empty
             patientToSelectId = null;
         }

         if (patientToSelectId && fetchPatientDataRef.current) {
             console.log(`[loadPatientsList] Selecting patient: ${patientToSelectId}`);
             // Only fetch data if the selected ID is different from the currently selected patient
             // or if no patient is currently selected
             if (!selectedPatient || selectedPatient.id !== patientToSelectId) {
                // Always clear generated fields when selecting from the list
                await fetchPatientDataRef.current(patientToSelectId, true);
             } else {
                 console.log(`[loadPatientsList] Patient ${patientToSelectId} is already selected. Skipping data fetch.`);
             }
         } else if (patientList.length === 0) {
             console.log("[loadPatientsList] No patients found, resetting app state.");
             resetAppState(); // Reset if no patients are available
         } else {
              console.log("[loadPatientsList] No specific patient selected after loading list.");
              // If no patient ID was determined to be selected (e.g., after deleting the last one), reset the state
              if (!patientToSelectId) {
                 resetAppState();
              }
         }

     } catch (error) {
         console.error('[loadPatientsList] Error loading patients list:', error);
         toast({
             title: 'Error Loading Patients',
             description: 'Could not load the patient list.',
             variant: 'destructive',
         });
         setPatients([]); // Ensure list is empty on error
         resetAppState(); // Reset app state on error
     } finally {
         setIsFetchingPatientList(false);
         console.log("[loadPatientsList] Fetch finished."); // Add log
     }
    // Only depends on resetAppState and toast now. fetchPatientData is called via ref.
   }, [toast, isFetchingPatientList, resetAppState, selectedPatient]); // Added selectedPatient dependency

   // Assign the function to the ref after definition
   useEffect(() => {
     loadPatientsListRef.current = loadPatientsList;
   }, [loadPatientsList]);


   // Load initial list of patients when the app loads (not on landing page)
   useEffect(() => {
       if (!showLandingPage && patients.length === 0 && !isFetchingPatientList && !isFetchingPatientDetails) {
           console.log("[useEffect loadPatients] Conditions met, calling loadPatientsList.");
           loadPatientsList(true); // Load list and select the first patient
       } else {
           console.log("[useEffect loadPatients] Skipping initial load.", { showLandingPage, patientsLength: patients.length, isFetchingPatientList, isFetchingPatientDetails });
       }
       // Dependency is loadPatientsList, which uses refs for potentially changing functions
   }, [showLandingPage, loadPatientsList, patients.length, isFetchingPatientList, isFetchingPatientDetails]);



  const handleSelectPatient = (patientId: string) => {
    // Prevent selection if still on landing page
    if (showLandingPage) return;
    console.log(`[handleSelectPatient] called for ID: ${patientId}`); // Add log
    // Use the ref to call fetchPatientData
    if (fetchPatientDataRef.current) {
        fetchPatientDataRef.current(patientId, true); // Clear generated fields on manual selection
    } else {
        console.error("fetchPatientData function reference not available yet.");
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
       // Ensure generating SOAP state is also reset when code generation finishes (success or error)
      setIsGeneratingSoap(false);
    }
  }, [toast, transitionAgentState, showLandingPage, isMobile]); // Add isMobile

  // Assign the function to the ref after definition
  useEffect(() => {
     handleGenerateBillingCodesRef.current = handleGenerateBillingCodes;
  }, [handleGenerateBillingCodes]);


 // Handler for generating SOAP note (Documentation Agent - Step 1)
 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory || showLandingPage) {
        // Always show missing info toast
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript and history.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true); // Set generating SOAP state
    setIsGeneratingCodes(true); // Set generating codes state (as it follows SOAP)
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
        if (handleGenerateBillingCodesRef.current) {
           await handleGenerateBillingCodesRef.current(result.soapNote);
        } else {
            console.error("handleGenerateBillingCodes function reference not available yet.");
            // Handle the error appropriately, maybe show a toast or reset state
            toast({ title: 'Code Generation Skipped', description: 'Internal error prevented code suggestion.', variant: 'warning' });
            transitionAgentState('generating_soap','idle'); // Transition to idle if codes can't be generated
            setIsGeneratingCodes(false); // Ensure codes state is reset
            setIsGeneratingSoap(false); // Ensure soap state is reset
        }


    } catch (error) {
        console.error('Error generating SOAP note:', error);
         // Always show error toast
        toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setIsGeneratingSoap(false); // Ensure soap generation stops on error
        setIsGeneratingCodes(false); // Ensure code generation also stops if SOAP failed
        transitionAgentState('error'); // Transition to error if SOAP generation fails
    }
    // NOTE: No finally block needed here to reset states, handleGenerateBillingCodes handles it.
 }, [selectedPatient, transcript, patientHistory, toast, transitionAgentState, showLandingPage, isMobile]); // Removed handleGenerateBillingCodes, uses ref


 // Basic SOAP note parser (Improve this based on actual LLM output structure)
 const parseSoapNoteForData = (note: string): { assessment: string | null; objectiveSummary: string | null, subjectiveSummary: string | null, planSummary: string | null } => {
    const subjectiveMatch = note.match(/Subjective:\s*([\s\S]*?)(Objective:|Assessment:|Plan:|$)/i);
    const objectiveMatch = note.match(/Objective:\s*([\s\S]*?)(Subjective:|Assessment:|Plan:|$)/i);
    const assessmentMatch = note.match(/Assessment:\s*([\s\S]*?)(Subjective:|Objective:|Plan:|$)/i);
    const planMatch = note.match(/Plan:\s*([\s\S]*?)(Subjective:|Objective:|Assessment:|$)/i);

    const assessment = assessmentMatch ? assessmentMatch[1].trim().split('\n')[0] || null : null; // Primary diagnosis/assessment
    const objectiveSummary = objectiveMatch ? objectiveMatch[1].trim().split('\n').slice(0, 2).join('. ') : null; // First few lines of Objective data
    const subjectiveSummary = subjectiveMatch ? subjectiveMatch[1].trim().split('\n')[0] || null : null; // Patient's main complaint
    const planSummary = planMatch ? planMatch[1].trim().split('\n')[0] || null : null; // Primary plan item

    return { assessment, objectiveSummary, subjectiveSummary, planSummary };
 };


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
      // 1. Save the SOAP Note using postNote
      await postNote(selectedPatient.id, finalNote);
      console.log(`[handleSaveNote] Successfully posted NOTE for patient ${selectedPatient.id}.`);

      // 2. Parse the note to extract data for Observation and Encounter
      const { assessment, objectiveSummary, subjectiveSummary, planSummary } = parseSoapNoteForData(finalNote);
      const currentDate = getCurrentDateString();

      // 3. Add a new Encounter record for this session
      // Use the assessment or subjective summary as the reason for the encounter.
      const encounterReason = assessment || subjectiveSummary || 'Clinical Encounter'; // Default reason
      await addEncounter(selectedPatient.id, {
          class: 'outpatient', // Example class, adjust if needed
          startDate: currentDate,
          reason: encounterReason,
          // endDate: currentDate // Optional: Set end date if known
      });
      console.log(`[handleSaveNote] Successfully added ENCOUNTER for patient ${selectedPatient.id}. Reason: ${encounterReason}`);


      // 4. Add meaningful OBSERVATIONS based on the note.
      // Example: Save the primary assessment as a 'Diagnosis' observation.
      if (assessment) {
          await addObservation(selectedPatient.id, {
             code: 'Diagnosis', // More specific code
             value: assessment,
             date: currentDate,
             // units: undefined // No units for diagnosis
           });
           console.log(`[handleSaveNote] Successfully added OBSERVATION (Diagnosis) for patient ${selectedPatient.id}.`);
      }
      // Example: Saving the subjective complaint (if available)
      if (subjectiveSummary) {
         await addObservation(selectedPatient.id, {
            code: 'ChiefComplaint', // Use a standard code if possible
            value: subjectiveSummary,
            date: currentDate,
         });
         console.log(`[handleSaveNote] Successfully added OBSERVATION (ChiefComplaint) for patient ${selectedPatient.id}.`);
      }
       // Example: Saving a summary of objective findings (if available)
       // You might extract specific vitals here if the parser was more sophisticated
      if (objectiveSummary) {
         await addObservation(selectedPatient.id, {
            code: 'ObjectiveSummary',
            value: objectiveSummary,
            date: currentDate,
         });
          console.log(`[handleSaveNote] Successfully added OBSERVATION (ObjectiveSummary) for patient ${selectedPatient.id}.`);
      }
       // Example: Saving the primary plan item (if available)
       if (planSummary) {
         await addObservation(selectedPatient.id, {
            code: 'PlanSummary', // Example code
            value: planSummary,
            date: currentDate,
         });
         console.log(`[handleSaveNote] Successfully added OBSERVATION (PlanSummary) for patient ${selectedPatient.id}.`);
      }


      // 5. Show success toast
      // Always show save success toast
      toast({ title: 'Note Saved', description: 'SOAP note and related Encounter/Observations saved.' });

      // 6. Refetch patient data to show the updated encounters/observations
      // Use the ref to call fetchPatientData, but DO NOT clear generated fields (SOAP/Codes)
      if (fetchPatientDataRef.current) {
          console.log("[handleSaveNote] Refetching patient data after save...");
          await fetchPatientDataRef.current(selectedPatient.id, false); // Pass false to keep SOAP note
      } else {
          console.error("fetchPatientData function reference not available after save.");
      }

       transitionAgentState('saving', 'idle');

    } catch (error) {
      console.error('Error saving note or related records:', error);
       // Always show save failed toast
      toast({ title: 'Save Failed', description: 'Could not save the note or related records to EHR.', variant: 'destructive' });
       transitionAgentState('error');
    } finally {
      setIsSavingNote(false);
    }
  };

 // Handler for adding a new patient via the form
  const handlePatientAdded = async (newPatientData: Omit<Patient, 'id'>) => {
      console.log(`[handlePatientAdded] called with: ${newPatientData.name}`);
      try {
          const createdPatient = await createPatient(newPatientData); // Create in DB
          console.log(`[handlePatientAdded] Patient created in DB with ID: ${createdPatient.id}`);
          toast({
              title: 'Patient Added',
              description: `${createdPatient.name} has been added successfully.`,
          });
          // Reload the patient list from Firestore to include the new patient
          // and automatically select the newly added patient. Use the ref
          if (loadPatientsListRef.current) {
             await loadPatientsListRef.current(false, createdPatient.id);
          } else {
             console.error("loadPatientsList function reference not available yet.");
          }
      } catch (error) {
          console.error('[handlePatientAdded] Error during patient creation or list reload:', error);
          toast({
              title: 'Error Adding Patient',
              description: 'Failed to add patient or reload list.',
              variant: 'destructive',
          });
      }
  };

  // Handler for deleting a patient
   const handlePatientDeleted = async (patientId: string) => {
      console.log(`[handlePatientDeleted] Attempting to delete patient: ${patientId}`);
      try {
         await deletePatientAndRelatedData(patientId); // Call the service function

         // After successful deletion:
         // 1. Reload the patient list to remove the deleted patient
         // 2. If the deleted patient was the selected one, select the first patient in the updated list (or reset if empty)
         if (loadPatientsListRef.current) {
            await loadPatientsListRef.current(true); // Reload and select first
         } else {
            console.error("loadPatientsList function reference not available after delete.");
            // Manually reset if list loading fails
            setPatients(prev => prev.filter(p => p.id !== patientId));
            if (selectedPatient?.id === patientId) {
               resetAppState(); // Reset if selected was deleted and list can't reload
            }
         }
      } catch (error) {
         // Error is already logged in the service, re-throw to be caught by AppLayout for Toast
         console.error(`[handlePatientDeleted] Error deleting patient ${patientId} from Home component:`, error);
         throw error; // Re-throw to allow AppLayout to show toast
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

  // Effect to handle patient selection changes or if selected patient is removed from list
  useEffect(() => {
    if (showLandingPage || isFetchingPatientList || isFetchingPatientDetails) {
        console.log("[useEffect selectionChange] Skipping due to conditions:", { showLandingPage, isFetchingPatientList, isFetchingPatientDetails });
        return;
    }

    const fetchPatientDataFn = fetchPatientDataRef.current; // Use the ref
    if (!fetchPatientDataFn) {
        console.log("[useEffect selectionChange] fetchPatientData function not ready yet.");
        return;
    }

    // Case 1: No patient selected, but list is available -> select first one
    if (patients.length > 0 && !selectedPatient) {
        console.log("[useEffect selectionChange] No patient selected, selecting first.");
        fetchPatientDataFn(patients[0].id, true); // Clear generated fields
    }
    // Case 2: Selected patient exists but is no longer in the main list (e.g., deleted)
    else if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        console.log("[useEffect selectionChange] Selected patient removed, selecting first or resetting.");
        if (patients.length > 0) {
            fetchPatientDataFn(patients[0].id, true); // Clear generated fields
        } else {
            resetAppState(); // No patients left, clear everything
        }
    } else {
         console.log("[useEffect selectionChange] Conditions not met for selection/reset.", {
             patientsLength: patients.length,
             hasSelectedPatient: !!selectedPatient,
             isFetchingData: isFetchingPatientDetails || isFetchingPatientList
         });
    }
// Depends on refs and other state variables
}, [patients, selectedPatient, isFetchingPatientList, isFetchingPatientDetails, showLandingPage, resetAppState]);


   const isActionDisabled = showLandingPage || isFetchingPatientList || isFetchingPatientDetails || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote || isListening;
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
      onPatientDeleted={handlePatientDeleted} // Pass the delete handler
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
                        isLoading={isFetchingPatientDetails && !selectedPatient} // Show loading only when switching patients
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
                    {transcript && selectedPatient && !isListening && !isGeneratingSoap && !isGeneratingCodes && !isSavingNote && !isTranscribing && !isFetchingPatientList && !isFetchingPatientDetails && (
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
       onPatientAdded={handlePatientAdded} // Use updated handler
     />
     </>
  );
}
