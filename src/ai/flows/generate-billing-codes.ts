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

// Define the schema for a single billing code entry
const BillingCodeEntrySchema = z.object({
  code: z.string().describe('The suggested billing code (e.g., CPT or ICD-10).'),
  description: z.string().describe('A brief description of the billing code.'),
  estimatedBillAmountRange: z.string().describe('An estimated billing amount range for this code (e.g., "$100 - $150"). Provide a rough estimate based on common practice.'),
});

// Update the output schema to be an array of the entry schema
const GenerateBillingCodesOutputSchema = z.object({
  billingCodes: z.array(BillingCodeEntrySchema).describe('An array of suggested billing codes, each with its description and estimated amount range.'),
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
    // Use the updated output schema
    schema: GenerateBillingCodesOutputSchema,
  },
  prompt: `You are an expert medical billing coder. Given the following SOAP note, suggest appropriate billing codes (CPT and ICD-10 codes).

For each suggested code, provide:
1.  The 'code' itself (e.g., "99213", "M54.5").
2.  A brief 'description' of what the code represents (e.g., "Office outpatient visit, established patient, 20-29 minutes", "Low back pain").
3.  An 'estimatedBillAmountRange' (e.g., "$100 - $150", "$50 - $80"). Provide a typical, rough estimate.

Return the results as a JSON object with a key "billingCodes" containing an array of these structured code objects.

SOAP Note:
{{{soapNote}}}
`,
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
  // Ensure output is not null and billingCodes is an array, default to empty array if not.
  return { billingCodes: output?.billingCodes ?? [] };
});
