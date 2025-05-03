
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordingOverlayProps {
  isListening: boolean;
  startTime: Date | null;
}

// Helper function to format time duration
const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function RecordingOverlay({ isListening, startTime }: RecordingOverlayProps) {
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
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
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none" // Overlay styling
          )}
          aria-live="polite"
          aria-label="Recording active"
        >
          <div className="flex flex-col items-center p-6 md:p-10 bg-card rounded-xl shadow-2xl border border-border max-w-sm w-full text-center">
            {/* Animated Microphone Icon */}
            <div className="relative mb-4">
               <motion.div
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
               >
                  <Mic className="h-16 w-16 text-primary" />
               </motion.div>
               {/* Pulsating ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary opacity-50"
                    animate={{ scale: [0.8, 1.5], opacity: [0.7, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                 />
            </div>

            {/* Timer */}
            <p className="text-3xl font-mono font-semibold mb-4 text-foreground">
              {elapsedTime}
            </p>

            {/* Disclaimer */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>Enterprise-level data protection enabled.</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
