
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/app-layout'; // Adjusted path
import { PatientSummary } from '@/components/patient-summary'; // Adjusted path
import { LiveTranscription } from '@/components/live-transcription'; // Adjusted path
import { SOAPNote } from '@/components/soap-note'; // Adjusted path
import { BillingCodes, BillingCodeEntry } from '@/components/billing-codes'; // Adjusted path
import {
    getPatient,
    getObservations,
    getEncounters,
    postNote,
    createPatient,
    getPatientsList,
    addObservation,
    addEncounter,
    updatePatient,
    getCurrentDateString,
    deletePatientAndRelatedData,
} from '@/services/ehr_client'; // Path remains the same if services is top-level
import type { Patient, Observation, Encounter } from '@/services/ehr_client';
import { generateSoapNote } from '@/ai/flows/generate-soap-note'; // Path remains the same if ai is top-level
import { generateBillingCodes } from '@/ai/flows/generate-billing-codes'; // Path remains the same
import { transcribePatientEncounter } from '@/ai/flows/transcribe-patient-encounter'; // Path remains the same
import { useToast } from '@/hooks/use-toast'; // Adjusted path
import { Button } from '@/components/ui/button'; // Adjusted path
import { RefreshCw, Brain } from 'lucide-react';
import { AddPatientForm } from '@/components/add-patient-form'; // Adjusted path
import { AgentVisualizationOverlay, AgentState } from '@/components/agent-visualization-overlay'; // Adjusted path
import { useIsMobile } from '@/hooks/use-mobile'; // Adjusted path
import { cn } from '@/lib/utils'; // Path remains the same if lib is top-level
import { ChatBubble } from '@/components/chat-bubble'; // Adjusted path
import { useRouter } from 'next/navigation'; // Import useRouter

// Minimum time (in ms) to display each agent state in the overlay
const MIN_AGENT_STATE_DISPLAY_TIME = 1500;

