
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ShieldCheck, StopCircle } from 'lucide-react'; // Added StopCircle
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Import Button

interface RecordingOverlayProps {
  isListening: boolean;
  startTime: Date | null;
  onStopRecording: () => void; // Add callback prop
}

// Helper function to format time duration
const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function RecordingOverlay({ isListening, startTime, onStopRecording }: RecordingOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isListening && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = now.getTime() - startTime.getTime();
        setElapsedTime(formatDuration(duration));
      }, 1000); // Update every second
    } else {
      setElapsedTime('00:00'); // Reset when not listening
    }

    // Cleanup interval on component unmount or when listening stops
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isListening, startTime]);

  const overlayVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 }, // Start slightly below and smaller
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.3, ease: 'easeOut' } }, // Exit downwards
  };


  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          key="recording-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 p-4 pointer-events-none" // Position at the bottom
          )}
          aria-live="polite"
          aria-label="Recording active"
        >
          <div className="max-w-lg mx-auto bg-card rounded-xl shadow-2xl border border-border p-4 pointer-events-auto flex items-center justify-between gap-4"> {/* Make card interactive */}
             {/* Left Section: Icon and Timer */}
             <div className="flex items-center gap-3">
               {/* Animated Microphone Icon */}
                <div className="relative flex-shrink-0">
                   <motion.div
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   >
                      <Mic className="h-8 w-8 text-primary" />
                   </motion.div>
                   {/* Pulsating ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary opacity-50"
                        animate={{ scale: [0.8, 1.3], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                     />
                </div>
                 {/* Timer */}
                <p className="text-xl font-mono font-semibold text-foreground tabular-nums">
                  {elapsedTime}
                </p>
             </div>

             {/* Middle Section: Disclaimer */}
             <div className="hidden md:flex items-center justify-center gap-2 text-xs text-muted-foreground flex-grow text-center">
               <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
               <span>Enterprise-level data protection enabled.</span>
             </div>

             {/* Right Section: Stop Button */}
             <Button
                 variant="destructive"
                 size="lg" // Make button more prominent
                 onClick={onStopRecording} // Call the passed function
                 className="flex-shrink-0" // Prevent button from shrinking too much
                 aria-label="Stop Recording"
             >
                 <StopCircle className="mr-2 h-5 w-5" />
                 Stop
             </Button>

          </div>
          {/* Disclaimer on mobile (below the main bar) */}
           <div className="md:hidden text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
               <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
               <span>Data protection enabled</span>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
