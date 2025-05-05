'use server';
/**
 * @fileOverview A chatbot flow using Genkit.
 *
 * - chatWithAssistant - A function that handles the chatbot interaction.
 * - ChatMessage - Represents a single message in the chat history.
 * - ChatInput - The input type for the chatWithAssistant function.
 * - ChatOutput - The return type for the chatWithAssistant function.
 */

import {ai} from '@/ai/ai-instance'; // ai instance already configured with default model
import {z} from 'genkit';

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
  // Directly call the defined prompt flow, which uses the default model
  const { output } = await chatbotPrompt(input);
  // Ensure output is not null before returning
  return output!;
}

// Define the prompt - uses history for context and the default model from ai-instance
const chatbotPrompt = ai.definePrompt(
  {
    name: 'chatbotPrompt',
    // No model specified here, it will use the default model ('googleai/gemini-2.0-flash') from ai-instance.ts
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
    // The default model's response text is directly accessible via .text
    return { response: modelResponse.text };
  }
);

// Define the Genkit flow that simply wraps the prompt call
const chatbotFlow = ai.defineFlow<typeof ChatInputSchema, typeof ChatOutputSchema>(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Directly call the prompt. Genkit handles passing history from input to the prompt template.
    const { output } = await chatbotPrompt(input);
    return output!;
  }
);

// Note: We no longer need the complex manual history management inside the flow
// because the prompt template handles it. The ai.definePrompt automatically uses
// the history field from the input schema.
