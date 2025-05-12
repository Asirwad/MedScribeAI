
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contextualChatWithAssistant, type ContextualChatMessage, type ContextualChatInput } from '@/ai/flows/contextual-chatbot-flow'; // Updated import
import { useToast } from '@/hooks/use-toast';

interface UIMessage extends ContextualChatMessage {
  id: string;
}

interface ChatBubbleProps {
  contextType: 'landingPage' | 'dashboard';
  patientDataContext?: string | null; // Optional, only for dashboard
}

export function ChatBubble({ contextType, patientDataContext }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: 'greeting-1', role: 'model', content: 'Hi there! How can I help you today?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = useCallback(async () => {
    const messageText = inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const historyForAI: ContextualChatMessage[] = messages
      .filter(msg => msg.id !== 'greeting-1') // Exclude greeting
      .map(({ role, content }) => ({ role, content }));

    const inputForAI: ContextualChatInput = {
      message: messageText,
      history: historyForAI,
      contextType: contextType,
      patientDataContext: contextType === 'dashboard' ? patientDataContext : undefined,
    };

    console.log("[ChatBubble] Calling contextualChatWithAssistant with input:", JSON.stringify(inputForAI, null, 2));

    try {
      const result = await contextualChatWithAssistant(inputForAI);
      console.log("[ChatBubble] Received result from contextualChatWithAssistant:", JSON.stringify(result, null, 2));

      const assistantMessage: UIMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: result.response,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('[ChatBubble] Error calling contextualChatWithAssistant:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'Sorry, an error occurred.';
      toast({
        title: 'Chatbot Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, messages, toast, contextType, patientDataContext]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                "fixed bottom-24 right-6 z-40",
                "w-[calc(100vw-3rem)] max-w-sm h-[60vh] max-h-[500px]",
                "bg-card border border-border rounded-lg shadow-xl",
                "flex flex-col overflow-hidden"
             )}
          >
             <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">MedScribeAI Assistant</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={toggleChat}>
                   <X className="h-4 w-4" />
                </Button>
             </div>

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
                            "p-2 rounded-lg max-w-[80%] text-sm break-words",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
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

             <div className="p-3 border-t flex items-center gap-2 flex-shrink-0">
                 <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-grow p-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
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
