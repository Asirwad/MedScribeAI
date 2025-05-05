
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Mic, FileText, CheckCircle, Zap, ShieldCheck } from 'lucide-react'; // Added relevant icons
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatBubble } from '@/components/chat-bubble'; // Import the ChatBubble component

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
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

   const slideInLeft = {
     hidden: { opacity: 0, x: -50 },
     visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
   };

   const slideInRight = {
     hidden: { opacity: 0, x: 50 },
     visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
   };


  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const featureCardVariant = {
     hidden: { opacity: 0, scale: 0.95, y: 20 },
     visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-background text-foreground antialiased",
      "overflow-x-hidden"
      )}>

      {/* Header - Minimalist Style inspired by ScribeMD */}
       <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
           {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
             <Bot className="h-7 w-7 text-primary" />
             <span className="text-xl font-bold tracking-tight text-foreground">MedScribeAI</span> {/* Bold weight */}
          </a>
           {/* Navigation (Optional) */}
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              {/* <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#workflow" className="hover:text-foreground transition-colors">How it Works</a> */}
              {/* <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a> */}
           </nav>
           {/* CTA Button */}
           <Button onClick={onEnterApp} size="sm" className="rounded-md px-5"> {/* Slightly less rounded */}
              Launch App
           </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">

        {/* Hero Section - Side-by-side on desktop, centered */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          // Adjusted flex direction for responsiveness
          className="relative container mx-auto flex flex-col md:flex-row items-center justify-center gap-12 px-4 py-20 text-center md:text-left md:py-28 lg:py-36 sm:px-6 lg:px-8">

          {/* Text Content - Left side on desktop */}
           <motion.div
              variants={slideInLeft} // Use slideInLeft for text
              className="max-w-xl space-y-6 md:w-1/2 lg:w-2/5"> {/* Controlled width */}
             {/* Optional: Badge */}
             <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary mb-4 dark:bg-blue-900/30 dark:text-blue-300">
                Ambient AI Medical Scribe
             </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl text-foreground">
              Focus on Patients, <br className="hidden sm:block"/> Not on Your Keyboard.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg md:text-xl"> {/* Paragraph aligned left on desktop */}
               MedScribeAI uses ambient AI to listen, transcribe, and generate accurate clinical notes in real-time, directly integrated with your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"> {/* Buttons aligned left on desktop */}
              <Button onClick={onEnterApp} size="lg" className="rounded-md px-8 py-3 text-base">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {/* <Button variant="outline" size="lg" className="rounded-md px-8 py-3 text-base border-input hover:bg-accent">
                Request a Demo
              </Button> */}
            </div>
             {/* Optional: Trust indicators */}
             <div className="pt-1 text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-2"> {/* Indicators aligned left on desktop */}
               <ShieldCheck className="h-4 w-4 text-green-600" />
               <span>HIPAA Compliant (Simulated)</span>
             </div>
          </motion.div>

          {/* Image/Illustration - Right side on desktop */}
           <motion.div
              variants={slideInRight} // Use slideInRight for image
              className="w-full md:w-1/2 lg:w-2/5 mt-10 md:mt-0"> {/* Controlled width, removed top margin on desktop */}
             <Image
               data-ai-hint="doctor patient interaction modern illustration medical ai"
               src="https://www.scribemd.ai/assets/new_hero-86ac943aebdbd5be8d6318cf384a04b227882cca5e3243bae78aacb277050800.svg" // Placeholder image
               alt="MedScribeAI in action"
               width={450} // Slightly increased width for side-by-side
               height={338} // Adjusted height proportionally
               className="rounded-lg shadow-none mx-auto w-full max-w-md h-auto border border-border/20" // Adjusted max-width
               priority
             />
           </motion.div>

            {/* Optional subtle background gradient remains */}
            {/* <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-1/3 top-0 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-20 blur-3xl" />
            </div> */}
        </motion.section>


        {/* Features Section - Clean Cards */}
         <motion.section
           id="features"
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.2 }}
           variants={staggerContainer}
           className="py-16 md:py-24 lg:py-32 bg-secondary/40 dark:bg-secondary/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                variants={slideUp}
                className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                 <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">Why Clinicians Choose MedScribeAI</h2>
                 <p className="mt-4 text-lg text-muted-foreground">
                    Streamline documentation, reduce burnout, and improve patient care with our intelligent agent workflow.
                 </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 md:max-w-6xl mx-auto">

                 {/* Feature Card 1: Ambient Listening */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-2">
                       <Mic className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Ambient AI Scribing</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      Our Real-Time Listening Agent passively captures the natural conversation during visits, eliminating manual note-taking.
                    </p>
                 </motion.div>

                 {/* Feature Card 2: Real-time Notes */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-2">
                       <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Instant SOAP Notes</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      The Documentation Agent instantly transforms conversations into structured, accurate SOAP notes, ready for review.
                    </p>
                 </motion.div>

                  {/* Feature Card 3: Billing Codes */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-2">
                       <CheckCircle className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Accurate Billing Codes</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      Automatically suggests relevant CPT and ICD-10 codes based on the encounter, reducing coding errors.
                    </p>
                 </motion.div>

                 {/* Feature Card 4: Pre-Visit Prep */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 mb-2">
                       <Zap className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Intelligent Pre-Visit Prep</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                       Our Pre-Visit Agent summarizes patient history and highlights key information, saving you valuable prep time.
                    </p>
                 </motion.div>

                 {/* Feature Card 5: EHR Integration */}
                  <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-2">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M10.5 4.45A7 7 0 1 0 17.5 19h-7"/></svg> {/* Custom EHR/Cloud icon */}
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Seamless EHR Integration</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                       The EHR Agent ensures notes, observations, and encounters are accurately saved back to the patient record (via FHIR simulation).
                    </p>
                 </motion.div>

                  {/* Feature Card 6: Security */}
                 <motion.div
                    variants={featureCardVariant}
                    className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                     <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 mb-2">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground">Secure & Compliant</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                       Built with security best practices. All data shown is synthetic for demonstration purposes.
                    </p>
                 </motion.div>
              </div>
            </div>
         </motion.section>

          {/* Workflow/How it Works Section - Simplified Image */}
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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">How MedScribeAI Works</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       Our multi-agent system collaborates seamlessly behind the scenes.
                    </p>
                 </motion.div>
                  <motion.div variants={slideUp}>
                     <Image
                        data-ai-hint="clean workflow diagram ai medical agent based system"
                        src="https://picsum.photos/1200/500" // Use a wide placeholder
                        alt="MedScribeAI Agent Workflow Diagram"
                        width={1200}
                        height={500}
                        className="rounded-xl shadow-lg mx-auto w-full max-w-5xl h-auto border border-border/30"
                      />
                  </motion.div>
             </div>
          </motion.section>


        {/* Final CTA Section */}
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
            className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/30 to-background dark:from-secondary/10 dark:to-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h2
                    variants={slideUp}
                    className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-6">
                    Ready to Transform Your Documentation?
                </motion.h2>
                <motion.p
                   variants={slideUp}
                   className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                   Experience the efficiency and accuracy of AI-powered clinical documentation. Launch the app and see the difference.
                </motion.p>
                <motion.div variants={slideUp}>
                    <Button onClick={onEnterApp} size="lg" className="rounded-md px-10 py-3 text-lg">
                        Launch MedScribeAI
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
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
         className="py-8 border-t border-border/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
           <p>&copy; {new Date().getFullYear()} MedScribeAI Team - UST Hackathon Project.</p>
           <p className="mt-1">Built with Next.js, Tailwind CSS, Shadcn/ui, Firebase, and Genkit.</p>
        </div>
      </motion.footer>

      {/* Chat Bubble */}
      <ChatBubble />
    </div>
  );
}
