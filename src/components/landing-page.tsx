
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Users, WorkflowIcon, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import { motion } from 'framer-motion';
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
    hidden: { opacity: 0, y: 30 }, // Start slightly lower
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Slightly faster stagger
        delayChildren: 0.1,
      },
    },
  };

  const featureCardVariant = {
     hidden: { opacity: 0, scale: 0.95, y: 20 },
     visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }, // Custom ease for smooth pop
  }

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-background text-foreground antialiased", // Added antialiased for smoother fonts
      "overflow-x-hidden" // Prevent horizontal scroll
      )}>

      {/* Header - Minimalist Apple Style */}
       <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center space-x-2">
             <Bot className="h-7 w-7 text-primary" /> {/* Slightly larger icon */}
             <span className="text-xl font-semibold tracking-tight text-foreground">MedScribeAI</span> {/* Cleaner font */}
          </a>
          {/* Minimal Nav - hidden for now */}
          {/* <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
             <a href="#features" className="hover:text-foreground transition-colors">Features</a>
             <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          </nav> */}
           <Button onClick={onEnterApp} size="sm" className="rounded-full px-5"> {/* Rounded button */}
              Launch App
           </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">

        {/* Hero Section - Apple Inspired */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative container mx-auto flex flex-col items-center justify-center gap-8 px-4 pb-16 pt-20 text-center md:pb-24 md:pt-32 lg:py-40 sm:px-6 lg:px-8">
           <motion.div variants={slideUp}>
              {/* Optional: Subtle badge/tagline */}
              {/* <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                 Powered by Generative AI
              </span> */}
           </motion.div>
           <motion.h1
              variants={slideUp}
              className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
              Clinical Documentation, <br className="hidden md:block" /> Reimagined by AI Agents.
           </motion.h1>
           <motion.p
              variants={slideUp}
              className="max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
              MedScribeAI streamlines your workflow with intelligent pre-visit prep, real-time scribing, and automated post-visit summaries. Focus on patients, not paperwork.
           </motion.p>
          <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-4 items-center">
            <Button onClick={onEnterApp} size="lg" className="rounded-full px-8 py-3 text-base">
              Select Patient & Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {/* <Button variant="link" size="lg" className="text-base text-muted-foreground hover:text-foreground">
              Learn More <span aria-hidden="true">→</span>
            </Button> */}
          </motion.div>
            {/* Optional subtle background element */}
           {/* <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-1/2 top-0 h-[50rem] w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-30 blur-3xl" />
           </div> */}
        </motion.section>


        {/* Features Section - Clean Cards */}
         <motion.section
           id="features"
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.2 }}
           variants={staggerContainer}
           className="py-16 md:py-24 lg:py-32 bg-secondary/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                variants={slideUp}
                className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                 <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">Intelligent Automation for Clinicians</h2>
                 <p className="mt-4 text-lg text-muted-foreground">
                    MedScribeAI employs specialized AI agents that work together seamlessly.
                 </p>
              </motion.div>

              <motion.div
                  // variants={staggerContainer} // Removed stagger from here, applying directly to children
                  className="grid grid-cols-1 gap-8 md:grid-cols-3 md:max-w-6xl mx-auto">

                 {/* Feature Card 1: Pre-Visit */}
                 <motion.div
                    variants={featureCardVariant} // Use the new variant
                    className="bg-card p-6 rounded-xl border border-border/70 shadow-sm text-center transition-transform duration-300 ease-out hover:-translate-y-1">
                    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                       <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Pre-Visit Prep</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Automatically summarizes patient history, labs, and notes, highlighting key information before the encounter.
                    </p>
                 </motion.div>

                 {/* Feature Card 2: Real-Time Scribe */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-xl border border-border/70 shadow-sm text-center transition-transform duration-300 ease-out hover:-translate-y-1">
                     <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-cyan-500/10 text-cyan-500">
                       <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Live Listening Agent</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Captures the patient-physician conversation in real-time, transcribing and structuring it accurately.
                    </p>
                 </motion.div>

                  {/* Feature Card 3: Documentation */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-xl border border-border/70 shadow-sm text-center transition-transform duration-300 ease-out hover:-translate-y-1">
                    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-500/10 text-purple-500">
                       <WorkflowIcon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Smart Documentation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Generates complete SOAP notes, suggests relevant billing codes, and prepares everything for EHR submission.
                    </p>
                 </motion.div>
              </motion.div>
            </div>
         </motion.section>

          {/* Workflow/How it Works Section - Simplified */}
         <motion.section
           id="workflow"
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.2 }}
           variants={staggerContainer}
           className="py-16 md:py-24 lg:py-32 bg-background">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <motion.div
                   variants={slideUp}
                   className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">Seamless Agent Collaboration</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       See how our AI agents coordinate to deliver accurate and timely clinical documentation.
                    </p>
                 </motion.div>
                  <motion.div variants={slideUp}>
                     <Image
                        data-ai-hint="clean workflow diagram ai medical"
                        src="https://picsum.photos/1200/400" // Use a wide placeholder
                        alt="MedScribeAI Agent Workflow"
                        width={1200}
                        height={400}
                        className="rounded-xl shadow-lg mx-auto w-full max-w-5xl h-auto border border-border/50" // Cleaner styling
                      />
                  </motion.div>
             </div>
          </motion.section>


        {/* Security/Trust Section - Apple style */}
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="py-16 md:py-24 lg:py-32 bg-secondary/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={slideUp}
                    className="max-w-3xl mx-auto text-center">
                    <ShieldCheck className="h-16 w-16 text-green-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">Built with Security in Mind</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        MedScribeAI operates on simulated data and demonstrates adherence to security best practices, ready for enterprise deployment. (Simulated for hackathon purposes).
                    </p>
                    {/* Optional: Add more points about security/compliance if needed */}
                </motion.div>
            </div>
        </motion.section>


      </main>

      {/* Footer - Minimal */}
      <motion.footer
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true }}
         variants={fadeIn}
         className="py-8 border-t border-border/60 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
           <p>&copy; {new Date().getFullYear()} MedScribeAI Team - UST Hackathon Project.</p>
           <p className="mt-1">Built with Next.js, Tailwind CSS, and Genkit.</p>
            {/* Optional: Links */}
            {/* <div className="mt-4 space-x-4">
               <a href="#" className="hover:text-foreground">Privacy Policy</a>
               <a href="#" className="hover:text-foreground">Terms of Service</a>
            </div> */}
        </div>
      </motion.footer>
    </div>
  );
}


    