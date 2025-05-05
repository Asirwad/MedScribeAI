
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react'; // Import an icon

// Define FAQ data
const faqData = [
  {
    question: "What is MedScribeAI?",
    answer: "MedScribeAI is an ambient AI clinical documentation assistant designed for healthcare providers. It listens to patient encounters, transcribes conversations, generates SOAP notes, and suggests billing codes in real-time, integrating seamlessly into the clinical workflow.",
    value: "item-1",
  },
  {
    question: "How does the multi-agent system work?",
    answer: "MedScribeAI utilizes specialized AI agents: Pre-Visit Agent (summarizes history), Real-Time Listening Agent (transcribes), Documentation Agent (creates notes/codes), EHR Agent (saves data), and a Learning Agent (improves over time). They work together to automate documentation.",
    value: "item-2",
  },
  {
    question: "Is MedScribeAI HIPAA compliant?",
    answer: "This application is a demonstration built for a hackathon using synthetic data. While it simulates compliance principles (e.g., not logging PHI), it has not undergone formal HIPAA certification. Real-world deployment would require rigorous compliance checks.",
    value: "item-3",
  },
  {
    question: "What technologies does MedScribeAI use?",
    answer: "It's built with Next.js (React framework), Tailwind CSS & Shadcn/ui for styling, Firebase for the database (simulated EHR), and Google's Genkit for the AI agent functionalities (LLM interactions, transcription).",
    value: "item-4",
  },
  {
      question: "Can I add my own patients?",
      answer: "Yes! The application allows you to add new patient profiles directly through the sidebar interface. This data is stored in the connected Firebase database.",
      value: "item-5",
  },
];

// Animation variants for the section and items
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function FaqSection() {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible" // Use animate instead of whileInView if it's part of a larger animated section
      className="w-full max-w-2xl lg:max-w-none" // Allow it to take available width
    >
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqData.map((item, index) => (
          <motion.div key={item.value} variants={itemVariants}>
            <AccordionItem
              value={item.value}
              className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden transition-shadow hover:shadow-md" // Styling for each item
            >
              <AccordionTrigger className="flex w-full items-center justify-between p-4 text-left font-medium text-card-foreground hover:bg-accent/10 transition-colors [&[data-state=open]>svg]:rotate-180">
                <span className="flex-1 mr-4">{item.question}</span>
                {/* Chevron is automatically added by the AccordionTrigger component */}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground bg-card/30"> {/* Slightly different background for content */}
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
}
