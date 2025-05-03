'use server';

/**
 * @fileOverview An AI agent that transcribes a patient encounter in real-time.
 *
 * - transcribePatientEncounter - A function that handles the patient encounter transcription process.
 * - TranscribePatientEncounterInput - The input type for the transcribePatientEncounter function.
 * - TranscribePatientEncounterOutput - The return type for the transcribePatientEncounter function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TranscribePatientEncounterInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio of a patient encounter, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribePatientEncounterInput = z.infer<typeof TranscribePatientEncounterInputSchema>;

const TranscribePatientEncounterOutputSchema = z.object({
  transcript: z.string().describe('The transcript of the patient encounter.'),
});
export type TranscribePatientEncounterOutput = z.infer<typeof TranscribePatientEncounterOutputSchema>;

export async function transcribePatientEncounter(input: TranscribePatientEncounterInput): Promise<TranscribePatientEncounterOutput> {
  return transcribePatientEncounterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribePatientEncounterPrompt',
  input: {
    schema: z.object({
      audioDataUri: z
        .string()
        .describe(
          "The audio of a patient encounter, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      transcript: z.string().describe('The transcript of the patient encounter.'),
    }),
  },
  prompt: `You are an expert medical transcriptionist. Please transcribe the following audio of a patient encounter: {{media url=audioDataUri}}`,
});

const transcribePatientEncounterFlow = ai.defineFlow<
  typeof TranscribePatientEncounterInputSchema,
  typeof TranscribePatientEncounterOutputSchema
>(
  {
    name: 'transcribePatientEncounterFlow',
    inputSchema: TranscribePatientEncounterInputSchema,
    outputSchema: TranscribePatientEncounterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

