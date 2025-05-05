'use server';
/**
 * @fileOverview A chatbot flow using Genkit.
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import { ai } from '@/ai/ai-instance'; // ai instance already configured with default model
import { z } from 'genkit';
import type { GenerateResponse } from 'genkit'; // Import GenerateResponse type

// Define the structure for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']), // 'model' for AI responses
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the input schema: user message and optional history
const ChatInputSchema = z.object({
  message: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).optional().describe('The previous conversation history.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Define the output schema: the AI's response message
const ChatOutputSchema = z.object({
  response: z.string().describe("The assistant's response message."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Exported function to be called by the frontend
export async function chatWithAssistant(input: ChatInput): Promise<ChatOutput> {
  try {
    console.log("[chatWithAssistant] Calling chatbotPrompt with input:", JSON.stringify(input));

    // Call the prompt directly. It returns GenerateResponse.
    const modelResponse: GenerateResponse = await chatbotPrompt(input);
    console.log("[chatWithAssistant] chatbotPrompt raw response:", modelResponse);

    // Extract text using the correct Genkit 1.x syntax (response.text)
    // Ensure the response and text properties exist before accessing.
    const responseText = modelResponse?.text;

    if (responseText === undefined || responseText === null || responseText === '') {
        console.warn("[chatWithAssistant] Received empty, null, or undefined text response from model.");
        // Provide a specific message if the response text is empty/null
        return { response: "Sorry, I couldn't generate a valid text response." };
    }

    // Return the structured output
    console.log("[chatWithAssistant] Successfully generated response:", responseText);
    return { response: responseText };

  } catch (error: unknown) { // Catch unknown to inspect the error type
      // Log the specific error caught for better debugging
      console.error("[chatWithAssistant] Error occurred while calling chatbotPrompt:", error);

      // Check if it's a GenkitError or a standard Error for potentially more details
      let errorMessage = "An error occurred while processing your request.";
      if (error instanceof Error) {
          // Optionally include error name or message for more context, but be careful not to expose sensitive info
          errorMessage = `An error occurred (${error.name}). Please try again later.`;
          console.error("Error Name:", error.name);
          console.error("Error Message:", error.message);
          if (error.stack) {
              console.error("Error Stack:", error.stack);
          }
      }

      // Return a user-friendly error response
      return { response: errorMessage };
      // Do not re-throw unless the caller is prepared to handle it
      // throw error;
  }
}


// Define the prompt - uses history for context and the default model from ai-instance
// REMOVED the processor function (second argument)
const chatbotPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    // No model specified here, it will use the default model ('googleai/gemini-2.0-flash') from ai-instance.ts
    input: {
      schema: ChatInputSchema,
    },
    // Output schema is still defined for documentation/validation if needed elsewhere,
    // but the prompt itself won't automatically format to it without the processor.
    // Genkit aims to return text by default if no output schema processor is used.
    // output: {
    //   schema: ChatOutputSchema,
    // },
    // System message to define the assistant's role
    system: `You are MedScribeAI Assistant, a helpful AI designed to answer questions about the MedScribeAI application, its features, and general medical documentation concepts. Be concise and informative. If you don't know the answer, say so politely. Do not provide medical advice.`,
    // Prompt template using Handlebars - iterates through history and adds the new message
    prompt: `{{#if history}}
{{#each history}}
{{#if (eq role 'user')}}User: {{content}}{{/if}}
{{#if (eq role 'model')}}Assistant: {{content}}{{/if}}
{{/each}}
{{/if}}
User: {{{message}}}
Assistant:`,
  }
  // NO PROCESSOR FUNCTION HERE
);


// Define the Genkit flow - this remains largely unchanged but is less critical now
// as chatWithAssistant calls the prompt directly.
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Call the prompt. It returns GenerateResponse.
    const modelResponse = await chatbotPrompt(input);
    // Extract text and structure the output according to the flow's outputSchema.
    const responseText = modelResponse?.text;
     if (!responseText) {
       console.warn("[chatbotFlow] Received empty, null, or undefined text response from model within flow.");
       return { response: "Sorry, I couldn't generate a response via the flow." };
     }
    return { response: responseText };
  }
);