// This component now represents the main dashboard page content
export default function DashboardPage() {
  // State hooks remain the same
  const [patients, setPatients] = useState<Patient[]>([]);
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
  const [isFetchingPatientList, setIsFetchingPatientList] = useState<boolean>(false);
  const [isFetchingPatientDetails, setIsFetchingPatientDetails] = useState<boolean>(false);
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const agentStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isListening, setIsListening] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const router = useRouter(); // Initialize router

  const { toast } = useToast();
  // Function references remain the same
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
           if (currentState === newState && nextState !== null) {
               return nextState;
           } else if (currentState === newState) {
                return 'idle';
           }
           return currentState;
       });
       agentStateTimerRef.current = null;
    };

    agentStateTimerRef.current = setTimeout(transitionToNext, MIN_AGENT_STATE_DISPLAY_TIME);

  }, []);

  // Reset application state for a new patient or when returning to landing page
  const resetAppState = useCallback(() => {
      console.log("Resetting app state");
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
   const fetchPatientData = useCallback(async (patientId: string, clearGeneratedFields: boolean = true) => {
    if (isFetchingPatientDetails) {
        console.log(`[fetchPatientData] Skipping fetch for ${patientId}. Conditions:`, { isFetchingPatientDetails });
        return;
    }
    console.log(`[fetchPatientData] Fetching data for patient: ${patientId}. Clear generated: ${clearGeneratedFields}`);

    setIsFetchingPatientDetails(true);
    setSelectedPatient(null);
    setObservations([]);
    setEncounters([]);
    setPatientHistory('');
    if (clearGeneratedFields) {
        setTranscript('');
        setSoapNote('');
        setBillingCodes([]);
    }

    transitionAgentState('fetching_data');
    try {
      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId),
        getEncounters(patientId),
      ]);

       if (!patientData) {
         console.warn(`[fetchPatientData] Patient ${patientId} data is null after fetch. Might have been deleted. Reloading list.`);
         toast({ title: "Patient Not Found", description:"Selected patient could not be loaded. Reloading list.", variant: "warning"});
         if (loadPatientsListRef.current) {
             await loadPatientsListRef.current(true);
         }
         transitionAgentState('idle');
         setIsFetchingPatientDetails(false);
         return;
       }

      console.log(`[fetchPatientData] Successfully fetched data for patient: ${patientData.name}`);
      setSelectedPatient(patientData);
      setObservations(obsData);
      setEncounters(encData);

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
      console.log(`[fetchPatientData] Finished fetching data attempt for patient: ${patientId}`);
    }
   }, [toast, transitionAgentState, isFetchingPatientDetails, resetAppState]);

   useEffect(() => {
      fetchPatientDataRef.current = fetchPatientData;
   }, [fetchPatientData]);


   // Function to load the patient list from Firestore
   const loadPatientsList = useCallback(async (selectFirst = false, patientIdToSelect: string | null = null) => {
     if (isFetchingPatientList) return;
     console.log(`[loadPatientsList] Triggered. selectFirst=${selectFirst}, patientIdToSelect=${patientIdToSelect}`);
     setIsFetchingPatientList(true);
     try {
         const patientList = await getPatientsList();
         console.log(`[loadPatientsList] Firestore getPatientsList result: ${patientList.length} patients`);
         setPatients(patientList);

         let finalPatientIdToSelect: string | null = null;

         if (patientIdToSelect && patientList.some(p => p.id === patientIdToSelect)) {
             finalPatientIdToSelect = patientIdToSelect;
             console.log(`[loadPatientsList] Selecting provided patient ID: ${finalPatientIdToSelect}`);
         } else if (selectedPatient && patientList.some(p => p.id === selectedPatient.id)) {
             finalPatientIdToSelect = selectedPatient.id;
             console.log(`[loadPatientsList] Keeping current selection: ${finalPatientIdToSelect}`);
         } else if (selectFirst && patientList.length > 0) {
             finalPatientIdToSelect = patientList[0].id;
             console.log(`[loadPatientsList] Selecting first patient: ${finalPatientIdToSelect}`);
         } else {
              finalPatientIdToSelect = null;
              console.log(`[loadPatientsList] No patient selected or list empty.`);
         }

         if (finalPatientIdToSelect && fetchPatientDataRef.current) {
             console.log(`[loadPatientsList] Fetching data for patient: ${finalPatientIdToSelect}`);
             if (!selectedPatient || selectedPatient.id !== finalPatientIdToSelect) {
                 await fetchPatientDataRef.current(finalPatientIdToSelect, true);
             } else {
                  if (patientIdToSelect === selectedPatient.id) {
                      console.log(`[loadPatientsList] Refetching data for currently selected patient: ${finalPatientIdToSelect}`);
                      await fetchPatientDataRef.current(finalPatientIdToSelect, false);
                  } else {
                     console.log(`[loadPatientsList] Patient ${finalPatientIdToSelect} is already selected and no specific refetch requested. Skipping data fetch.`);
                  }
             }
         } else if (patientList.length === 0) {
             console.log("[loadPatientsList] No patients found, resetting app state.");
             resetAppState();
         } else if (!finalPatientIdToSelect) {
             console.log("[loadPatientsList] Final selection is null, resetting app state.");
             resetAppState();
         }

     } catch (error) {
         console.error('[loadPatientsList] Error loading patients list:', error);
         toast({
             title: 'Error Loading Patients',
             description: 'Could not load the patient list.',
             variant: 'destructive',
         });
         setPatients([]);
         resetAppState();
     } finally {
         setIsFetchingPatientList(false);
         console.log("[loadPatientsList] Fetch finished.");
     }
   }, [toast, isFetchingPatientList, resetAppState, selectedPatient]);

   useEffect(() => {
     loadPatientsListRef.current = loadPatientsList;
   }, [loadPatientsList]);


   // Load initial list of patients when the dashboard loads
   useEffect(() => {
       if (patients.length === 0 && !isFetchingPatientList && !isFetchingPatientDetails) {
           console.log("[useEffect loadPatients] Conditions met, calling loadPatientsList.");
           loadPatientsList(true); // Load list and select the first patient
       } else {
           console.log("[useEffect loadPatients] Skipping initial load.", { patientsLength: patients.length, isFetchingPatientList, isFetchingPatientDetails });
       }
   }, [loadPatientsList, patients.length, isFetchingPatientList, isFetchingPatientDetails]);



  const handleSelectPatient = (patientId: string) => {
    console.log(`[handleSelectPatient] called for ID: ${patientId}`);
    if (fetchPatientDataRef.current) {
        fetchPatientDataRef.current(patientId, true);
    } else {
        console.error("fetchPatientData function reference not available yet.");
    }
  };

  const handleManualTranscriptChange = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    setSoapNote('');
    setBillingCodes([]);
  }, []);

  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    setTranscript(prev => prev ? `${prev}\n${newTranscriptChunk}` : newTranscriptChunk);
    setSoapNote('');
    setBillingCodes([]);
  }, []);


 const handleAudioBlob = useCallback(async (audioBlob: Blob) => {
    if (!selectedPatient) return;
    if (audioBlob.size === 0) {
        toast({ title: "Empty Audio", description: "No audio data was captured.", variant: "default" });
        setIsTranscribing(false);
        setIsListening(false);
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
      handleTranscriptionResult(result.transcript);
      if (!isMobile) {
          toast({ title: "Transcription Segment Processed", description: "Transcript updated." });
      }
      transitionAgentState('transcribing', 'idle');

    } catch (error) {
      console.error("Transcription failed:", error);
      toast({ title: "Transcription Error", description: "Failed to process audio segment.", variant: "destructive" });
      transitionAgentState('error');
    } finally {
      setIsTranscribing(false);
    }
 }, [selectedPatient, handleTranscriptionResult, toast, transitionAgentState, isMobile]);


 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    setIsGeneratingCodes(true);
    try {
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(Array.isArray(result.billingCodes) ? result.billingCodes : []);
       if (!isMobile) {
         toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
       }
       transitionAgentState('generating_codes', 'idle');
    } catch (error) {
      console.error('Error generating billing codes:', error);
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
      transitionAgentState('error');
    } finally {
      setIsGeneratingCodes(false);
      setIsGeneratingSoap(false);
    }
  }, [toast, transitionAgentState, isMobile]);

  useEffect(() => {
     handleGenerateBillingCodesRef.current = handleGenerateBillingCodes;
  }, [handleGenerateBillingCodes]);


 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory) {
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript and history.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setIsGeneratingCodes(true);
    setSoapNote('');
    setBillingCodes([]);
    transitionAgentState('generating_soap', 'generating_codes');

    try {
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory,
        });

        setSoapNote(result.soapNote);
        if (!isMobile) {
            toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below. Generating codes...' });
        }

        if (handleGenerateBillingCodesRef.current) {
           await handleGenerateBillingCodesRef.current(result.soapNote);
        } else {
            console.error("handleGenerateBillingCodes function reference not available yet.");
            toast({ title: 'Code Generation Skipped', description: 'Internal error prevented code suggestion.', variant: 'warning' });
            transitionAgentState('generating_soap','idle');
            setIsGeneratingCodes(false);
            setIsGeneratingSoap(false);
        }
    } catch (error) {
        console.error('Error generating SOAP note:', error);
        toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setIsGeneratingSoap(false);
        setIsGeneratingCodes(false);
        transitionAgentState('error');
    }
 }, [selectedPatient, transcript, patientHistory, toast, transitionAgentState, isMobile, handleGenerateBillingCodesRef]);


 const parseSoapNoteForData = (note: string): { assessment: string | null; objectiveSummary: string | null, subjectiveSummary: string | null, planSummary: string | null } => {
    const subjectiveMatch = note.match(/Subjective:\s*([\s\S]*?)(Objective:|Assessment:|Plan:|$)/i);
    const objectiveMatch = note.match(/Objective:\s*([\s\S]*?)(Subjective:|Assessment:|Plan:|$)/i);
    const assessmentMatch = note.match(/Assessment:\s*([\s\S]*?)(Subjective:|Objective:|Plan:|$)/i);
    const planMatch = note.match(/Plan:\s*([\s\S]*?)(Subjective:|Objective:|Assessment:|$)/i);

    const assessment = assessmentMatch ? assessmentMatch[1].trim().split('\n')[0] || null : null;
    const objectiveSummary = objectiveMatch ? objectiveMatch[1].trim().split('\n').slice(0, 2).join('. ') : null;
    const subjectiveSummary = subjectiveMatch ? subjectiveMatch[1].trim().split('\n')[0] || null : null;
    const planSummary = planMatch ? planMatch[1].trim().split('\n')[0] || null : null;

    return { assessment, objectiveSummary, subjectiveSummary, planSummary };
 };


 const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient) {
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
    transitionAgentState('saving');
    try {
      await postNote(selectedPatient.id, finalNote);
      console.log(`[handleSaveNote] Successfully posted NOTE for patient ${selectedPatient.id}.`);

      const { assessment, objectiveSummary, subjectiveSummary, planSummary } = parseSoapNoteForData(finalNote);
      const currentDate = getCurrentDateString();

      const encounterReason = assessment || subjectiveSummary || 'Clinical Encounter';
      await addEncounter(selectedPatient.id, {
          class: 'outpatient',
          startDate: currentDate,
          reason: encounterReason,
      });
      console.log(`[handleSaveNote] Successfully added ENCOUNTER for patient ${selectedPatient.id}. Reason: ${encounterReason}`);

      if (assessment) {
          await addObservation(selectedPatient.id, { code: 'Diagnosis', value: assessment, date: currentDate });
          console.log(`[handleSaveNote] Successfully added OBSERVATION (Diagnosis) for patient ${selectedPatient.id}.`);
      }
      if (subjectiveSummary) {
         await addObservation(selectedPatient.id, { code: 'ChiefComplaint', value: subjectiveSummary, date: currentDate });
         console.log(`[handleSaveNote] Successfully added OBSERVATION (ChiefComplaint) for patient ${selectedPatient.id}.`);
      }
      if (objectiveSummary) {
         await addObservation(selectedPatient.id, { code: 'ObjectiveSummary', value: objectiveSummary, date: currentDate });
         console.log(`[handleSaveNote] Successfully added OBSERVATION (ObjectiveSummary) for patient ${selectedPatient.id}.`);
      }
       if (planSummary) {
         await addObservation(selectedPatient.id, { code: 'PlanSummary', value: planSummary, date: currentDate });
         console.log(`[handleSaveNote] Successfully added OBSERVATION (PlanSummary) for patient ${selectedPatient.id}.`);
      }

      toast({ title: 'Note Saved', description: 'SOAP note and related Encounter/Observations saved.' });

      if (fetchPatientDataRef.current) {
          console.log("[handleSaveNote] Refetching patient data after save...");
          await fetchPatientDataRef.current(selectedPatient.id, false);
      } else {
          console.error("fetchPatientData function reference not available after save.");
      }

       transitionAgentState('saving', 'idle');

    } catch (error) {
      console.error('Error saving note or related records:', error);
       toast({ title: 'Save Failed', description: 'Could not save the note or related records to EHR.', variant: 'destructive' });
       transitionAgentState('error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handlePatientAdded = async (newPatientData: Omit<Patient, 'id'>) => {
      console.log(`[handlePatientAdded] called with: ${newPatientData.name}`);
      try {
          const createdPatient = await createPatient(newPatientData);
          console.log(`[handlePatientAdded] Patient created in DB with ID: ${createdPatient.id}`);
          toast({
              title: 'Patient Added',
              description: `${createdPatient.name} has been added successfully.`,
          });
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


   const handlePatientUpdated = async (patientId: string, updatedData: Omit<Patient, 'id'>) => {
       console.log(`[handlePatientUpdated] called for ID: ${patientId}`);
       try {
           await updatePatient(patientId, updatedData);
           console.log(`[handlePatientUpdated] Patient ${patientId} updated in DB.`);
           if (loadPatientsListRef.current) {
               await loadPatientsListRef.current(false, patientId);
           } else {
               console.error("loadPatientsList function reference not available after update.");
                setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updatedData } : p));
                if (selectedPatient?.id === patientId) {
                    setSelectedPatient(prev => prev ? { ...prev, ...updatedData } : null);
                }
           }
       } catch (error) {
           console.error(`[handlePatientUpdated] Error updating patient ${patientId}:`, error);
           throw error;
       }
   };


   const handlePatientDeleted = async (patientId: string) => {
      console.log(`[handlePatientDeleted] Attempting to delete patient: ${patientId}`);
      try {
         await deletePatientAndRelatedData(patientId);
         if (loadPatientsListRef.current) {
            await loadPatientsListRef.current(true);
         } else {
            console.error("loadPatientsList function reference not available after delete.");
            setPatients(prev => prev.filter(p => p.id !== patientId));
            if (selectedPatient?.id === patientId) {
               resetAppState();
            }
         }
      } catch (error) {
         console.error(`[handlePatientDeleted] Error deleting patient ${patientId} from Home component:`, error);
         throw error;
      }
   };


   // Handle returning to the landing page (using router)
   const handleReturnToLanding = useCallback(() => {
     console.log("Returning to landing page via router");
     resetAppState(); // Clear patient data etc.
     setPatients([]); // Clear local patient list
     router.push('/'); // Navigate to root (landing page)
   }, [resetAppState, router]);

  // Effect to handle patient selection changes or if selected patient is removed from list
  useEffect(() => {
    if (isFetchingPatientList || isFetchingPatientDetails) {
        console.log("[useEffect selectionChange] Skipping due to fetching state:", { isFetchingPatientList, isFetchingPatientDetails });
        return;
    }

    const fetchPatientDataFn = fetchPatientDataRef.current;
    if (!fetchPatientDataFn) {
        console.log("[useEffect selectionChange] fetchPatientData function not ready yet.");
        return;
    }

    if (patients.length > 0 && !selectedPatient) {
        console.log("[useEffect selectionChange] No patient selected, selecting first.");
        fetchPatientDataFn(patients[0].id, true);
    }
    else if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        console.log("[useEffect selectionChange] Selected patient removed, selecting first or resetting.");
        if (patients.length > 0) {
            fetchPatientDataFn(patients[0].id, true);
        } else {
            resetAppState();
        }
    } else {
         console.log("[useEffect selectionChange] Conditions not met for selection/reset.", {
             patientsLength: patients.length,
             hasSelectedPatient: !!selectedPatient,
             isFetchingData: isFetchingPatientDetails || isFetchingPatientList
         });
    }
}, [patients, selectedPatient, isFetchingPatientList, isFetchingPatientDetails, resetAppState]);


   const isActionDisabled = isFetchingPatientList || isFetchingPatientDetails || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote || isListening;
   const isAgentBusy = agentState !== 'idle' && agentState !== 'error';


  // Render the main application layout with dashboard content
  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
      // initialSidebarOpen={isSidebarInitiallyOpen} // Removed as dashboard doesn't need this control
      onReturnToLanding={handleReturnToLanding} // Pass the router-based return function
      onPatientDeleted={handlePatientDeleted}
      onPatientUpdated={handlePatientUpdated}
    >
        {/* Main content area - Now this is the children of AppLayout */}
        <div className={cn(
          "flex-1 p-4 md:p-6 relative overflow-hidden",
          "bg-gradient-to-br from-background via-secondary/10 to-background"
        )}>
            {/* Grid container */}
            <div className="h-full grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr] gap-6 md:gap-8">

                {/* Patient Summary */}
                <div className="md:col-span-2">
                    <PatientSummary
                        patient={selectedPatient}
                        observations={observations}
                        encounters={encounters}
                        isLoading={isFetchingPatientDetails && !selectedPatient}
                    />
                </div>

                {/* Left Column - Transcription */}
                <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden">
                   <LiveTranscription
                        onManualTranscriptChange={handleManualTranscriptChange}
                        onAudioBlob={handleAudioBlob}
                        isTranscribing={isTranscribing}
                        transcriptValue={transcript}
                        disabled={isActionDisabled}
                        isListening={isListening}
                        setIsListening={setIsListening}
                    />
                    {transcript && selectedPatient && !isListening && !isGeneratingSoap && !isGeneratingCodes && !isSavingNote && !isTranscribing && !isFetchingPatientList && !isFetchingPatientDetails && (
                        <div className="flex justify-end mt-auto pt-4">
                            <Button
                                onClick={handleGenerateSoapNote}
                                disabled={isActionDisabled || isAgentBusy || !transcript || !patientHistory}
                                className="bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-md"
                            >
                                {(isGeneratingSoap || isGeneratingCodes) ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                                Generate SOAP & Codes
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column - SOAP Note and Billing Codes */}
                <div className="flex flex-col gap-4 md:gap-6 h-full overflow-hidden">
                    <div className="flex-grow overflow-y-auto space-y-4 md:space-y-6 pr-1">
                        <SOAPNote
                            initialNote={soapNote}
                            isLoading={isGeneratingSoap}
                            isSaving={isSavingNote}
                            onSave={handleSaveNote}
                            disabled={isActionDisabled || isAgentBusy}
                            className="min-h-[300px] md:min-h-0"
                        />
                        <BillingCodes
                            codes={billingCodes}
                            isLoading={isGeneratingCodes}
                             className="min-h-[150px] md:min-h-0"
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
      <ChatBubble /> {/* Render ChatBubble within the dashboard */}
     </>
  );
}
