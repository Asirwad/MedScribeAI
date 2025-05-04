
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Users, WorkflowIcon } from 'lucide-react'; // Correct icon import
import { motion } from 'framer-motion'; // Import motion
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } },
  };

  const slideUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden" // Prevent horizontal scroll
      )}>
      {/* Header */}
       <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-xl items-center px-4 sm:px-6 lg:px-8"> {/* Adjusted max-width and padding */}
          <div className="mr-4 flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              {/* Replace with your logo or icon */}
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary">MedScribeAI</span> {/* Renamed */}
            </a>
          </div>
          {/* Optional: Add Nav links if needed */}
          {/* <nav className="flex items-center gap-6 text-sm">
             <a href="#about">About</a>
             <a href="#workflow">Workflow</a>
          </nav> */}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={slideUp}
          className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 pb-8 pt-10 md:pb-12 md:pt-16 lg:py-32 sm:px-6 lg:px-8"> {/* Added padding */}
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center"> {/* Increased max-width */}
            <motion.h1
              variants={slideUp}
              className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-primary">
              Revolutionize Clinical Documentation with AI Agents
            </motion.h1>
            <motion.p
              variants={slideUp}
              className="max-w-3xl text-lg text-muted-foreground sm:text-xl"> {/* Increased max-width */}
              MedScribeAI uses a multi-agent system to automate pre-visit prep, live scribing, and post-visit documentation, freeing clinicians to focus on patient care. {/* Renamed */}
            </motion.p>
          </div>
          <motion.div variants={slideUp} className="flex gap-4">
            <Button onClick={onEnterApp} size="lg">
              Select Patient & Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
             {/* Optional: Add a secondary button if needed */}
            {/* <Button variant="outline" size="lg">Learn More</Button> */}
          </motion.div>
        </motion.section>

        {/* About Section */}
        <motion.section
          id="about"
          initial="hidden"
          whileInView="visible" // Animate when in view
          viewport={{ once: true, amount: 0.3 }} // Trigger animation once, when 30% visible
          variants={staggerContainer}
          className="container mx-auto space-y-6 bg-secondary py-12 md:py-16 lg:py-24 rounded-lg shadow-inner px-4 sm:px-6 lg:px-8"> {/* Added padding */}
          <div className="mx-auto flex max-w-4xl flex-col items-center space-y-4 text-center"> {/* Increased max-width */}
            <motion.h2 variants={slideUp} className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl text-secondary-foreground">About MedScribeAI</motion.h2> {/* Renamed */}
            <motion.p variants={slideUp} className="max-w-3xl leading-normal text-muted-foreground sm:text-lg sm:leading-7"> {/* Increased max-width */}
              Built for the modern clinical workflow, MedScribeAI leverages cutting-edge AI to reduce administrative burden. Our application integrates seamlessly with simulated EHR data (FHIR-based) to provide a realistic demonstration of an agentic documentation assistant. We prioritize efficiency, accuracy, and user experience, all within a secure, compliant framework (simulated). {/* Renamed */}
            </motion.p>
             <motion.div variants={slideUp}>
                 <Image
                    data-ai-hint="medical team doctors technology"
                    src="https://picsum.photos/600/400"
                    alt="Medical team using technology"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-md mt-6"
                  />
              </motion.div>
          </div>
        </motion.section>

        {/* Workflow Section */}
        <motion.section
          id="workflow"
          initial="hidden"
          whileInView="visible" // Animate when in view
          viewport={{ once: true, amount: 0.2 }} // Trigger animation once, when 20% visible
          variants={staggerContainer}
          className="container mx-auto space-y-8 py-12 md:py-16 lg:py-24 px-4 sm:px-6 lg:px-8"> {/* Added padding */}
          <div className="mx-auto flex max-w-4xl flex-col items-center space-y-4 text-center"> {/* Increased max-width */}
            <motion.h2 variants={slideUp} className="font-bold text-3xl leading-[1.1] sm:text-4xl md:text-5xl text-foreground">How It Works: The Multi-Agent Workflow</motion.h2>
            <motion.p variants={slideUp} className="max-w-3xl leading-normal text-muted-foreground sm:text-lg sm:leading-7"> {/* Increased max-width */}
              MedScribeAI employs specialized AI agents collaborating through a defined workflow to handle different stages of clinical documentation. {/* Renamed */}
            </motion.p>
          </div>
          <motion.div
            variants={staggerContainer} // Stagger children within this div
            className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-5xl md:grid-cols-3"> {/* Increased max-width and gap */}
            {/* Agent Card 1: Pre-Visit */}
            <motion.div
              variants={slideUp}
              className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md h-full"> {/* Ensure consistent height */}
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <Users className="h-6 w-6 text-primary" />
                       <h3 className="font-semibold text-lg text-card-foreground">Pre-Visit Agent</h3>
                    </div>
                   <p className="text-sm text-muted-foreground">
                     Retrieves and summarizes patient history, recent labs, and encounter notes from the EHR before the visit, preparing the clinician.
                   </p>
                 </div>
               </div>
             </motion.div>
             {/* Agent Card 2: Real-Time Scribe */}
            <motion.div
              variants={slideUp}
              className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md h-full">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-6 w-6 text-cyan-500" /> {/* Use Bot or specific scribe icon */}
                       <h3 className="font-semibold text-lg text-card-foreground">Real-Time Listening Agent</h3>
                    </div>
                   <p className="text-sm text-muted-foreground">
                     Actively listens during the encounter, transcribes the conversation in real-time, and structures dialogue into initial note sections.
                   </p>
                 </div>
               </div>
             </motion.div>
              {/* Agent Card 3: Documentation */}
            <motion.div
              variants={slideUp}
              className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md h-full">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <WorkflowIcon className="h-6 w-6 text-purple-500" /> {/* Use Workflow or similar icon */}
                      <h3 className="font-semibold text-lg text-card-foreground">Documentation Agent</h3>
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Compiles the final SOAP note using the transcript and patient context, suggests billing codes, and prepares the note for review and saving.
                   </p>
                 </div>
               </div>
             </motion.div>
          </motion.div>
           <motion.div variants={slideUp} className="text-center mt-8 max-w-4xl mx-auto"> {/* Increased max-width */}
             <p className="text-muted-foreground">These agents work together, passing information contextually to ensure a smooth and efficient documentation process.</p>
            <Image
                data-ai-hint="workflow diagram ai agents"
                src="https://picsum.photos/800/300" // Placeholder for workflow illustration
                alt="Agent Workflow Diagram"
                width={800}
                height={300}
                className="rounded-lg shadow-md mt-6 mx-auto w-full max-w-3xl h-auto" // Make image responsive
              />
          </motion.div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true }}
         variants={fadeIn}
         className="py-6 md:px-8 md:py-0 border-t border-border/40 mt-12"> {/* Added margin-top */}
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 sm:px-6 lg:px-8"> {/* Added padding */}
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <a href="https://ust.com" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 text-primary hover:text-primary/80">Team MedScribe</a> for the Hackathon. {/* Renamed */}
            Powered by AI.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
