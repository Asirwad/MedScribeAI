'use server';

/**
 * @fileOverview Generates a SOAP note from patient encounter transcript and history.
 *
 * - generateSoapNote - A function that generates the SOAP note.
 * - GenerateSoapNoteInput - The input type for the generateSoapNote function.
 * - GenerateSoapNoteOutput - The return type for the generateSoapNote function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

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

export async function generateSoapNote(input: GenerateSoapNoteInput): Promise<GenerateSoapNoteOutput> {
  return generateSoapNoteFlow(input);
}

const generateSoapNotePrompt = ai.definePrompt({
  name: 'generateSoapNotePrompt',
  input: {
    schema: z.object({
      patientId: z.string().describe('The ID of the patient.'),
      encounterTranscript: z
        .string()
        .describe('The transcript of the patient encounter.'),
      patientHistory: z.string().describe('The patient medical history.'),
    }),
  },
  output: {
    schema: z.object({
      soapNote: z.string().describe('The generated SOAP note.'),
    }),
  },
  prompt: `You are an AI clinical documentation assistant. Your task is to generate a SOAP (Subjective, Objective, Assessment, Plan) note from the patient encounter transcript and the patient\'s medical history.\n\nPatient History: {{{patientHistory}}}\n\nEncounter Transcript: {{{encounterTranscript}}}\n\nSOAP Note:\n`,
});

const generateSoapNoteFlow = ai.defineFlow<
  typeof GenerateSoapNoteInputSchema,
  typeof GenerateSoapNoteOutputSchema
>({
  name: 'generateSoapNoteFlow',
  inputSchema: GenerateSoapNoteInputSchema,
  outputSchema: GenerateSoapNoteOutputSchema,
},
async input => {
  const {output} = await generateSoapNotePrompt(input);
  return output!;
});

