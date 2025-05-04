
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Users, WorkflowIcon } from 'lucide-react'; // Correct icon import

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              {/* Replace with your logo or icon */}
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary">MediScribeAI</span>
            </a>
          </div>
          {/* Optional: Add Nav links if needed */}
          {/* <nav className="flex items-center gap-6 text-sm">
             <a href="#about">About</a>
             <a href="#workflow">Workflow</a>
          </nav> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter sm:text-3xl md:text-5xl lg:text-6xl text-primary">
              Revolutionize Clinical Documentation with AI Agents
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              MediScribeAI uses a multi-agent system to automate pre-visit prep, live scribing, and post-visit documentation, freeing clinicians to focus on patient care.
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={onEnterApp} size="lg">
              Select Patient & Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
             {/* Optional: Add a secondary button if needed */}
            {/* <Button variant="outline" size="lg">Learn More</Button> */}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="container space-y-6 bg-secondary py-8 md:py-12 lg:py-24 rounded-lg shadow-inner">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl text-secondary-foreground">About MediScribeAI</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Built for the modern clinical workflow, MediScribeAI leverages cutting-edge AI to reduce administrative burden. Our application integrates seamlessly with simulated EHR data (FHIR-based) to provide a realistic demonstration of an agentic documentation assistant. We prioritize efficiency, accuracy, and user experience, all within a secure, compliant framework (simulated).
            </p>
             <Image
                data-ai-hint="medical team doctors technology"
                src="https://picsum.photos/600/400"
                alt="Medical team using technology"
                width={600}
                height={400}
                className="rounded-lg shadow-md mt-6"
              />
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="container space-y-8 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl text-foreground">How It Works: The Multi-Agent Workflow</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              MediScribeAI employs specialized AI agents collaborating through a defined workflow to handle different stages of clinical documentation.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            {/* Agent Card 1: Pre-Visit */}
            <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md">
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
             </div>
             {/* Agent Card 2: Real-Time Scribe */}
            <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md">
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
             </div>
              {/* Agent Card 3: Documentation */}
            <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
               <div className="flex flex-col justify-between rounded-md">
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
             </div>
          </div>
           <div className="text-center mt-8">
             <p className="text-muted-foreground">These agents work together, passing information contextually to ensure a smooth and efficient documentation process.</p>
            <Image
                data-ai-hint="workflow diagram ai agents"
                src="https://picsum.photos/800/300" // Placeholder for workflow illustration
                alt="Agent Workflow Diagram"
                width={800}
                height={300}
                className="rounded-lg shadow-md mt-6 mx-auto"
              />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <a href="https://ust.com" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 text-primary hover:text-primary/80">Team MediScribe</a> for the Hackathon.
            Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
