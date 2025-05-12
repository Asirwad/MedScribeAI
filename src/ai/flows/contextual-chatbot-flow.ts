'use server';

/**
 * @fileOverview Contextual chatbot flow using Genkit (Gemini) for the MedScribeAI Assistant.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance'; // Ensure this uses Gemini

// --- Schemas ---
const ContextualChatMessageSchema = z.object({
  role: z.enum(['user', 'model'] as const),
  content: z.string(),
});
export type ContextualChatMessage = z.infer<typeof ContextualChatMessageSchema>;

const ContextualChatInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
  history: z.array(ContextualChatMessageSchema).optional(),
  contextType: z.enum(['landingPage', 'dashboard'] as const),
  patientDataContext: z.string().optional(),
});
export type ContextualChatInput = z.infer<typeof ContextualChatInputSchema>;

const ContextualChatOutputSchema = z.object({
  response: z.string(),
});
export type ContextualChatOutput = z.infer<typeof ContextualChatOutputSchema>;

// --- System Prompts ---
const landingPageSystemPrompt = `You are MedScribeAI Assistant.

MedScribeAI is an open-source, agentic clinical documentation assistant designed to reduce clinician burnout and improve efficiency by automating the creation of SOAP notes, billing code suggestions, and EHR interactions using a network of LLM-powered agents.

Your role is to provide clear, helpful, and concise explanations about the MedScribeAI application, its capabilities, architecture, and value. You may describe its multi-agent system, including the Pre-Visit Agent, Real-Time Listening Agent, Documentation Agent, EHR Agent, and the planned Learning Agent.

Key features include:
- Automation of SOAP notes and CPT/ICD-10 code generation.
- Real-time transcription and clinical reasoning support.
- Simulation of a FHIR-compliant EHR via Firebase.
- Agent-based modular architecture designed for extensibility.

MedScribeAI is not a medical device and does not provide clinical advice. You should not respond to medical questions, interpret patient data, or simulate diagnoses. If asked, politely explain that you are an AI assistant for the MedScribeAI software and do not provide medical advice.

If a user inquires about technical implementation, you may reference its use of Firestore (as a FHIR-compliant backend), agentic workflows, and LLM orchestration. If a question falls outside the documented functionality or future roadmap, acknowledge this clearly and suggest that more information may become available in future updates.

Remain professional, focused, and aligned with your purpose: to explain how MedScribeAI works and how it supports clinicians through intelligent documentation assistance.`;


const dashboardSystemPromptTemplate = `You are MedScribeAI Assistant, an AI clinical assistant.
You are currently helping a clinician with a specific patient on the MedScribeAI dashboard.
You have access to the following patient information:
<PatientDataContext>
{{{patientDataContext}}}
</PatientDataContext>

Your role is to answer the clinician's questions about this patient's data (history, observations, current SOAP note, etc.) and assist with understanding the generated documentation.
Be accurate and refer to the provided context.
If information is not in the provided context, state that clearly.
Do NOT provide medical advice beyond what is directly inferable from the provided patient data.
Be concise and professional.`;

// --- Retry Utility ---
async function retry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const backoff = delay * Math.pow(2, attempt);
      console.warn(`[contextualChatWithAssistant] Retry #${attempt + 1} after ${backoff}ms due to error:`, err);
      await new Promise(res => setTimeout(res, backoff));
      attempt++;
    }
  }
}

// --- Exported Flow Function ---
export async function contextualChatWithAssistant(
  input: ContextualChatInput
): Promise<ContextualChatOutput> {
  console.log("[contextualChatWithAssistant] Function start. Input:", JSON.stringify(input, null, 2));

  const validationResult = ContextualChatInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("[contextualChatWithAssistant] Invalid input:", validationResult.error);
    return { response: `Invalid input: ${validationResult.error.message}` };
  }
  const validatedInput = validationResult.data;

  let systemPromptText = '';
  let handlebarsArgs: Record<string, string> = {};

  if (validatedInput.contextType === 'landingPage') {
    systemPromptText = landingPageSystemPrompt;
  } else if (validatedInput.contextType === 'dashboard') {
    if (!validatedInput.patientDataContext?.trim()) {
      console.warn("[contextualChatWithAssistant] Missing patientDataContext for dashboard context.");
      return {
        response: "Cannot assist with patient data as it was not provided. Please select a patient.",
      };
    }
    systemPromptText = dashboardSystemPromptTemplate;
    handlebarsArgs.patientDataContext = validatedInput.patientDataContext;
  } else {
    console.error("[contextualChatWithAssistant] Unknown contextType:", validatedInput.contextType);
    return { response: "Internal error: Unknown chat context." };
  }

  // Properly format conversation history for Gemini
  let conversationHistory = '';
  
  // Convert chat history if provided
  if (validatedInput.history && validatedInput.history.length > 0) {
    for (const msg of validatedInput.history) {
      if (!msg.content.trim()) continue;
      const rolePrefix = msg.role === 'user' ? 'User: ' : 'Assistant: ';
      conversationHistory += `${rolePrefix}${msg.content}\n\n`;
    }
  }
  
  // Add latest user message
  conversationHistory += `User: ${validatedInput.message}`;
  
  // Prepare the full prompt with system instructions and conversation history
  let fullPrompt = systemPromptText;
  
  // Handle dashboard context with patient data templating
  if (validatedInput.contextType === 'dashboard') {
    // Replace handlebars templates in system prompt
    const patientDataContext = validatedInput.patientDataContext || '';
    fullPrompt = dashboardSystemPromptTemplate.replace('{{{patientDataContext}}}', patientDataContext);
  }
  
  // Add conversation history
  fullPrompt += `\n\n${conversationHistory}\n\nAssistant:`;

  try {
    console.log("[contextualChatWithAssistant] Invoking ai.generate with prompt:", fullPrompt);

    const modelResponse = await retry(() =>
      ai.generate(fullPrompt)
    );

    const responseText = modelResponse?.text?.trim();
    if (!responseText) {
      console.warn("[contextualChatWithAssistant] Empty response from model.");
      return {
        response: "Sorry, I couldn't generate a response at this time. Please try again.",
      };
    }

    return ContextualChatOutputSchema.parse({ response: responseText });

  } catch (error: unknown) {
    console.error("[contextualChatWithAssistant] Error during ai.generate:", error);
    let message = "An error occurred while processing your request.";
    if (error instanceof Error) {
      message += ` Details: ${error.message}`;
    }
    return { response: message };
  }
}