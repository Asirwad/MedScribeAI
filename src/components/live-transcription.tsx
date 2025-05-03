
'use client';

import React, { useRef, useEffect, useState } from 'react'; // Added useState
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2 } from 'lucide-react'; // Correct icons
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { RecordingOverlay } from '@/components/recording-overlay'; // Import the new overlay

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
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null); // State for start time
  const { toast } = useToast();

  // Function to handle starting recording
  const startRecording = async () => {
    if (isTranscribing || isListening) return; // Don't start if already processing or listening
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Explicitly use webm
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Ensure correct type
        if (audioBlob.size > 0) {
          //  toast({ title: "Recording Stopped", description: "Processing audio..." });
           onAudioBlob(audioBlob); // Send blob to parent
        } else {
            toast({ title: "Recording Stopped", description: "No audio data captured.", variant: "default" }); // Use default variant
        }

        // Stop the tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false); // Update parent state
        setRecordingStartTime(null); // Clear start time
      };

      mediaRecorderRef.current.start();
      setIsListening(true); // Update parent state
      setRecordingStartTime(new Date()); // Set start time
      // toast({ title: "Recording Started", description: "Microphone is active." });

    } catch (err) {
      console.error('Error accessing microphone:', err);
      let description = "Could not access the microphone. Please check permissions.";
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        description = "Microphone access denied. Please allow access in your browser settings.";
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
         description = "No microphone found. Please ensure a microphone is connected and enabled.";
      } else if (err instanceof Error && err.message.includes('mimeType')) {
          description = "Audio recording format (webm) might not be supported by your browser.";
      }
      toast({ title: "Microphone Error", description: description, variant: "destructive" });
      setIsListening(false); // Update parent state
      setRecordingStartTime(null); // Clear start time
    }
  };

  // Function to handle stopping recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Status message set in onstop handler
      toast({ title: "Stopping Recording...", description: "Please wait." }); // Indicate stopping
    }
     // If stopped manually before any data, ensure listening state is updated
     // This might be redundant due to onstop, but ensures state consistency
     if (isListening) {
        setIsListening(false); // Update parent state
        setRecordingStartTime(null); // Clear start time
        // If stream exists but recorder didn't trigger onstop (unlikely)
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
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
     if (isListening) return "Recording in progress... Use the overlay to stop."; // Updated placeholder
     if (isTranscribing) return "Processing audio transcript...";
     return "Start recording or manually enter/edit transcript here...";
   }

  // Determine if the button should be disabled for STARTING actions.
  // Stopping is now handled in the overlay.
  const isStartDisabled = disabled || isListening || isTranscribing;


  return (
    <>
      <Card className="mb-6 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Live Transcription / Manual Entry</CardTitle>
          <Button
            variant={"outline"} // Only start variant needed
            size="icon"
            onClick={startRecording} // Only starts recording
            // Disable starting if other actions are disabled or already listening/transcribing.
            disabled={isStartDisabled}
            aria-label={'Start Recording'}
            className={cn(
              "relative overflow-visible" // Ensure ping animation isn't clipped
            )}
          >
             {isTranscribing ? (
               <Loader2 className="h-4 w-4 animate-spin" /> // Show loader only when transcribing (after stop)
            ) : (
               <Mic className="text-primary h-5 w-5" /> // Show Mic when idle/not listening/not transcribing
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={getPlaceholderText()}
            value={transcriptValue} // Controlled by parent state
            onChange={handleTextareaChange} // Use internal handler
            rows={8}
            className={cn(
               "w-full bg-secondary/30 transition-opacity duration-300",
               isListening ? "opacity-50 cursor-not-allowed" : "opacity-100", // Dim textarea when listening
               isTranscribing ? "opacity-50 cursor-wait" : "opacity-100" // Dim when transcribing
             )}
            // Disable text area if parent disabled, or while listening or transcribing
            disabled={disabled || isListening || isTranscribing}
            readOnly={isListening || isTranscribing} // Make explicitly read-only during these states
          />
        </CardContent>
      </Card>
       {/* Render the overlay and pass the stopRecording function */}
      <RecordingOverlay
        isListening={isListening}
        startTime={recordingStartTime}
        onStopRecording={stopRecording} // Pass the stop function
        />
    </>
  );
}
