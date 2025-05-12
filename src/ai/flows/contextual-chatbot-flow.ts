'use server';
/**
 * @fileOverview A contextual chatbot flow using Genkit (Gemini) for the MedScribeAI Assistant.
 * This chatbot's behavior and knowledge adapt based on whether it's on the landing page or the main dashboard with patient data.
 *
 * - contextualChatWithAssistant - Handles chatbot interaction with context.
 * - ContextualChatMessage - Represents a single message in the chat history.
 * - ContextualChatInput - Input type for contextualChatWithAssistant.
 * - ContextualChatOutput - Output type for contextualChatWithAssistant.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance'; // Ensure this uses Gemini
import type { MessageData } from 'genkit';

// --- Schemas ---
const ContextualChatMessageSchema = z.object({
  role: z.enum(['user', 'model'] as const), // System prompts are handled internally by the flow
  content: z.string(),
});
export type ContextualChatMessage = z.infer<typeof ContextualChatMessageSchema>;

const ContextualChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(ContextualChatMessageSchema).optional().describe('The previous conversation history (user and model messages only).'),
  contextType: z.enum(['landingPage', 'dashboard'] as const).describe("The context in which the chat is occurring."),
  patientDataContext: z.string().optional().describe("Serialized patient data including history, observations, and SOAP note. Only provided when contextType is 'dashboard'."),
});
export type ContextualChatInput = z.infer<typeof ContextualChatInputSchema>;

const ContextualChatOutputSchema = z.object({
  response: z.string().describe("The assistant's response message."),
});
export type ContextualChatOutput = z.infer<typeof ContextualChatOutputSchema>;

// --- System Prompts ---
const landingPageSystemPrompt = `You are MedScribeAI Assistant.
Your primary role is to provide helpful and concise information about the MedScribeAI application, its features, how it works (e.g., its multi-agent system), and general concepts related to AI in medical documentation.
Do NOT ask for or discuss specific patient information.
If asked about medical advice, politely decline and state you are an AI assistant for the application.
Keep responses informative and to the point. If you don't know an answer, say so.
Do not break character. You are a friendly and professional assistant for the MedScribeAI software.`;

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


// --- Exported Flow Function ---
export async function contextualChatWithAssistant(input: ContextualChatInput): Promise<ContextualChatOutput> {
  console.log("[contextualChatWithAssistant] Entered function with input:", JSON.stringify(input, null, 2));

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
    if (!validatedInput.patientDataContext) {
      console.warn("[contextualChatWithAssistant] Dashboard context selected but patientDataContext is missing.");
      return { response: "Cannot assist with patient data as it was not provided. Please select a patient." };
    }
    systemPromptText = dashboardSystemPromptTemplate;
    handlebarsArgs.patientDataContext = validatedInput.patientDataContext;
  } else {
    console.error("[contextualChatWithAssistant] Unknown contextType:", validatedInput.contextType);
    return { response: "Internal error: Unknown chat context." };
  }

  console.log("[contextualChatWithAssistant] Using system prompt (template for dashboard):", systemPromptText.substring(0, 100) + "...");
  if (Object.keys(handlebarsArgs).length > 0) {
    console.log("[contextualChatWithAssistant] Handlebars arguments:", handlebarsArgs);
  }


  try {
    const messagesForAI: MessageData[] = [];
    if (validatedInput.history) {
      validatedInput.history.forEach(msg => {
        messagesForAI.push({ role: msg.role, content: [{ text: msg.content }] });
      });
    }
    messagesForAI.push({ role: 'user', content: [{ text: validatedInput.message }] });
    
    console.log("[contextualChatWithAssistant] Calling ai.generate with constructed messages and system prompt.");
    
    const modelResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest', // Explicitly use gemini-1.5-flash-latest
      prompt: messagesForAI, 
      system: systemPromptText,
      templateArgs: handlebarsArgs, 
      output: { format: 'text' }, 
    });

    const responseText = modelResponse.text; 
    console.log("[contextualChatWithAssistant] ai.generate response received. Text:", responseText);

    if (!responseText?.trim()) {
      console.warn("[contextualChatWithAssistant] Received empty or invalid response from model.");
      return { response: "Sorry, I couldn't generate a response at this time. Please try again."};
    }

    return ContextualChatOutputSchema.parse({ response: responseText });

  } catch (error: unknown) {
    console.error("[contextualChatWithAssistant] Error processing chat request:", error);
    let errorMessage = "An error occurred while processing your chat request with the assistant.";
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }
    return { response: errorMessage };
  }
}