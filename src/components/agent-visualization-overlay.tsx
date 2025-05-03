
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileText, Stethoscope, BarChart, Save, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentState = 'idle' | 'transcribing' | 'generating_soap' | 'generating_codes' | 'saving' | 'error';

interface AgentVisualizationOverlayProps {
  agentState: AgentState;
}

const stateDetails: Record<AgentState, { icon: React.ElementType; text: string; color: string }> = {
  idle: { icon: Bot, text: 'Agent Idle', color: 'text-muted-foreground' },
  transcribing: { icon: Mic, text: 'Transcribing Audio...', color: 'text-blue-500' },
  generating_soap: { icon: FileText, text: 'Generating SOAP Note...', color: 'text-purple-500' },
  generating_codes: { icon: BarChart, text: 'Suggesting Billing Codes...', color: 'text-green-500' },
  saving: { icon: Save, text: 'Saving Note...', color: 'text-yellow-500' },
  error: { icon: Bot, text: 'Agent Error', color: 'text-destructive' }, // Example error state
};

export function AgentVisualizationOverlay({ agentState }: AgentVisualizationOverlayProps) {
  const { icon: Icon, text, color } = stateDetails[agentState];
  const showOverlay = agentState !== 'idle';

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
  };

  const iconVariants = {
    initial: { scale: 0 },
    animate: { scale: 1, rotate: [0, 10, -10, 0], transition: { type: 'spring', stiffness: 200, damping: 10, delay: 0.1 } },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { delay: 0.3 } },
  };

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          key="agent-overlay"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none", // Make overlay non-interactive
            color
          )}
          aria-live="polite" // Announce changes to screen readers
        >
          <div className="flex flex-col items-center p-8 bg-card rounded-lg shadow-xl border border-border">
             <motion.div variants={iconVariants} initial="initial" animate="animate">
               {agentState === 'transcribing' || agentState === 'generating_soap' || agentState === 'generating_codes' || agentState === 'saving' ? (
                  <Loader2 className="h-16 w-16 animate-spin" />
               ) : (
                  <Icon className="h-16 w-16" />
               )}

             </motion.div>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="mt-4 text-xl font-semibold text-center"
            >
              {text}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
