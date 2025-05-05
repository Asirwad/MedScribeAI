
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.5, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, scale: 0.5, y: 50, transition: { duration: 0.2 } },
  };

  const chatWindowVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  };


  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        key="chat-bubble-fab"
      >
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          onClick={toggleChat}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
               <motion.div
                   key="close-icon"
                   initial={{ rotate: -90, scale: 0 }}
                   animate={{ rotate: 0, scale: 1 }}
                   exit={{ rotate: 90, scale: 0 }}
                   transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
               </motion.div>
            ) : (
               <motion.div
                  key="chat-icon"
                  initial={{ rotate: 90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: -90, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                   <MessageSquare className="h-6 w-6" />
                </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                "fixed bottom-24 right-6 z-40", // Position above the FAB
                "w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[500px]", // Sizing
                "bg-card border border-border rounded-lg shadow-xl",
                "flex flex-col overflow-hidden"
             )}
          >
             {/* Header */}
             <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <h3 className="text-sm font-semibold text-foreground">MedScribeAI Assistant</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleChat}>
                   <X className="h-4 w-4" />
                </Button>
             </div>

              {/* Chat Content Area (Placeholder) */}
              <div className="flex-grow p-4 flex items-center justify-center text-center text-muted-foreground text-sm">
                <p>Chatbot functionality coming soon!</p>
                 {/* Example message structure */}
                {/* <div className="space-y-4 overflow-y-auto">
                    <div className="flex justify-start">
                        <div className="bg-muted p-2 rounded-lg max-w-[80%]">
                            Hi there! How can I help you with MedScribeAI today?
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground p-2 rounded-lg max-w-[80%]">
                            Tell me about the features.
                        </div>
                    </div>
                 </div> */}
             </div>

             {/* Input Area (Placeholder) */}
             <div className="p-3 border-t">
                 <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full p-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    disabled // Disable input for now
                  />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

