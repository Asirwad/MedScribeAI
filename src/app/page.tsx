
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
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false); // Add transcribing state
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle'); // State for visualization overlay

  const { toast } = useToast();

   // Load initial patients
   useEffect(() => {
    const initialPatients: Patient[] = [
      { id: '123', name: 'John Doe', dateOfBirth: '1970-01-01', gender: 'Male' },
      { id: '456', name: 'Jane Smith', dateOfBirth: '1985-05-15', gender: 'Female' },
      { id: '789', name: 'Robert Johnson', dateOfBirth: '1992-11-30', gender: 'Male' },
    ];
    setPatients(initialPatients);
  }, []);


  const fetchPatientData = useCallback(async (patientId: string) => {
    try {
      setTranscript('');
      setSoapNote('');
      setBillingCodes('');
      setIsGeneratingSoap(false);
      setIsGeneratingCodes(false);
      setIsSavingNote(false);
      setIsTranscribing(false); // Reset transcribing state
      setPatientHistory('');
      setAgentState('idle'); // Reset agent state

      const [patientData, obsData, encData] = await Promise.all([
        getPatient(patientId),
        getObservations(patientId),
        getEncounters(patientId),
      ]);

      setSelectedPatient(patientData);
      setObservations(obsData);
      setEncounters(encData);

       const history = `
        Patient: ${patientData.name}, DOB: ${patientData.dateOfBirth}, Gender: ${patientData.gender}
        Recent Observations: ${obsData.slice(0, 3).map(o => `${o.code}: ${o.value} ${o.units || ''} (${new Date(o.date).toLocaleDateString()})`).join('; ') || 'None'}
        Recent Encounters: ${encData.slice(0, 3).map(e => `${new Date(e.startDate).toLocaleDateString()}: ${e.class} - ${e.reason || 'N/A'}`).join('; ') || 'None'}
      `.trim();
      setPatientHistory(history);

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
    }
  }, [toast]);


  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
       fetchPatientData(patientId);
    }
  };

  // Renamed from handleTranscriptUpdate to avoid confusion
  const handleManualTranscriptChange = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    setSoapNote('');
    setBillingCodes('');
     setAgentState('idle'); // Manual change stops agent visualization
  }, []);

  // New handler for transcription results from the agent
  const handleTranscriptionResult = useCallback((newTranscriptChunk: string) => {
    const updatedTranscript = transcript ? `${transcript}\n${newTranscriptChunk}` : newTranscriptChunk;
    setTranscript(updatedTranscript);
    setSoapNote(''); // Reset downstream
    setBillingCodes('');
    // No toast here, as LiveTranscription component handles its own feedback
  }, [transcript]);


 // Handler for processing audio blob
 const handleAudioBlob = useCallback(async (audioBlob: Blob) => {
    if (!selectedPatient) return; // Should not happen if button is disabled

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

      // Call AI flow for transcription
      const result = await transcribePatientEncounter({ audioDataUri: base64Audio });
      handleTranscriptionResult(result.transcript);
      toast({ title: "Transcription Complete", description: "Audio processed successfully." });

    } catch (error) {
      console.error("Transcription failed:", error);
      toast({ title: "Transcription Error", description: "Failed to transcribe audio.", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
      setAgentState('idle'); // Reset agent state on completion or error
    }
 }, [selectedPatient, handleTranscriptionResult, toast]);


 const handleGenerateSoapNote = useCallback(async () => {
    if (!selectedPatient || !transcript || !patientHistory) {
        toast({ title: 'Missing Information', description: 'Select a patient and ensure there is a transcript.', variant: 'destructive' });
        return;
    }
    setIsGeneratingSoap(true);
    setAgentState('generating_soap'); // Update agent state
    setSoapNote('');
    setBillingCodes('');
    try {
        const result = await generateSoapNote({
            patientId: selectedPatient.id,
            encounterTranscript: transcript,
            patientHistory: patientHistory,
        });
        setSoapNote(result.soapNote);
        toast({ title: 'SOAP Note Generated', description: 'Review and edit the note below.' });
        // Trigger billing code generation AFTER SOAP note is set
        handleGenerateBillingCodes(result.soapNote); // Pass the generated note
    } catch (error) {
        console.error('Error generating SOAP note:', error);
        toast({ title: 'Generation Failed', description: 'Could not generate SOAP note.', variant: 'destructive' });
        setAgentState('idle'); // Reset on error
        setIsGeneratingSoap(false); // Ensure loading state is reset on error
    }
    // Note:setIsGeneratingSoap(false) is NOT called here, because handleGenerateBillingCodes will handle the final state update
 }, [selectedPatient, transcript, patientHistory, toast, handleTranscriptionResult /* Add handleGenerateBillingCodes dependency */]);


 const handleGenerateBillingCodes = useCallback(async (noteToCode: string) => {
    if (!noteToCode) {
      setAgentState('idle'); // Nothing to code, reset state
      setIsGeneratingSoap(false); // Reset SOAP loading state as well
      return;
    }
    setIsGeneratingCodes(true);
    setAgentState('generating_codes'); // Update agent state
    setBillingCodes('');
    try {
      const result = await generateBillingCodes({ soapNote: noteToCode });
      setBillingCodes(result.billingCodes);
      toast({ title: 'Billing Codes Suggested', description: 'Codes are displayed below.' });
    } catch (error) {
      console.error('Error generating billing codes:', error);
      toast({ title: 'Code Suggestion Failed', description: 'Could not suggest billing codes.', variant: 'destructive' });
    } finally {
      setIsGeneratingCodes(false);
      setIsGeneratingSoap(false); // Also reset SOAP loading state here
      setAgentState('idle'); // Reset agent state after codes (or error)
    }
  }, [toast]);


  const handleSaveNote = async (finalNote: string) => {
    if (!selectedPatient) {
      toast({ title: 'No Patient Selected', description: 'Cannot save note without a selected patient.', variant: 'destructive' });
      return;
    }
    setIsSavingNote(true);
     setAgentState('saving'); // Optionally add a 'saving' state visualization
    try {
      await postNote(selectedPatient.id, finalNote);
      setSoapNote(finalNote);
      toast({ title: 'Note Saved', description: 'SOAP note successfully submitted to EHR.' });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Save Failed', description: 'Could not save the note to EHR.', variant: 'destructive' });
    } finally {
      setIsSavingNote(false);
       setAgentState('idle'); // Reset agent state
    }
  };

  const handlePatientAdded = (newPatient: Patient) => {
    setPatients(prevPatients => [...prevPatients, newPatient]);
    handleSelectPatient(newPatient.id);
  };


  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      handleSelectPatient(patients[0].id);
    }
     if (selectedPatient && !patients.find(p => p.id === selectedPatient.id)) {
        if (patients.length > 0) {
          handleSelectPatient(patients[0].id);
        } else {
          setSelectedPatient(null);
        }
     }
  }, [patients, selectedPatient, handleSelectPatient]);

   const isActionDisabled = !selectedPatient || isGeneratingSoap || isSavingNote || isTranscribing;


  return (
    <>
    <AppLayout
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      onAddPatient={() => setIsAddPatientDialogOpen(true)}
    >
      <ScrollArea className="h-full flex-1 p-4 md:p-6 relative"> {/* Added relative positioning */}
        <div className="max-w-4xl mx-auto space-y-6">
          <PatientSummary
            patient={selectedPatient}
            observations={observations}
            encounters={encounters}
          />

          <LiveTranscription
             // Use the new handler for manual changes
             onManualTranscriptChange={handleManualTranscriptChange}
             // Use the new handler for audio blobs
             onAudioBlob={handleAudioBlob}
             isTranscribing={isTranscribing} // Pass transcribing state
             transcriptValue={transcript} // Pass current transcript value
             disabled={!selectedPatient}
           />

          {transcript && selectedPatient && (
             <div className="flex justify-end">
               <Button
                 onClick={handleGenerateSoapNote}
                 disabled={isGeneratingSoap || isTranscribing || !transcript || !patientHistory}
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
         {/* Agent Visualization Overlay */}
         <AgentVisualizationOverlay agentState={agentState} />
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
