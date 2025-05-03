
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, FileText, BarChart, Save, Mic, Loader2, Database, Search, AlertTriangle } from 'lucide-react'; // Added AlertTriangle for error
import { cn } from '@/lib/utils';

// Updated AgentState to reflect the workflow stages
export type AgentState = 'idle' | 'fetching_data' | 'transcribing' | 'generating_soap' | 'generating_codes' | 'saving' | 'error';

interface AgentVisualizationOverlayProps {
  agentState: AgentState;
}

// Mapping from state to icon, text, and color - represents the CURRENT active step
const currentStateDetails: Record<AgentState, { icon: React.ElementType; text: string; color: string; isLoading: boolean }> = {
  idle: { icon: Bot, text: 'Agent Idle', color: 'text-muted-foreground', isLoading: false },
  fetching_data: { icon: Database, text: 'Pre-Visit: Fetching Patient Data...', color: 'text-blue-500', isLoading: true }, // Blue for fetching
  transcribing: { icon: Mic, text: 'Scribe: Transcribing Audio...', color: 'text-cyan-500', isLoading: true }, // Cyan for transcription
  generating_soap: { icon: FileText, text: 'Docs: Generating SOAP Note...', color: 'text-purple-500', isLoading: true }, // Purple for SOAP
  generating_codes: { icon: BarChart, text: 'Docs: Suggesting Billing Codes...', color: 'text-green-500', isLoading: true }, // Green for codes
  saving: { icon: Save, text: 'EHR: Saving Note...', color: 'text-yellow-500', isLoading: true }, // Yellow for saving
  error: { icon: AlertTriangle, text: 'Agent Error', color: 'text-destructive', isLoading: false }, // Use AlertTriangle for error
};

// Define the sequence of the workflow steps for visualization
const workflowSteps: AgentState[] = [
  'fetching_data',
  'transcribing',
  'generating_soap',
  'generating_codes',
  'saving',
];

// Helper functions to derive Tailwind classes from text colors
// Ensure these classes exist in your Tailwind config or adjust as needed
const getRingColor = (textColorClass: string) => {
    if (textColorClass.includes('blue')) return 'ring-blue-500/50';
    if (textColorClass.includes('cyan')) return 'ring-cyan-500/50';
    if (textColorClass.includes('purple')) return 'ring-purple-500/50';
    if (textColorClass.includes('green')) return 'ring-green-500/50';
    if (textColorClass.includes('yellow')) return 'ring-yellow-500/50';
    return 'ring-primary/50'; // Default ring
}

const getBackgroundColor = (textColorClass: string) => {
     if (textColorClass.includes('blue')) return 'bg-blue-500';
     if (textColorClass.includes('cyan')) return 'bg-cyan-500';
     if (textColorClass.includes('purple')) return 'bg-purple-500';
     if (textColorClass.includes('green')) return 'bg-green-500';
     if (textColorClass.includes('yellow')) return 'bg-yellow-500';
     return 'bg-primary'; // Default background
}


export function AgentVisualizationOverlay({ agentState }: AgentVisualizationOverlayProps) {
  const currentStepDetails = currentStateDetails[agentState];
  const { icon: CurrentIcon, text: currentText, color: currentColor, isLoading: currentIsLoading } = currentStepDetails || currentStateDetails.idle; // Fallback to idle details
  const showOverlay = agentState !== 'idle'; // Show for active steps and error

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  };

  const stepVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const getStepStatus = (step: AgentState): 'completed' | 'active' | 'pending' | 'error' => {
    const currentIndex = workflowSteps.indexOf(agentState);
    const stepIndex = workflowSteps.indexOf(step);

    if (agentState === 'error') return 'error'; // If the whole process errored

    if (currentIndex === -1 && agentState !== 'idle') return 'pending'; // Shouldn't happen often
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
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
             agentState === 'error' ? 'bg-destructive/10' : '' // Slightly tint background on error
          )}
          aria-live="polite" // Announce changes to screen readers
        >
          <div className="flex flex-col items-center p-6 md:p-10 bg-card rounded-xl shadow-2xl border border-border max-w-md w-full">
             <h2 className="text-xl font-semibold mb-6 text-foreground">Agent Workflow</h2>
             <div className="w-full space-y-3">
               {workflowSteps.map((step, index) => {
                 const status = getStepStatus(step);
                 const stepDetails = currentStateDetails[step];
                 if (!stepDetails) return null; // Skip if somehow step details are missing
                 const { icon: StepIcon, text: stepText, color: stepColor } = stepDetails;
                 const isActive = status === 'active';
                 const isCompleted = status === 'completed';
                 const isError = status === 'error'; // Check if this specific step or the process failed

                 return (
                    <motion.div
                        key={step}
                        custom={index}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className={cn(
                            "flex items-center p-3 rounded-lg border transition-all duration-300",
                            isActive ? `border-transparent ring-2 ${getRingColor(stepColor)} bg-card shadow-md` : 'border-border/50',
                            isCompleted ? 'opacity-50 bg-muted/30' : 'opacity-100',
                            isError ? 'border-destructive ring-2 ring-destructive/50 bg-destructive/10' : '' // Error state styling
                        )}
                    >
                        <div className={cn(
                            "flex-shrink-0 mr-3 rounded-full h-8 w-8 flex items-center justify-center transition-colors duration-300",
                            isActive ? getBackgroundColor(stepColor) :
                            isCompleted ? 'bg-muted-foreground/30' :
                            isError ? 'bg-destructive' : // Error icon background
                            'bg-secondary',
                            isActive ? 'text-primary-foreground' :
                            isCompleted ? 'text-muted-foreground' :
                            isError ? 'text-destructive-foreground' : // Error icon color
                            'text-secondary-foreground'
                        )}>
                            {isActive && currentIsLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : isError ? (
                                <AlertTriangle className="h-5 w-5" /> // Show error icon
                            ) : (
                                <StepIcon className="h-5 w-5" />
                            )}
                        </div>
                        <span className={cn(
                            "text-sm font-medium flex-grow",
                             isActive ? `font-semibold ${stepColor}` :
                             isCompleted ? 'text-muted-foreground' :
                             isError ? 'text-destructive font-semibold' : // Error text styling
                             'text-foreground'
                        )}>
                            {/* Show just the action part, or full text on error */}
                            {isError ? stepText : (stepText.split(': ')[1] || stepText)}
                        </span>
                    </motion.div>
                 );
               })}
            </div>
             {/* Display general error message at the bottom if agentState is 'error' */}
             {agentState === 'error' && (
                 <p className="mt-6 text-center text-sm font-medium text-destructive">
                    An error occurred during the process.
                 </p>
             )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
