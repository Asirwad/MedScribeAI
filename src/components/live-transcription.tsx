'use client';

import React, { useRef, useEffect } from 'react'; // Removed useState
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveTranscriptionProps {
  onManualTranscriptChange: (transcript: string) => void;
  onAudioBlob: (blob: Blob) => void;
  isTranscribing: boolean; // Receive transcribing state from parent
  transcriptValue: string; // Receive transcript value from parent
  disabled?: boolean; // Overall disable flag from parent
  isListening: boolean; // Receive listening state from parent
  setIsListening: (listening: boolean) => void; // Function to update listening state in parent
}

export function LiveTranscription({
  onManualTranscriptChange,
  onAudioBlob,
  isTranscribing,
  transcriptValue,
  disabled = false,
  isListening, // Use prop
  setIsListening, // Use prop
}: LiveTranscriptionProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  // Removed internal statusMessage state, rely on isListening/isTranscribing

  // Function to handle starting recording
  const startRecording = async () => {
    if (isTranscribing || isListening) return; // Don't start if already processing or listening
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
           toast({ title: "Recording Stopped", description: "Processing audio..." });
           onAudioBlob(audioBlob); // Send blob to parent
        } else {
            toast({ title: "Recording Stopped", description: "No audio data captured.", variant: "destructive" });
        }

        // Stop the tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false); // Update parent state
      };

      mediaRecorderRef.current.start();
      setIsListening(true); // Update parent state
      toast({ title: "Recording Started", description: "Microphone is active." });

    } catch (err) {
      console.error('Error accessing microphone:', err);
      let description = "Could not access the microphone. Please check permissions.";
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        description = "Microphone access denied. Please allow access in your browser settings.";
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
         description = "No microphone found. Please ensure a microphone is connected and enabled.";
      }
      toast({ title: "Microphone Error", description: description, variant: "destructive" });
      setIsListening(false); // Update parent state
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
        setIsListening(false); // Update parent state
     }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
         // Also ensure tracks are stopped if recorder existed
         mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
     if (!isListening && !isTranscribing) { // Only allow manual changes when not recording or processing
        onManualTranscriptChange(event.target.value);
     }
  }

   const getPlaceholderText = () => {
     if (isListening) return "Listening...";
     if (isTranscribing) return "Processing audio...";
     return "Start recording or manually enter/edit transcript here...";
   }

   const getStatusText = () => {
      if (isListening) return "Listening...";
      if (isTranscribing) return "Processing audio...";
      return null;
   }

   const statusText = getStatusText();


  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Live Transcription / Manual Entry</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={isListening ? stopRecording : startRecording}
          disabled={disabled || isTranscribing} // Disable button if parent says disabled OR if currently processing audio
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
          placeholder={getPlaceholderText()}
          value={transcriptValue} // Controlled by parent state
          onChange={handleTextareaChange} // Use internal handler
          rows={8}
          className="w-full bg-secondary/30"
          disabled={disabled || isListening || isTranscribing} // Disable text area while listening or processing or if parent disabled
          readOnly={isListening || isTranscribing} // Make explicitly read-only during these states
        />
         {statusText && (
             <p className="text-sm text-muted-foreground mt-2">{statusText}</p>
         )}
      </CardContent>
    </Card>
  );
}