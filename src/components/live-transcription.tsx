
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
// Removed transcribePatientEncounter import as it's now handled in the parent

interface LiveTranscriptionProps {
  onManualTranscriptChange: (transcript: string) => void; // Renamed for clarity
  onAudioBlob: (blob: Blob) => void; // New prop for sending audio blob
  isTranscribing: boolean; // Receive transcribing state from parent
  transcriptValue: string; // Receive transcript value from parent
  disabled?: boolean;
}

export function LiveTranscription({
  onManualTranscriptChange,
  onAudioBlob,
  isTranscribing,
  transcriptValue,
  disabled = false
}: LiveTranscriptionProps) {
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); // For user feedback (Listening..., Processing...)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Function to handle starting recording
  const startRecording = async () => {
    if (isTranscribing) return; // Don't start if already processing
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Explicitly set mimeType
      audioChunksRef.current = []; // Reset chunks

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
           setStatusMessage('Processing audio...');
           toast({ title: "Recording Stopped", description: "Processing audio..." });
           onAudioBlob(audioBlob); // Send blob to parent
        } else {
            setStatusMessage(''); // No audio recorded
            toast({ title: "Recording Stopped", description: "No audio data captured.", variant: "destructive" });
        }

        // Stop the tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false); // Set listening to false *after* tracks are stopped
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setStatusMessage('Listening...');
      toast({ title: "Recording Started", description: "Microphone is active." });

    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Check for specific error types if needed
      let description = "Could not access the microphone. Please check permissions.";
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        description = "Microphone access denied. Please allow access in your browser settings.";
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
         description = "No microphone found. Please ensure a microphone is connected and enabled.";
      }
      toast({ title: "Microphone Error", description: description, variant: "destructive" });
      setIsListening(false);
      setStatusMessage(''); // Clear status message
    }
  };

  // Function to handle stopping recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Status message set in onstop handler
    }
     // If stopped manually before any data, ensure listening state is updated
     if (isListening) {
        setIsListening(false);
     }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Ensure media recorder is stopped and stream tracks are released on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Additionally, check if tracks are still active and stop them
       mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Update status message when transcription starts/ends externally
  useEffect(() => {
      if (!isTranscribing && statusMessage === 'Processing audio...') {
          setStatusMessage(''); // Clear processing message when done
      }
  }, [isTranscribing, statusMessage]);


  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
     if (!isListening && !isTranscribing) { // Only allow manual changes when not recording or processing
        onManualTranscriptChange(event.target.value);
     }
  }

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Live Transcription / Manual Entry</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={isListening ? stopRecording : startRecording}
          disabled={disabled || isTranscribing} // Disable button during transcription processing too
          aria-label={isListening ? 'Stop Recording' : 'Start Recording'}
        >
          {isListening ? (
            <MicOff className="text-destructive" />
          ) : isTranscribing ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
             <Mic className="text-primary" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={isListening ? "Listening..." : isTranscribing ? "Processing audio..." : "Start recording or manually enter/edit transcript here..."}
          value={transcriptValue} // Controlled by parent state
          onChange={handleTextareaChange} // Use internal handler
          rows={8}
          className="w-full bg-secondary/30"
          disabled={disabled || isListening || isTranscribing} // Disable text area while listening or processing
          readOnly={isListening || isTranscribing} // Make explicitly read-only during these states
        />
         {(isListening || isTranscribing) && statusMessage && (
             <p className="text-sm text-muted-foreground mt-2">{statusMessage}</p>
         )}
      </CardContent>
    </Card>
  );
}
