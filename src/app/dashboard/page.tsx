
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { PatientSummary } from '@/components/patient-summary';
import { LiveTranscription } from '@/components/live-transcription';
import { SOAPNote } from '@/components/soap-note';
import { BillingCodes, BillingCodeEntry } from '@/components/billing-codes';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ChatBubble } from '@/components/chat-bubble';
import { useRouter } from 'next/navigation';

const MIN_AGENT_STATE_DISPLAY_TIME = 1500;

export default function DashboardPage() {
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
  const [isSidebarInitiallyOpen, setIsSidebarInitiallyOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();

  const [patientDataContextForChat, setPatientDataContextForChat] = useState<string | null>(null);


  const fetchPatientDataRef = useRef<((patientId: string, clearGeneratedFields?: boolean) => Promise<void>) | null>(null);
  const loadPatientsListRef = useRef<((selectFirst?: boolean, newPatientId?: string | null) => Promise<void>) | null>(null);
  const handleGenerateBillingCodesRef = useRef<((noteToCode: string) => Promise<void>) | null>(null);

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
        if (currentState === newState && nextState !== null) return nextState;
        else if (currentState === newState) return 'idle';
        return currentState;
      });
      agentStateTimerRef.current = null;
    };
    agentStateTimerRef.current = setTimeout(transitionToNext, MIN_AGENT_STATE_DISPLAY_TIME);
  }, []);

  const resetAppState = useCallback((keepPatientList = false) => {
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
    setPatientDataContextForChat(null);
    setIsListening(false);
    setAgentState('idle');
    if (!keepPatientList) {
        setPatients([]);
    }
    if (agentStateTimerRef.current) {
      clearTimeout(agentStateTimerRef.current);
      agentStateTimerRef.current = null;
    }
  }, []);

  const serializePatientDataForChat = useCallback((patient: Patient | null, obs: Observation[], enc: Encounter[], note: string, history: string) => {
    if (!patient) return null;
    return JSON.stringify({
        patientSummary: {
            id: patient.id,
            name: patient.name,
            dob: patient.dateOfBirth,
            gender: patient.gender,
        },
        patientHistorySummary: history,
        recentObservations: obs.slice(0, 5).map(o => ({ code: o.code, value: o.value, units: o.units, date: o.date })),
        recentEncounters: enc.slice(0, 5).map(e => ({ class: e.class, startDate: e.startDate, reason: e.reason })),
        currentSoapNote: note,
    });
  }, []);
  

  const fetchPatientData = useCallback(async (patientId: string, clearGeneratedFields: boolean = true) => {
    if (isFetchingPatientDetails) {
      console.log(`[fetchPatientData] Skipping fetch for ${patientId}. Already fetching details.`);
      return;
    }
    console.log(`[fetchPatientData] Fetching data for patient: ${patientId}. Clear generated: ${clearGeneratedFields}`);
    setIsFetchingPatientDetails(true);
    setSelectedPatient(null);
    setObservations([]);
    setEncounters([]);
    setPatientHistory('');
    setPatientDataContextForChat(null);
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
        console.warn(`[fetchPatientData] Patient ${patientId} data is null. Reloading list.`);
        toast({ title: "Patient Not Found", description: "Selected patient could not be loaded. Reloading list.", variant: "destructive" });
        if (loadPatientsListRef.current) await loadPatientsListRef.current(true);
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
      const history = `Patient: ${patientName}, DOB: ${patientDOB}, Gender: ${patientGender}\nRecent Observations: ${recentObsSummary}\nRecent Encounters: ${recentEncSummary}`.trim();
      setPatientHistory(history);

      setPatientDataContextForChat(serializePatientDataForChat(patientData, obsData, encData, clearGeneratedFields ? '' : soapNote, history));

      transitionAgentState('fetching_data', 'idle');
    } catch (error) {
      console.error('[fetchPatientData] Error fetching patient data:', error);
      toast({ title: 'Error Fetching Data', description: 'Could not load patient details.', variant: 'destructive' });
      transitionAgentState('error');
    } finally {
      setIsFetchingPatientDetails(false);
      console.log(`[fetchPatientData] Finished fetching data attempt for patient: ${patientId}`);
    }
  }, [toast, transitionAgentState, isFetchingPatientDetails, serializePatientDataForChat, soapNote]);

  useEffect(() => {
    fetchPatientDataRef.current = fetchPatientData;
  }, [fetchPatientData]);

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
      } else if (selectedPatient && patientList.some(p => p.id === selectedPatient.id)) {
        finalPatientIdToSelect = selectedPatient.id;
      } else if (selectFirst && patientList.length > 0) {
        finalPatientIdToSelect = patientList[0].id;
      }
      if (finalPatientIdToSelect && fetchPatientDataRef.current) {
        console.log(`[loadPatientsList] Fetching data for patient: ${finalPatientIdToSelect}`);
        if (!selectedPatient || selectedPatient.id !== finalPatientIdToSelect) {
          await fetchPatientDataRef.current(finalPatientIdToSelect, true);
        } else if (patientIdToSelect === selectedPatient.id) {
          console.log(`[loadPatientsList] Refetching data for currently selected patient: ${finalPatientIdToSelect}`);
          await fetchPatientDataRef.current(finalPatientIdToSelect, false);
        }
      } else if (patientList.length === 0) {
        console.log("[loadPatientsList] No patients found, resetting app state.");
        resetAppState();
      } else if (!finalPatientIdToSelect) {
        console.log("[loadPatientsList] Final selection is null, resetting app state.");
        resetAppState();
      }
    } catch (error: any) {
      console.error('[loadPatientsList] Error loading patients list:', error.message);
      toast({ title: 'Error Loading Patients', description: error.message || 'Could not load the patient list.', variant: 'destructive' });
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

  useEffect(() => {
    if (patients.length === 0 && !isFetchingPatientList && !isFetchingPatientDetails) {
      console.log("[useEffect loadPatients] Conditions met, calling loadPatientsList.");
      loadPatientsList(true);
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
    if (selectedPatient) {
        setPatientDataContextForChat(serializePatientDataForChat(selectedPatient, observations, encounters, '', patientHistory));
    }
  }, [selectedPatient, observations, encounters, patientHistory, serializePatientDataForChat]);

  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    setTranscript(prev => {
        const updatedTranscript = prev ? `${prev}\n${newTranscriptChunk}` : newTranscriptChunk;
        if (selectedPatient) {
            setPatientDataContextForChat(serializePatientDataForChat(selectedPatient, observations, encounters, '', patientHistory));
        }
        return updatedTranscript;
    });
    setSoapNote('');
    setBillingCodes([]);
  }, [selectedPatient, observations, encounters, patientHistory, serializePatientDataForChat]);

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
      setPatientDataContextForChat(serializePatientDataForChat(selectedPatient, observations, encounters, result.soapNote, patientHistory));

      if (!isMobile) {
        toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below. Generating codes...' });
      }
      
      // Save observations and encounter related to this SOAP note generation
      const { assessment, objectiveSummary, subjectiveSummary, planSummary } = parseSoapNoteForData(result.soapNote);
      const currentDate = getCurrentDateString();
      
      const encounterReason = assessment || subjectiveSummary || 'Clinical Documentation Session';
      await addEncounter(selectedPatient.id, { class: 'documentation', startDate: currentDate, reason: encounterReason });
      console.log(`[handleGenerateSoapNote] Added ENCOUNTER for patient ${selectedPatient.id}. Reason: ${encounterReason}`);

      if (assessment) {
        await addObservation(selectedPatient.id, { code: 'Diagnosis', value: assessment, date: currentDate });
      }
      if (subjectiveSummary) {
        await addObservation(selectedPatient.id, { code: 'ChiefComplaint', value: subjectiveSummary, date: currentDate });
      }
      if (objectiveSummary) {
        await addObservation(selectedPatient.id, { code: 'ObjectiveSummary', value: objectiveSummary, date: currentDate });
      }
      if (planSummary) {
        await addObservation(selectedPatient.id, { code: 'PlanSummary', value: planSummary, date: currentDate });
      }
      console.log(`[handleGenerateSoapNote] Added relevant OBSERVATIONS for patient ${selectedPatient.id} from SOAP note.`);

      // After SOAP note and related data are processed, generate billing codes
      if (handleGenerateBillingCodesRef.current) {
        await handleGenerateBillingCodesRef.current(result.soapNote);
      } else {
         console.error("handleGenerateBillingCodes function reference not available yet.");
         toast({ title: 'Code Generation Skipped', description: 'Internal error prevented code suggestion.', variant: 'warning' });
         transitionAgentState('generating_soap', 'idle');
         setIsGeneratingCodes(false);
         setIsGeneratingSoap(false);
      }
      // Refresh patient data to show new encounter/observations immediately
      if (fetchPatientDataRef.current) {
        await fetchPatientDataRef.current(selectedPatient.id, false);
      }

    } catch (error) {
      console.error('Error generating SOAP note or saving related data:', error);
      toast({ title: 'SOAP Generation Failed', description: 'Could not generate SOAP note or save related data.', variant: 'destructive' });
      setIsGeneratingSoap(false);
      setIsGeneratingCodes(false);
      transitionAgentState('error');
    }
  }, [selectedPatient, transcript, patientHistory, toast, transitionAgentState, isMobile, observations, encounters, serializePatientDataForChat]);
  
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
      
      // The following logic for adding Encounter/Observations is now part of handleGenerateSoapNote
      // If saving an edited note should also create new encounter/observations, this needs to be decided.
      // For now, let's assume that the primary Encounter/Observations are created during generation.
      // If saving the note itself should *also* update or add more, that logic can be re-added here.

      toast({ title: 'Note Saved', description: 'SOAP note saved to EHR.' });
      if (fetchPatientDataRef.current) {
        console.log("[handleSaveNote] Refetching patient data after save...");
        await fetchPatientDataRef.current(selectedPatient.id, false); // Keep generated SOAP, just refresh summary
      } else {
        console.error("fetchPatientData function reference not available after save.");
      }
      transitionAgentState('saving', 'idle');
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
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
      toast({ title: 'Patient Added', description: `${createdPatient.name} has been added successfully.` });
      if (loadPatientsListRef.current) {
        await loadPatientsListRef.current(false, createdPatient.id);
      } else {
        console.error("loadPatientsList function reference not available yet.");
      }
    } catch (error) {
      console.error('[handlePatientAdded] Error during patient creation or list reload:', error);
      toast({ title: 'Error Adding Patient', description: 'Failed to add patient or reload list.', variant: 'destructive' });
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
  
  const handleReturnToLanding = useCallback(() => {
    resetAppState(false);
    router.push('/landing');
  }, [resetAppState, router]);


  useEffect(() => {
    if (isFetchingPatientList || isFetchingPatientDetails) {
      console.log("[useEffect selectionChange] Skipping due to conditions:", { isFetchingPatientList, isFetchingPatientDetails });
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
    } else if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
      console.log("[useEffect selectionChange] Selected patient removed, selecting first or resetting.");
      if (patients.length > 0) {
        fetchPatientDataFn(patients[0].id, true);
      } else {
        resetAppState();
      }
    }
  }, [patients, selectedPatient, isFetchingPatientList, isFetchingPatientDetails, resetAppState]);

  const isActionDisabled = isFetchingPatientList || isFetchingPatientDetails || isTranscribing || isGeneratingSoap || isGeneratingCodes || isSavingNote || isListening;
  const isAgentBusy = agentState !== 'idle' && agentState !== 'error';

  return (
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
      onReturnToLanding={handleReturnToLanding}
      onPatientDeleted={handlePatientDeleted}
      onPatientUpdated={handlePatientUpdated}
      initialSidebarOpen={isSidebarInitiallyOpen}
    >
      <div className={cn(
        "flex-1 p-4 md:p-6 relative overflow-hidden",
        "bg-gradient-to-br from-background via-secondary/10 to-background"
      )}>
        <div className="h-full grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr] gap-6 md:gap-8">
          <div className="md:col-span-2">
            <PatientSummary
              patient={selectedPatient}
              observations={observations}
              encounters={encounters}
              isLoading={isFetchingPatientDetails && !selectedPatient}
            />
          </div>
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
      <AddPatientForm
        isOpen={isAddPatientDialogOpen}
        onOpenChange={setIsAddPatientDialogOpen}
        onPatientAdded={handlePatientAdded}
      />
      <ChatBubble 
        contextType="dashboard" 
        patientDataContext={patientDataContextForChat} 
      />
    </AppLayout>
  );
}
