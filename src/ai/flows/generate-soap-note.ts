'use server';

/**
 * @fileOverview Generates a SOAP note from patient encounter transcript and history.
 * Supports both Genkit/Gemini and Llama providers based on environment configuration.
 *
 * - generateSoapNote - A function that generates the SOAP note.
 * - GenerateSoapNoteInput - The input type for the generateSoapNote function.
 * - GenerateSoapNoteOutput - The return type for the generateSoapNote function.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance'; // Genkit instance
import { llmProvider } from '@/config/llm-config'; // LLM provider config
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client'; // Llama client

// --- Input and Output Schemas (remain the same) ---
const GenerateSoapNoteInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  encounterTranscript: z
    .string()
    .describe('The transcript of the patient encounter.'),
  patientHistory: z.string().describe('The patient medical history.'),
});
export type GenerateSoapNoteInput = z.infer<typeof GenerateSoapNoteInputSchema>;

const GenerateSoapNoteOutputSchema = z.object({
  soapNote: z.string().describe('The generated SOAP note.'),
});
export type GenerateSoapNoteOutput = z.infer<typeof GenerateSoapNoteOutputSchema>;


// --- Exported Function ---
export async function generateSoapNote(input: GenerateSoapNoteInput): Promise<GenerateSoapNoteOutput> {
  // Validate input using Zod
  const validationResult = GenerateSoapNoteInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("[generateSoapNote] Invalid input:", validationResult.error);
    throw new Error(`Invalid input for SOAP note generation: ${validationResult.error.message}`);
  }

  console.log(`[generateSoapNote] Called with provider: ${llmProvider}`);

  if (llmProvider === 'GEMINI') {
    // Use Genkit flow
    try {
        console.log("[generateSoapNote] Using Genkit/Gemini provider.");
        return await generateSoapNoteFlowGenkit(validationResult.data);
    } catch (error) {
        console.error("[generateSoapNote] Genkit flow error:", error);
        // Provide a more specific error message if possible
        const message = error instanceof Error ? error.message : 'Unknown Genkit error';
        throw new Error(`Gemini SOAP note generation failed: ${message}`);
    }
  } else if (llmProvider === 'LLAMA') {
    // Use Llama client
    try {
        console.log("[generateSoapNote] Using Llama provider.");
        return await generateSoapNoteFlowLlama(validationResult.data);
    } catch (error) {
         console.error("[generateSoapNote] Llama client error:", error);
         const message = error instanceof Error ? error.message : 'Unknown Llama error';
         throw new Error(`Llama SOAP note generation failed: ${message}`);
    }
  } else {
    console.error(`[generateSoapNote] Unsupported LLM provider configured: ${llmProvider}`);
    throw new Error(`Unsupported LLM provider: ${llmProvider}`);
  }
}


// --- Genkit/Gemini Implementation ---
const generateSoapNotePromptGenkit = ai.definePrompt({
  name: 'generateSoapNotePrompt', // Keep name unique if needed, or reuse if prompts are identical
  input: { schema: GenerateSoapNoteInputSchema }, // Use the shared schema
  output: { schema: GenerateSoapNoteOutputSchema }, // Use the shared schema
  prompt: `You are an AI clinical documentation assistant. Your task is to generate a SOAP (Subjective, Objective, Assessment, Plan) note from the patient encounter transcript and the patient's medical history. Ensure the output is a single block of text formatted as a standard SOAP note with clear sections.

Patient History:
{{{patientHistory}}}

Encounter Transcript:
{{{encounterTranscript}}}

SOAP Note:
`,
});

const generateSoapNoteFlowGenkit = ai.defineFlow<
  GenerateSoapNoteInput, // Explicitly use the type here
  GenerateSoapNoteOutput // Explicitly use the type here
>(
  {
    name: 'generateSoapNoteFlowGenkit',
    inputSchema: GenerateSoapNoteInputSchema,
    outputSchema: GenerateSoapNoteOutputSchema,
  },
  async (input) => {
    console.log("[generateSoapNoteFlowGenkit] Executing Genkit flow with input:", input);
    const { output } = await generateSoapNotePromptGenkit(input);
     if (!output?.soapNote) {
        console.error("[generateSoapNoteFlowGenkit] Genkit flow returned empty or invalid output.");
        throw new Error("Genkit SOAP note generation returned empty output.");
     }
    console.log("[generateSoapNoteFlowGenkit] Genkit flow successful.");
    return output;
  }
);


// --- Llama Implementation ---
async function generateSoapNoteFlowLlama(input: GenerateSoapNoteInput): Promise<GenerateSoapNoteOutput> {
    console.log("[generateSoapNoteFlowLlama] Executing Llama logic with input:", input);

    // Construct the prompt for Llama (similar to Genkit's)
    const prompt = `You are an AI clinical documentation assistant. Your task is to generate a SOAP (Subjective, Objective, Assessment, Plan) note from the patient encounter transcript and the patient's medical history. Ensure the output is a single block of text formatted as a standard SOAP note with clear sections.

Patient History:
${input.patientHistory}

Encounter Transcript:
${input.encounterTranscript}

SOAP Note:
`;

    // Format messages for the OpenAI-compatible API
    const messages: OpenAIMessage[] = [
        { role: 'system', content: 'You are an AI clinical documentation assistant generating SOAP notes.' }, // System prompt
        { role: 'user', content: prompt }, // User prompt containing instructions and data
    ];

    try {
        const responseContent = await llamaChatCompletion(messages);
        console.log("[generateSoapNoteFlowLlama] Received response from Llama.");

         if (!responseContent) {
            console.error("[generateSoapNoteFlowLlama] Llama client returned empty content.");
            throw new Error("Llama SOAP note generation returned empty content.");
         }

        // Validate the output against the schema (basic check here, more robust parsing if needed)
        const result: GenerateSoapNoteOutput = { soapNote: responseContent };
        const validation = GenerateSoapNoteOutputSchema.safeParse(result);
        if (!validation.success) {
            console.error("[generateSoapNoteFlowLlama] Llama response failed Zod validation:", validation.error);
            throw new Error(`Llama response validation failed: ${validation.error.message}`);
        }

        console.log("[generateSoapNoteFlowLlama] Llama logic successful.");
        return validation.data;

    } catch (error) {
        console.error("[generateSoapNoteFlowLlama] Error during Llama API call:", error);
        // Re-throw the error to be caught by the main exported function
        throw error;
    }
}
