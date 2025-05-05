'use server';
/**
 * @fileOverview A chatbot flow using Genkit and Vertex AI (Gemini).
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the structure for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']), // Use 'model' for AI responses as per Genkit convention
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
  return chatbotFlow(input);
}

// Define the prompt - uses history for context
const chatbotPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    // Use the Gemini Pro model which supports conversational history
    model: 'googleai/gemini-pro',
    input: {
      schema: ChatInputSchema,
    },
    output: {
      schema: ChatOutputSchema,
    },
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
  },
  // This function processes the prompt output (the raw model response)
  // into the structured ChatOutputSchema.
  async (modelResponse) => {
    return { response: modelResponse.text };
  }
);

// Define the main Genkit flow
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
     // Prepare messages for the model, ensuring correct role mapping
     const messages = (input.history || []).map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }],
      }));

     // Add the latest user message
     messages.push({ role: 'user', content: [{ text: input.message }] });

    // Call the Gemini Pro model directly for conversation
    // Use ai.generate instead of calling the prompt function directly when managing history externally
    const result = await ai.generate({
       // Use the Gemini Pro model which supports conversational history
       model: 'googleai/gemini-pro',
       // Provide the system prompt and message history
       system: `You are MedScribeAI Assistant, a helpful AI designed to answer questions about the MedScribeAI application, its features, and general medical documentation concepts. Be concise and informative. If you don't know the answer, say so politely. Do not provide medical advice.`,
       messages: messages,
       // Define the expected output format (though for simple text it's often inferred)
       output: {
         format: 'text',
         schema: z.string().describe("The assistant's response message."),
       }
    });

    // Extract the text response
    const responseText = result.text;

    // Return the response structured according to the output schema
    return { response: responseText };
  }
);
