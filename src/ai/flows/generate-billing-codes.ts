'use server';
/**
 * @fileOverview A billing code suggestion AI agent.
 *
 * - generateBillingCodes - A function that handles the billing code generation process.
 * - GenerateBillingCodesInput - The input type for the generateBillingCodes function.
 * - GenerateBillingCodesOutput - The return type for the generateBillingCodes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateBillingCodesInputSchema = z.object({
  soapNote: z.string().describe('The generated SOAP note.'),
});
export type GenerateBillingCodesInput = z.infer<typeof GenerateBillingCodesInputSchema>;

const GenerateBillingCodesOutputSchema = z.object({
  billingCodes: z.string().describe('The suggested billing codes.'),
});
export type GenerateBillingCodesOutput = z.infer<typeof GenerateBillingCodesOutputSchema>;

export async function generateBillingCodes(input: GenerateBillingCodesInput): Promise<GenerateBillingCodesOutput> {
  return generateBillingCodesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBillingCodesPrompt',
  input: {
    schema: z.object({
      soapNote: z.string().describe('The generated SOAP note.'),
    }),
  },
  output: {
    schema: z.object({
      billingCodes: z.string().describe('The suggested billing codes.'),
    }),
  },
  prompt: `You are an expert medical billing coder. Given the following SOAP note, suggest appropriate billing codes (CPT and ICD-10 codes).\n\nSOAP Note: {{{soapNote}}}`,
});

const generateBillingCodesFlow = ai.defineFlow<
  typeof GenerateBillingCodesInputSchema,
  typeof GenerateBillingCodesOutputSchema
>({
  name: 'generateBillingCodesFlow',
  inputSchema: GenerateBillingCodesInputSchema,
  outputSchema: GenerateBillingCodesOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
