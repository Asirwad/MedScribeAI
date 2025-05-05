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
// This function will now call the chatbotFlow
export async function chatWithAssistant(input: ChatInput): Promise<ChatOutput> {
  console.log("[chatWithAssistant] Entered function with input:", JSON.stringify(input, null, 2));
  try {
    // Call the Genkit flow defined below
    console.log("[chatWithAssistant] Calling chatbotFlow...");
    const flowResult = await chatbotFlow(input);
    console.log("[chatWithAssistant] chatbotFlow returned:", JSON.stringify(flowResult, null, 2));

    // Validate the flow result against the expected schema
    const parsedResult = ChatOutputSchema.safeParse(flowResult);
    if (!parsedResult.success) {
        console.error("[chatWithAssistant] Flow result failed schema validation:", parsedResult.error);
        throw new Error("Chatbot flow returned an unexpected data structure.");
    }

     if (!parsedResult.data.response || parsedResult.data.response.trim() === '') {
        console.warn("[chatWithAssistant] Received empty or whitespace-only response from flow.");
        return { response: "Sorry, I couldn't generate a valid response." };
    }

    console.log("[chatWithAssistant] Successfully processed request. Returning response:", parsedResult.data.response);
    return parsedResult.data;

  } catch (error: unknown) {
    console.error("[chatWithAssistant] Error executing chatbotFlow:", error);
    let errorMessage = "An error occurred while processing your chat request.";
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}. Please try again.`;
      console.error("  Error Name:", error.name);
      console.error("  Error Message:", error.message);
      if (error.stack) {
          console.error("  Error Stack:", error.stack);
      }
    } else {
      console.error("  Caught a non-Error exception:", error);
    }
    // Return a user-friendly error response wrapped in the expected schema
    return { response: errorMessage };
  }
}


// Define the Genkit flow - this function orchestrates calling the LLM and formatting the output.
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema, // Flow ensures output matches this schema
  },
  async (input) => {
    console.log("[chatbotFlow] Flow entered with input:", JSON.stringify(input, null, 2));

    try {
      // Manually construct the messages array for ai.generate
      // The structure should be compatible with the underlying model's API.
      // For Gemini, it expects an array of { role: 'user' | 'model', parts: [{ text: '...' }] }
      const messagesForAI: { role: 'user' | 'model'; content: { text: string }[] }[] = [];

      // Add history messages
      if (input.history) {
        input.history.forEach(msg => {
          // Make sure role matches 'user' or 'model'
          if (msg.role === 'user' || msg.role === 'model') {
              messagesForAI.push({
                role: msg.role,
                content: [{ text: msg.content }] // Gemini format: parts is an array
              });
          }
        });
      }

      // Add the current user message
      messagesForAI.push({
        role: 'user',
        content: [{ text: input.message }] // Gemini format
      });

      console.log("[chatbotFlow] Calling ai.generate with messages:", JSON.stringify(messagesForAI, null, 2));

      // Call ai.generate directly
      // Genkit's ai.generate should handle the mapping to the Google AI API format
      const modelResponse = await ai.generate({
        // Use the default model configured in ai-instance.ts ('googleai/gemini-2.0-flash')
        prompt: messagesForAI, // Pass the constructed message history
        system: `You are MedScribeAI Assistant, a helpful AI designed to answer questions about the MedScribeAI application, its features, and general medical documentation concepts. Be concise and informative. If you don't know the answer, say so politely. Do not provide medical advice.`,
        output: { format: 'text' }, // Explicitly request text format
        config: {
            // Potentially add temperature or other generation configs here if needed
            // temperature: 0.7
        },
      });


      console.log("[chatbotFlow] Raw response from ai.generate:", JSON.stringify(modelResponse, null, 2));

      // Extract the text content using the correct Genkit 1.x syntax (response.text)
      const responseText = modelResponse?.text;
      console.log("[chatbotFlow] Extracted text from model response:", responseText);

      // Check if the extracted text is valid
      if (responseText === undefined || responseText === null || responseText.trim() === '') {
        console.warn("[chatbotFlow] Received empty, null, undefined, or whitespace-only text response from model.");
        return { response: "Sorry, I couldn't generate a valid text response." };
      }

      // Structure the output according to the flow's outputSchema.
      console.log("[chatbotFlow] Successfully generated response via flow:", responseText);
      return { response: responseText };

    } catch (error) {
      console.error("[chatbotFlow] Error occurred during flow execution:", error);
      throw error; // Re-throw for the caller (chatWithAssistant) to handle
    }
  }
);

// chatbotPrompt is no longer needed as we use ai.generate directly in the flow
// const chatbotPrompt = ai.definePrompt(...);
