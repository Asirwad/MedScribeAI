'use server';
/**
 * @fileOverview A chatbot flow using Genkit for the MedScribeAI Assistant.
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import { ai } from '@/ai/ai-instance'; // ai instance already configured with default model
import { z } from 'genkit';
import type { GenerateResponse, MessageData } from 'genkit'; // Import GenerateResponse and MessageData types

// Define the structure for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model'] as const), // 'model' for AI responses
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
  console.log("[chatWithAssistant] Entered function with input:", JSON.stringify(input, null, 2));
  try {
    // Call the Genkit flow defined below
    console.log("[chatWithAssistant] Calling chatbotFlow...");
    const flowResult = await chatbotFlow(input);
    console.log("[chatWithAssistant] chatbotFlow returned:", JSON.stringify(flowResult, null, 2));

    // Validate the flow result against the expected schema (already done within the flow)
    // The flow itself now guarantees the output shape or throws an error.

     if (!flowResult?.response || flowResult.response.trim() === '') {
        console.warn("[chatWithAssistant] Received empty or whitespace-only response from flow.");
        // Return a user-friendly message in the correct schema
        return { response: "Sorry, I couldn't generate a valid response." };
    }

    console.log("[chatWithAssistant] Successfully processed request. Returning response:", flowResult.response);
    return flowResult; // Directly return the validated flow result

  } catch (error: unknown) {
    console.error("[chatWithAssistant] Error executing chatbotFlow:", error);
    let errorMessage = "An error occurred while processing your chat request.";
    if (error instanceof Error) {
      // Modify the error message to be more user-friendly and less technical
      if (error.message.includes("Unsupported Part type")) {
          errorMessage = "Sorry, I'm having trouble understanding the conversation format. Please try rephrasing or starting a new chat.";
      } else if (error.message.includes("reading 'content'")) {
           errorMessage = "Sorry, there was an issue processing part of the conversation. Could you try again?";
      } else {
           errorMessage = `Error: ${error.message}. Please try again.`;
      }
      console.error("  Detailed Error Message:", error.message); // Log the detailed error message

      if (process.env.NODE_ENV === 'development' && error.stack) {
           console.error("  Error Stack:", error.stack);
      }
    } else {
      console.error("  Caught a non-Error exception:", error);
    }
    // Return a user-friendly error response wrapped in the expected schema
    return { response: errorMessage };
  }
}


// Define the Genkit flow using ai.generate directly
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema, // Ensure output matches this schema
  },
  async (input) => {
    console.log("[chatbotFlow] Flow entered with input:", JSON.stringify(input, null, 2));

    try {
      // 1. Construct messages in the format expected by the AI model (MessageData[])
      // Exclude the system prompt from this array now.
      const messagesForAI: MessageData[] = [];

      // Add history messages next (user and model roles only)
      if (input.history) {
        input.history.forEach(msg => {
          // Ensure roles are 'user' or 'model' and content is structured correctly
          // Filter out any potential system messages from history (shouldn't be there, but safe)
          if (msg.role === 'user' || msg.role === 'model') {
             messagesForAI.push({
               role: msg.role,
               content: [{ text: msg.content }] // Gemini expects content as an array of parts
             });
          } else {
             console.warn("[chatbotFlow] Skipping unexpected role in history:", msg.role);
          }
        });
      }

      // Add the current user message last
      messagesForAI.push({
        role: 'user',
        content: [{ text: input.message }]
      });

      // Define the system prompt separately
      const systemPrompt = `You are MedScribeAI Assistant, a helpful AI designed to answer questions about the MedScribeAI application, its features, and general medical documentation concepts. Be concise and informative. If you don't know the answer, say so politely. Do not provide medical advice. Keep responses brief unless asked for details.`;

      // 2. Log arguments before calling ai.generate
      // Remove the explicit model specification - Genkit will use the default from ai-instance.ts
      const generateArgs = {
         prompt: messagesForAI,
         system: systemPrompt,
         output: { format: 'text' as const }, // Ensure type safety
      };
      console.log("[chatbotFlow] Calling ai.generate with arguments:", JSON.stringify(generateArgs, null, 2));


      // Call ai.generate with the prepared messages and the system prompt
      const modelResponse: GenerateResponse = await ai.generate(generateArgs);
      console.log("[chatbotFlow] ai.generate response received.");

      // 3. Extract the text response
      const responseText = modelResponse?.text; // Use .text for v1.x
      console.log("[chatbotFlow] Extracted text from model response:", responseText);

      // 4. Validate and return the response
      if (!responseText?.trim()) {
        console.warn("[chatbotFlow] Received empty or invalid response from model.");
        // Return a default error message matching the output schema
        return { response: "Sorry, I couldn't generate a valid response at this moment." };
      }

      // Return the successful response, fitting the ChatOutputSchema
      console.log("[chatbotFlow] Returning successful response.");
      return { response: responseText };

    } catch (error) {
      console.error("[chatbotFlow] Error occurred during flow execution:", error);
      // Log the error details within the flow as well
      if (error instanceof Error) {
          console.error("  Flow Error Message:", error.message);
          if (error.stack) {
              console.error("  Flow Error Stack:", error.stack);
          }
      } else {
          console.error("  Caught non-Error exception in flow:", error);
      }
      // Re-throw the error to be caught by the calling function (chatWithAssistant)
      // This allows the caller to handle the error presentation to the user.
      throw error; // Let chatWithAssistant handle user-facing error message
    }
  }
);
