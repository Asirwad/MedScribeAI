'use server';
/**
 * @fileOverview A chatbot flow using Genkit (Gemini), Llama (OpenAI SDK), or Llama (Azure SDK) for the MedScribeAI Assistant.
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import { z } from 'zod';
import type { GenerateResponse, MessageData } from 'genkit';
import { ai } from '@/ai/ai-instance';
import { llmProvider } from '@/config/llm-config';
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client';
import { azureLlamaChatCompletion, type AzureChatMessage } from '@/lib/azure-llama-client'; // Import Azure Llama client

// --- Schemas (Shared) ---
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system'] as const),
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
          console.log("[chatWithAssistant] Calling Llama (OpenAI SDK) logic...");
          responseText = await runChatLlamaOpenAI(validatedInput);
      } else if (llmProvider === 'LLAMA_AZURE') {
          console.log("[chatWithAssistant] Calling Llama (Azure SDK) logic...");
          responseText = await runChatLlamaAzure(validatedInput);
      } else {
          throw new Error(`Unsupported LLM provider: ${llmProvider}`);
      }

      if (!responseText || responseText.trim() === '') {
          console.warn("[chatWithAssistant] Received empty or whitespace-only response from provider.");
          return { response: "Sorry, I couldn't generate a valid response." };
      }

      console.log("[chatWithAssistant] Successfully processed request. Returning response:", responseText);
      return ChatOutputSchema.parse({ response: responseText });

    } catch (error: unknown) {
      console.error("[chatWithAssistant] Error processing chat request:", error);
      let errorMessage = "An error occurred while processing your chat request.";
      if (error instanceof Error) {
        if (error.message.includes("API key") || error.message.includes("Authentication")) {
             errorMessage = "There seems to be an issue connecting to the AI service. Please check the configuration.";
        } else if (error.message.includes("Invalid response structure") || error.message.includes("validation failed")) {
             errorMessage = "Received an unexpected response format from the AI. Please try again.";
        } else if (error.message.includes("timeout") || error.message.includes("NetworkError")) {
             errorMessage = "The request to the AI service timed out. Please check your connection and try again.";
        } else {
            errorMessage = `Error: ${error.message}`;
        }
         console.error("  Detailed Error Message:", error.message);
         if (process.env.NODE_ENV === 'development' && error.stack) {
              console.error("  Error Stack:", error.stack);
         }
      } else {
         console.error("  Caught a non-Error exception:", error);
      }
      return { response: errorMessage };
    }
}


// --- Genkit/Gemini Implementation ---
async function runChatGenkit(input: ChatInput): Promise<string> {
    console.log("[runChatGenkit] Preparing messages for Genkit...");
    const messagesForAI: MessageData[] = [{ role: 'system', content: [{ text: systemPrompt }] }];

    if (input.history) {
        input.history.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'model') {
                messagesForAI.push({ role: msg.role, content: [{ text: msg.content }] });
            }
        });
    }
    messagesForAI.push({ role: 'user', content: [{ text: input.message }] });
    
    // System prompt is now part of the messagesForAI array, so `system` field is not needed here.
    const generateArgs = {
        prompt: messagesForAI, 
        // system: systemPrompt, // This is redundant if system message is in prompt
        output: { format: 'text' as const },
    };
    console.log("[runChatGenkit] Calling ai.generate with arguments:", JSON.stringify(generateArgs, null, 2));
    
    const modelResponse: GenerateResponse = await ai.generate(generateArgs);
    console.log("[runChatGenkit] ai.generate response received.");

    const responseText = modelResponse?.text;
    console.log("[runChatGenkit] Extracted text from model response:", responseText);

    if (!responseText?.trim()) {
        console.warn("[runChatGenkit] Received empty or invalid response from model.");
        throw new Error("Genkit model returned an empty response.");
    }
    return responseText;
}


// --- Llama (OpenAI SDK) Implementation ---
async function runChatLlamaOpenAI(input: ChatInput): Promise<string> {
     console.log("[runChatLlamaOpenAI] Preparing messages for Llama (OpenAI SDK)...");
    const messagesForAPI: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];

    if (input.history) {
        input.history.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'model') {
                messagesForAPI.push({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.content
                });
            }
        });
    }
    messagesForAPI.push({ role: 'user', content: input.message });

    console.log("[runChatLlamaOpenAI] Calling Llama client with messages:", JSON.stringify(messagesForAPI, null, 2));
    const responseContent = await llamaChatCompletion(messagesForAPI);
    console.log("[runChatLlamaOpenAI] Received response content from Llama client:", responseContent);

     if (!responseContent) {
        console.error("[runChatLlamaOpenAI] Llama client returned empty content.");
        throw new Error("Llama (OpenAI SDK) model returned empty content.");
     }
    return responseContent;
}

// --- Llama (Azure SDK) Implementation ---
async function runChatLlamaAzure(input: ChatInput): Promise<string> {
    console.log("[runChatLlamaAzure] Preparing messages for Llama (Azure SDK)...");
    const messagesForAPI: AzureChatMessage[] = [{ role: 'system', content: systemPrompt }];

    if (input.history) {
        input.history.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'model') {
                messagesForAPI.push({
                    role: msg.role === 'model' ? 'assistant' : 'user', // Map model to assistant
                    content: msg.content
                });
            }
        });
    }
    messagesForAPI.push({ role: 'user', content: input.message });

    console.log("[runChatLlamaAzure] Calling Azure Llama client with messages:", JSON.stringify(messagesForAPI, null, 2));
    const responseContent = await azureLlamaChatCompletion(messagesForAPI);
    console.log("[runChatLlamaAzure] Received response content from Azure Llama client:", responseContent);

    if (!responseContent) {
        console.error("[runChatLlamaAzure] Azure Llama client returned empty content.");
        throw new Error("Llama (Azure SDK) model returned empty content.");
    }
    return responseContent;
}
