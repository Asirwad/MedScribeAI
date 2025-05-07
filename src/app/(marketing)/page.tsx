
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button'; // Adjusted path
import { ArrowRight, Bot, Mic, FileText, CheckCircle, Zap, ShieldCheck, HelpCircle } from 'lucide-react'; // Added HelpCircle
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils'; // Path remains the same
import { ChatBubble } from '@/components/chat-bubble'; // Adjusted path
import { FaqSection } from '@/components/faq-section'; // Adjusted path
import { useRouter } from 'next/navigation'; // Import useRouter

// Removed LandingPageProps as this is now the default export of the page

export default function LandingPage() {
  const router = useRouter(); // Initialize router
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8 } }, };
  const slideUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }, };
  const slideInLeft = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } }, };
  const slideInRight = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } }, };
  const staggerContainer = { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1, }, }, };
  const featureCardVariant = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }, }

  const handleEnterApp = () => {
      router.push('/dashboard'); // Navigate to the dashboard route
  };

  return (
    <div ref={targetRef} className={cn(
      "flex flex-col min-h-screen bg-background text-foreground antialiased",
      "overflow-x-hidden"
      )}>

       {/* Header */}
       <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center space-x-2">
             <svg className="h-7 w-7 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
             <span className="text-xl font-bold tracking-tight text-foreground">MedScribeAI</span>
          </a>
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              {/* Links */}
           </nav>
           <Button onClick={handleEnterApp} size="sm" className="rounded-md px-5">
              Launch App
           </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">

        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative container mx-auto flex flex-col md:flex-row items-center justify-center gap-12 px-4 py-20 text-center md:text-left md:py-24 lg:py-28 sm:px-6 lg:px-8">

           <motion.div
              variants={slideInLeft}
              style={{ opacity: textOpacity }}
              className="max-w-xl space-y-6 md:w-1/2 lg:w-2/5">
             <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary mb-4 dark:bg-blue-900/30 dark:text-blue-300">
                Ambient AI Medical Scribe
             </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl text-foreground">
              Focus on Patients, <br className="hidden sm:block"/> Not on Your Keyboard.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg md:text-xl">
               MedScribeAI uses ambient AI to listen, transcribe, and generate accurate clinical notes in real-time, directly integrated with your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button onClick={handleEnterApp} size="lg" className="rounded-md px-8 py-3 text-base">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
             <div className="pt-1 text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-2">
               <ShieldCheck className="h-4 w-4 text-green-600" />
               <span>HIPAA Compliant (Simulated)</span>
             </div>
          </motion.div>

           <motion.div
              variants={slideInRight}
              style={{ y: imageY }}
              className="w-full md:w-1/2 lg:w-2/5 mt-10 md:mt-0">
             <Image
               data-ai-hint="doctor patient interaction modern illustration medical ai"
               src="https://www.scribemd.ai/assets/new_hero-86ac943aebdbd5be8d6318cf384a04b227882cca5e3243bae78aacb277050800.svg" // Placeholder image
               alt="MedScribeAI in action"
               width={450}
               height={338}
               className="rounded-lg shadow-none mx-auto w-full max-w-md h-auto border border-border/20"
               priority
             />
           </motion.div>
        </motion.section>


        {/* Features Section */}
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
                 {/* Feature Cards */}
                 <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-2"><Mic className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Ambient AI Scribing</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Captures conversation passively, eliminating manual note-taking.</p>
                 </motion.div>
                 <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                     <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-2"><FileText className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Instant SOAP Notes</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Transforms conversations into structured notes ready for review.</p>
                 </motion.div>
                 <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                     <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-2"><CheckCircle className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Accurate Billing Codes</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Suggests relevant CPT/ICD-10 codes based on the encounter.</p>
                 </motion.div>
                 <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 mb-2"><Zap className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Intelligent Pre-Visit Prep</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Summarizes history and highlights key info, saving prep time.</p>
                 </motion.div>
                  <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M10.5 4.45A7 7 0 1 0 17.5 19h-7"/></svg></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Seamless EHR Integration</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Saves notes/data accurately to the patient record (FHIR simulation).</p>
                 </motion.div>
                  <motion.div variants={featureCardVariant} className="bg-card p-6 rounded-lg border border-border/50 shadow-sm text-left flex flex-col gap-3 transition-shadow hover:shadow-md">
                     <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 mb-2"><ShieldCheck className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-lg text-card-foreground">Secure & Compliant</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">Built with security best practices. Uses synthetic data.</p>
                 </motion.div>
              </div>
            </div>
         </motion.section>

          {/* Workflow Section */}
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
                        src="https://picsum.photos/1200/500" // Placeholder
                        alt="MedScribeAI Agent Workflow Diagram"
                        width={1200}
                        height={500}
                        className="rounded-xl shadow-lg mx-auto w-full max-w-5xl h-auto border border-border/30"
                      />
                  </motion.div>
             </div>
          </motion.section>


        {/* Final CTA & FAQ Section */}
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/30 to-background dark:from-secondary/10 dark:to-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                {/* CTA Content */}
                <motion.div
                  variants={slideInLeft}
                  className="text-center lg:text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl mb-6">
                        Ready to Transform Your Documentation?
                    </h2>
                    <p className="max-w-2xl mx-auto lg:mx-0 text-lg text-muted-foreground mb-8">
                       Experience the efficiency and accuracy of AI-powered clinical documentation. Launch the app and see the difference.
                    </p>
                    <div>
                        <Button onClick={handleEnterApp} size="lg" className="rounded-md px-10 py-3 text-lg">
                            Launch MedScribeAI
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* FAQ Section */}
                <motion.div variants={slideInRight}>
                   <FaqSection />
                </motion.div>
            </div>
        </motion.section>

      </main>

      {/* Footer */}
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
