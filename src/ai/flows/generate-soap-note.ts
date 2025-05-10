'use server';

/**
 * @fileOverview Generates a SOAP note from patient encounter transcript and history.
 * Supports Genkit/Gemini, Llama (OpenAI SDK), and Llama (Azure SDK) providers.
 *
 * - generateSoapNote - A function that generates the SOAP note.
 * - GenerateSoapNoteInput - The input type for the generateSoapNote function.
 * - GenerateSoapNoteOutput - The return type for the generateSoapNote function.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance';
import { llmProvider } from '@/config/llm-config';
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client';
import { azureLlamaChatCompletion, type AzureChatMessage } from '@/lib/azure-llama-client'; // Import Azure Llama client

// --- Input and Output Schemas ---
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
  const validationResult = GenerateSoapNoteInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("[generateSoapNote] Invalid input:", validationResult.error);
    throw new Error(`Invalid input for SOAP note generation: ${validationResult.error.message}`);
  }
  const validatedInput = validationResult.data;
  console.log(`[generateSoapNote] Called with provider: ${llmProvider}`);

  try {
    if (llmProvider === 'GEMINI') {
      console.log("[generateSoapNote] Using Genkit/Gemini provider.");
      return await generateSoapNoteFlowGenkit(validatedInput);
    } else if (llmProvider === 'LLAMA') {
      console.log("[generateSoapNote] Using Llama (OpenAI SDK) provider.");
      return await generateSoapNoteFlowLlamaOpenAI(validatedInput);
    } else if (llmProvider === 'LLAMA_AZURE') {
      console.log("[generateSoapNote] Using Llama (Azure SDK) provider.");
      return await generateSoapNoteFlowLlamaAzure(validatedInput);
    } else {
      console.error(`[generateSoapNote] Unsupported LLM provider configured: ${llmProvider}`);
      throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }
  } catch (error) {
    console.error(`[generateSoapNote] Error with ${llmProvider} provider:`, error);
    const message = error instanceof Error ? error.message : `Unknown error with ${llmProvider}`;
    throw new Error(`${llmProvider} SOAP note generation failed: ${message}`);
  }
}

// --- Common Prompt for SOAP Note Generation ---
const soapNoteSystemPrompt = 'You are an AI clinical documentation assistant generating SOAP notes.';
const soapNoteUserPrompt = (patientHistory: string, encounterTranscript: string) => `You are an AI clinical documentation assistant. Your task is to generate a SOAP (Subjective, Objective, Assessment, Plan) note from the patient encounter transcript and the patient's medical history. Ensure the output is a single block of text formatted as a standard SOAP note with clear sections.

Patient History:
${patientHistory}

Encounter Transcript:
${encounterTranscript}

SOAP Note:
`;

// --- Genkit/Gemini Implementation ---
const generateSoapNotePromptGenkit = ai.definePrompt({
  name: 'generateSoapNotePrompt',
  input: { schema: GenerateSoapNoteInputSchema },
  output: { schema: GenerateSoapNoteOutputSchema },
  prompt: `You are an AI clinical documentation assistant. Your task is to generate a SOAP (Subjective, Objective, Assessment, Plan) note from the patient encounter transcript and the patient's medical history. Ensure the output is a single block of text formatted as a standard SOAP note with clear sections.

Patient History:
{{{patientHistory}}}

Encounter Transcript:
{{{encounterTranscript}}}

SOAP Note:
`,
});

const generateSoapNoteFlowGenkit = ai.defineFlow<
  GenerateSoapNoteInput,
  GenerateSoapNoteOutput
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


// --- Llama (OpenAI SDK) Implementation ---
async function generateSoapNoteFlowLlamaOpenAI(input: GenerateSoapNoteInput): Promise<GenerateSoapNoteOutput> {
    console.log("[generateSoapNoteFlowLlamaOpenAI] Executing Llama (OpenAI SDK) logic with input:", input);
    const messages: OpenAIMessage[] = [
        { role: 'system', content: soapNoteSystemPrompt },
        { role: 'user', content: soapNoteUserPrompt(input.patientHistory, input.encounterTranscript) },
    ];

    const responseContent = await llamaChatCompletion(messages);
    console.log("[generateSoapNoteFlowLlamaOpenAI] Received response from Llama (OpenAI SDK).");

    if (!responseContent) {
        console.error("[generateSoapNoteFlowLlamaOpenAI] Llama client returned empty content.");
        throw new Error("Llama (OpenAI SDK) SOAP note generation returned empty content.");
    }
    const result: GenerateSoapNoteOutput = { soapNote: responseContent };
    const validation = GenerateSoapNoteOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error("[generateSoapNoteFlowLlamaOpenAI] Llama response failed Zod validation:", validation.error);
        throw new Error(`Llama (OpenAI SDK) response validation failed: ${validation.error.message}`);
    }
    console.log("[generateSoapNoteFlowLlamaOpenAI] Llama (OpenAI SDK) logic successful.");
    return validation.data;
}

// --- Llama (Azure SDK) Implementation ---
async function generateSoapNoteFlowLlamaAzure(input: GenerateSoapNoteInput): Promise<GenerateSoapNoteOutput> {
    console.log("[generateSoapNoteFlowLlamaAzure] Executing Llama (Azure SDK) logic with input:", input);
    const messages: AzureChatMessage[] = [
        { role: 'system', content: soapNoteSystemPrompt },
        { role: 'user', content: soapNoteUserPrompt(input.patientHistory, input.encounterTranscript) },
    ];
    
    const responseContent = await azureLlamaChatCompletion(messages);
    console.log("[generateSoapNoteFlowLlamaAzure] Received response from Llama (Azure SDK).");

    if (!responseContent) {
        console.error("[generateSoapNoteFlowLlamaAzure] Azure Llama client returned empty content.");
        throw new Error("Llama (Azure SDK) SOAP note generation returned empty content.");
    }
    const result: GenerateSoapNoteOutput = { soapNote: responseContent };
    const validation = GenerateSoapNoteOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error("[generateSoapNoteFlowLlamaAzure] Azure Llama response failed Zod validation:", validation.error);
        throw new Error(`Llama (Azure SDK) response validation failed: ${validation.error.message}`);
    }
    console.log("[generateSoapNoteFlowLlamaAzure] Llama (Azure SDK) logic successful.");
    return validation.data;
}
