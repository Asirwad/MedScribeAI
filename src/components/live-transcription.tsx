
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribePatientEncounter } from '@/ai/flows/transcribe-patient-encounter';

interface LiveTranscriptionProps {
  onTranscriptUpdate: (transcript: string) => void;
  disabled?: boolean;
}

export function LiveTranscription({ onTranscriptUpdate, disabled = false }: LiveTranscriptionProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Function to handle starting recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; // Reset chunks

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Adjust MIME type if needed
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
           const base64Audio = reader.result as string;
           if (base64Audio) {
             try {
                // Call AI flow for transcription
                const result = await transcribePatientEncounter({ audioDataUri: base64Audio });
                const newTranscript = result.transcript;
                setFinalTranscript(prev => prev ? `${prev}\n${newTranscript}` : newTranscript);
                onTranscriptUpdate(finalTranscript + (finalTranscript ? '\n' : '') + newTranscript); // Update parent immediately
                toast({ title: "Transcription Complete", description: "Audio processed successfully." });
             } catch (error) {
                console.error("Transcription failed:", error);
                toast({ title: "Transcription Error", description: "Failed to transcribe audio.", variant: "destructive" });
             }
           }
        };
        // Stop the tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setInterimTranscript('Listening...');
      toast({ title: "Recording Started", description: "Microphone is active." });

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({ title: "Microphone Error", description: "Could not access the microphone. Please check permissions.", variant: "destructive" });
      setIsListening(false);
      setInterimTranscript(''); // Clear interim text
    }
  };

  // Function to handle stopping recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setInterimTranscript('Processing...'); // Indicate processing
      toast({ title: "Recording Stopped", description: "Processing audio..." });
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Simulate live input with manual text entry for now
  const handleManualInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const manualInput = event.target.value;
    setFinalTranscript(manualInput); // Directly update final transcript for manual mode
    onTranscriptUpdate(manualInput);
  }

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Live Transcription</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={isListening ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isListening ? 'Stop Recording' : 'Start Recording'}
        >
          {isListening ? <MicOff className="text-destructive" /> : <Mic className="text-primary" />}
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={isListening ? interimTranscript : "Start recording or manually enter transcript here..."}
          value={finalTranscript} // Display final transcript
          onChange={handleManualInputChange} // Allow manual entry/edit
          rows={8}
          className="w-full bg-secondary/30"
          disabled={disabled || isListening} // Disable text area while listening
        />
         {isListening && <p className="text-sm text-muted-foreground mt-2">{interimTranscript}</p>}
      </CardContent>
    </Card>
  );
}
