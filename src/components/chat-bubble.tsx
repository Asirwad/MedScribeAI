
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'; // Added Send, Loader2
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { chatWithAssistant, type ChatMessage } from '@/ai/flows/chatbot-flow'; // Import the flow and types
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define message type for internal state management
interface UIMessage extends ChatMessage {
  id: string; // Add unique ID for list rendering
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([ // Initialize with a greeting
     { id: 'greeting-1', role: 'model', content: 'Hi there! How can I help you with MedScribeAI today?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset input and maybe history when closing? Optional.
    // if (isOpen) {
    //   setInputValue('');
    // }
  };

   // Scroll to bottom whenever messages change
   useEffect(() => {
     if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
     }
   }, [messages]);

   // Focus input when chat opens
   useEffect(() => {
     if (isOpen && inputRef.current) {
       inputRef.current.focus();
     }
   }, [isOpen]);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

   // Function to handle sending a message
   const handleSendMessage = useCallback(async () => {
     const messageText = inputValue.trim();
     if (!messageText || isLoading) return;

     // Add user message to UI immediately
     const userMessage: UIMessage = {
       id: `user-${Date.now()}`,
       role: 'user',
       content: messageText,
     };
     setMessages(prev => [...prev, userMessage]);
     setInputValue(''); // Clear input field
     setIsLoading(true); // Set loading state

     // Prepare history for the AI (exclude IDs)
     const historyForAI: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
       // Also include the user message we just added to the UI in the history sent to AI
      historyForAI.push({ role: 'user', content: messageText });

      const inputForAI: Parameters<typeof chatWithAssistant>[0] = {
          message: messageText,
          history: historyForAI, // Send previous messages + current user message
      };

     // Log before calling the server action
     console.log("[ChatBubble] Calling chatWithAssistant with input:", JSON.stringify(inputForAI, null, 2));

     try {
        // Call the Genkit flow (server action)
       const result = await chatWithAssistant(inputForAI);

        // Log the result received from the server action
        console.log("[ChatBubble] Received result from chatWithAssistant:", JSON.stringify(result, null, 2));

        // Add AI response to UI
       const assistantMessage: UIMessage = {
         id: `model-${Date.now()}`,
         role: 'model',
         content: result.response, // Assuming result has a 'response' property
       };
       setMessages(prev => [...prev, assistantMessage]);

     } catch (error) {
       console.error('[ChatBubble] Error calling chatWithAssistant:', error);
       toast({
         title: 'Chatbot Error',
         description: 'Sorry, I encountered an issue communicating with the assistant. Please try again later.',
         variant: 'destructive',
       });
        // Optionally add an error message to the chat UI
        setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', content: 'Sorry, I had trouble connecting. Please try again.' }]);
     } finally {
       setIsLoading(false); // Reset loading state
       // Refocus input after response (or error)
       inputRef.current?.focus();
     }
   }, [inputValue, isLoading, messages, toast]); // Added dependencies


  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default form submission/newline
      handleSendMessage();
    }
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
             <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">MedScribeAI Assistant</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleChat}>
                   <X className="h-4 w-4" />
                </Button>
             </div>

              {/* Chat Content Area */}
               <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg max-w-[80%] text-sm",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                     {/* Optional: Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted p-2 rounded-lg max-w-[80%] text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                  </div>
               </ScrollArea>


             {/* Input Area */}
             <div className="p-3 border-t flex items-center gap-2 flex-shrink-0">
                 <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} // Add keydown handler
                    className="flex-grow p-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    disabled={isLoading} // Disable input when loading
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()} // Disable if loading or input empty
                    className="w-9 h-9"
                  >
                    {isLoading ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                         <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send</span>
                  </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
