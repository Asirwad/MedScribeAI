'use server';
/**
 * @fileOverview A chatbot flow using Genkit or Llama for the MedScribeAI Assistant.
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import { z } from 'zod';
import type { GenerateResponse, MessageData } from 'genkit'; // Genkit types
import { ai } from '@/ai/ai-instance'; // Genkit instance
import { llmProvider } from '@/config/llm-config'; // LLM provider config
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client'; // Llama client

// --- Schemas (Shared) ---
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system'] as const), // Allow 'system' role internally if needed
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).optional().describe('The previous conversation history (user and model messages only).'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The assistant's response message."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// --- System Prompt (Shared) ---
const systemPrompt = `You are MedScribeAI Assistant, a helpful AI designed to answer questions about the MedScribeAI application, its features, and general medical documentation concepts. Be concise and informative. If you don't know the answer, say so politely. Do not provide medical advice. Keep responses brief unless asked for details.`;


// --- Exported Function ---
export async function chatWithAssistant(input: ChatInput): Promise<ChatOutput> {
    console.log("[chatWithAssistant] Entered function with input:", JSON.stringify(input, null, 2));

    // Validate input
    const validationResult = ChatInputSchema.safeParse(input);
    if (!validationResult.success) {
      console.error("[chatWithAssistant] Invalid input:", validationResult.error);
      return { response: `Invalid input: ${validationResult.error.message}` };
    }

    const validatedInput = validationResult.data;

    try {
      console.log(`[chatWithAssistant] Using provider: ${llmProvider}`);
      let responseText: string;

      if (llmProvider === 'GEMINI') {
         console.log("[chatWithAssistant] Calling Genkit/Gemini logic...");
         responseText = await runChatGenkit(validatedInput);
      } else if (llmProvider === 'LLAMA') {
          console.log("[chatWithAssistant] Calling Llama logic...");
          responseText = await runChatLlama(validatedInput);
      } else {
          throw new Error(`Unsupported LLM provider: ${llmProvider}`);
      }

      // Basic validation of the response text
      if (!responseText || responseText.trim() === '') {
          console.warn("[chatWithAssistant] Received empty or whitespace-only response from provider.");
          return { response: "Sorry, I couldn't generate a valid response." };
      }

      console.log("[chatWithAssistant] Successfully processed request. Returning response:", responseText);
      // Ensure output matches the schema
      return ChatOutputSchema.parse({ response: responseText });

    } catch (error: unknown) {
      console.error("[chatWithAssistant] Error processing chat request:", error);
      let errorMessage = "An error occurred while processing your chat request.";
      if (error instanceof Error) {
        // Customize error messages based on potential issues
        if (error.message.includes("API key") || error.message.includes("Authentication")) {
             errorMessage = "There seems to be an issue connecting to the AI service. Please check the configuration.";
        } else if (error.message.includes("Invalid response structure") || error.message.includes("validation failed")) {
             errorMessage = "Received an unexpected response format from the AI. Please try again.";
        } else if (error.message.includes("timeout") || error.message.includes("NetworkError")) {
             errorMessage = "The request to the AI service timed out. Please check your connection and try again.";
        } else {
            // Use the error message directly for other cases, but keep it user-friendly
            errorMessage = `Error: ${error.message}`;
        }
         console.error("  Detailed Error Message:", error.message);
         if (process.env.NODE_ENV === 'development' && error.stack) {
              console.error("  Error Stack:", error.stack);
         }
      } else {
         console.error("  Caught a non-Error exception:", error);
      }
      // Return error wrapped in the expected schema
      return { response: errorMessage };
    }
}


// --- Genkit/Gemini Implementation ---
async function runChatGenkit(input: ChatInput): Promise<string> {
    console.log("[runChatGenkit] Preparing messages for Genkit...");

    // 1. Construct messages in the format expected by Genkit (MessageData[])
    const messagesForAI: MessageData[] = [];

    // Add history messages (user and model roles only)
    if (input.history) {
        input.history.forEach(msg => {
            // Filter out any potential system messages from history
            if (msg.role === 'user' || msg.role === 'model') {
                messagesForAI.push({
                    role: msg.role,
                    content: [{ text: msg.content }] // Gemini expects content as an array of parts
                });
            } else {
                console.warn("[runChatGenkit] Skipping unexpected role in history:", msg.role);
            }
        });
    }

    // Add the current user message last
    messagesForAI.push({
        role: 'user',
        content: [{ text: input.message }]
    });

    // 2. Log arguments before calling ai.generate
    const generateArgs = {
        prompt: messagesForAI,
        system: systemPrompt, // Use the shared system prompt
        output: { format: 'text' as const },
    };
    console.log("[runChatGenkit] Calling ai.generate with arguments:", JSON.stringify(generateArgs, null, 2));

    // 3. Call ai.generate
    const modelResponse: GenerateResponse = await ai.generate(generateArgs);
    console.log("[runChatGenkit] ai.generate response received.");

    // 4. Extract and return the text response
    const responseText = modelResponse?.text;
    console.log("[runChatGenkit] Extracted text from model response:", responseText);

    if (!responseText?.trim()) {
        console.warn("[runChatGenkit] Received empty or invalid response from model.");
        throw new Error("Genkit model returned an empty response.");
    }

    return responseText;
}


// --- Llama Implementation ---
async function runChatLlama(input: ChatInput): Promise<string> {
     console.log("[runChatLlama] Preparing messages for Llama...");

    // 1. Construct messages in OpenAI format
    const messagesForAPI: OpenAIMessage[] = [];

    // Add the system prompt first
    messagesForAPI.push({ role: 'system', content: systemPrompt });

    // Add history messages (user and assistant roles)
    if (input.history) {
        input.history.forEach(msg => {
            // Map 'model' role to 'assistant' for OpenAI compatibility
            if (msg.role === 'user' || msg.role === 'model') {
                messagesForAPI.push({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.content
                });
            } else {
                 console.warn("[runChatLlama] Skipping unexpected role in history:", msg.role);
            }
        });
    }

    // Add the current user message last
    messagesForAPI.push({ role: 'user', content: input.message });

     console.log("[runChatLlama] Calling Llama client with messages:", JSON.stringify(messagesForAPI, null, 2));

    // 2. Call the Llama client function
    const responseContent = await llamaChatCompletion(messagesForAPI);
    console.log("[runChatLlama] Received response content from Llama client:", responseContent);

     if (!responseContent) {
        console.error("[runChatLlama] Llama client returned empty content.");
        throw new Error("Llama model returned empty content.");
     }

    // 3. Return the response content
    return responseContent;
}
