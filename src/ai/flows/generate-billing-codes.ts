'use server';
/**
 * @fileOverview A billing code suggestion AI agent.
 * Supports both Genkit/Gemini and Llama providers based on environment configuration.
 *
 * - generateBillingCodes - A function that handles the billing code generation process.
 * - GenerateBillingCodesInput - The input type for the generateBillingCodes function.
 * - GenerateBillingCodesOutput - The return type for the generateBillingCodes function.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance'; // Genkit instance
import { llmProvider } from '@/config/llm-config'; // LLM provider config
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client'; // Llama client

// --- Input and Output Schemas (remain the same) ---
const GenerateBillingCodesInputSchema = z.object({
  soapNote: z.string().describe('The generated SOAP note.'),
});
export type GenerateBillingCodesInput = z.infer<typeof GenerateBillingCodesInputSchema>;

const BillingCodeEntrySchema = z.object({
  code: z.string().describe('The suggested billing code (e.g., CPT or ICD-10).'),
  description: z.string().describe('A brief description of the billing code.'),
  estimatedBillAmountRange: z.string().describe('An estimated billing amount range for this code (e.g., "$100 - $150"). Provide a rough estimate based on common practice.'),
});

const GenerateBillingCodesOutputSchema = z.object({
  billingCodes: z.array(BillingCodeEntrySchema).describe('An array of suggested billing codes, each with its description and estimated amount range.'),
});
export type GenerateBillingCodesOutput = z.infer<typeof GenerateBillingCodesOutputSchema>;


// --- Exported Function ---
export async function generateBillingCodes(input: GenerateBillingCodesInput): Promise<GenerateBillingCodesOutput> {
   // Validate input using Zod
  const validationResult = GenerateBillingCodesInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("[generateBillingCodes] Invalid input:", validationResult.error);
    throw new Error(`Invalid input for billing code generation: ${validationResult.error.message}`);
  }

  console.log(`[generateBillingCodes] Called with provider: ${llmProvider}`);

  if (llmProvider === 'GEMINI') {
    // Use Genkit flow
     try {
        console.log("[generateBillingCodes] Using Genkit/Gemini provider.");
        return await generateBillingCodesFlowGenkit(validationResult.data);
     } catch (error) {
        console.error("[generateBillingCodes] Genkit flow error:", error);
        const message = error instanceof Error ? error.message : 'Unknown Genkit error';
        throw new Error(`Gemini billing code generation failed: ${message}`);
     }
  } else if (llmProvider === 'LLAMA') {
    // Use Llama client
    try {
        console.log("[generateBillingCodes] Using Llama provider.");
        return await generateBillingCodesFlowLlama(validationResult.data);
    } catch (error) {
        console.error("[generateBillingCodes] Llama client error:", error);
        const message = error instanceof Error ? error.message : 'Unknown Llama error';
        throw new Error(`Llama billing code generation failed: ${message}`);
    }
  } else {
     console.error(`[generateBillingCodes] Unsupported LLM provider configured: ${llmProvider}`);
     throw new Error(`Unsupported LLM provider: ${llmProvider}`);
  }
}


// --- Genkit/Gemini Implementation ---
const generateBillingCodesPromptGenkit = ai.definePrompt({
  name: 'generateBillingCodesPrompt',
  input: { schema: GenerateBillingCodesInputSchema },
  output: { schema: GenerateBillingCodesOutputSchema },
  prompt: `You are an expert medical billing coder. Given the following SOAP note, suggest appropriate billing codes (CPT and ICD-10 codes).

For each suggested code, provide:
1.  The 'code' itself (e.g., "99213", "M54.5").
2.  A brief 'description' of what the code represents (e.g., "Office outpatient visit, established patient, 20-29 minutes", "Low back pain").
3.  An 'estimatedBillAmountRange' (e.g., "$100 - $150", "$50 - $80"). Provide a typical, rough estimate.

Return the results **only** as a valid JSON object with a single key "billingCodes" containing an array of these structured code objects. Do not include any other text or explanations outside the JSON structure. Example format:
{
  "billingCodes": [
    { "code": "99213", "description": "Office outpatient visit...", "estimatedBillAmountRange": "$100 - $150" },
    { "code": "M54.5", "description": "Low back pain", "estimatedBillAmountRange": "$50 - $80" }
  ]
}

SOAP Note:
{{{soapNote}}}
`,
});

const generateBillingCodesFlowGenkit = ai.defineFlow<
  GenerateBillingCodesInput,
  GenerateBillingCodesOutput
>({
  name: 'generateBillingCodesFlowGenkit',
  inputSchema: GenerateBillingCodesInputSchema,
  outputSchema: GenerateBillingCodesOutputSchema,
},
async (input) => {
  console.log("[generateBillingCodesFlowGenkit] Executing Genkit flow with input:", input);
  const { output } = await generateBillingCodesPromptGenkit(input);
   // Ensure output is not null and billingCodes is an array, default to empty array if not.
   const result = { billingCodes: output?.billingCodes ?? [] };
   // Validate before returning
    const validation = GenerateBillingCodesOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error("[generateBillingCodesFlowGenkit] Genkit output validation failed:", validation.error);
        // Return default empty structure on validation failure
        return { billingCodes: [] };
    }
   console.log("[generateBillingCodesFlowGenkit] Genkit flow successful.");
   return validation.data;
});


// --- Llama Implementation ---
async function generateBillingCodesFlowLlama(input: GenerateBillingCodesInput): Promise<GenerateBillingCodesOutput> {
    console.log("[generateBillingCodesFlowLlama] Executing Llama logic with input:", input);

    // Construct the prompt for Llama (similar to Genkit's, emphasizing JSON output)
    const prompt = `You are an expert medical billing coder. Given the following SOAP note, suggest appropriate billing codes (CPT and ICD-10 codes).

For each suggested code, provide:
1.  The 'code' itself (e.g., "99213", "M54.5").
2.  A brief 'description' of what the code represents (e.g., "Office outpatient visit, established patient, 20-29 minutes", "Low back pain").
3.  An 'estimatedBillAmountRange' (e.g., "$100 - $150", "$50 - $80"). Provide a typical, rough estimate.

Return the results **only** as a valid JSON object with a single key "billingCodes" containing an array of these structured code objects. Do not include any other text, explanations, markdown formatting, or code blocks outside the JSON structure itself. Start the response directly with '{' and end it with '}'.

Example format:
{
  "billingCodes": [
    { "code": "99213", "description": "Office outpatient visit...", "estimatedBillAmountRange": "$100 - $150" },
    { "code": "M54.5", "description": "Low back pain", "estimatedBillAmountRange": "$50 - $80" }
  ]
}

SOAP Note:
${input.soapNote}
`;

    // Format messages for the OpenAI-compatible API
    const messages: OpenAIMessage[] = [
         // System prompt instructing the desired output format
        { role: 'system', content: 'You are a helpful AI assistant that responds strictly in JSON format.' },
        { role: 'user', content: prompt },
    ];

    try {
        const responseContent = await llamaChatCompletion(messages);
        console.log("[generateBillingCodesFlowLlama] Received response from Llama:", responseContent);

        if (!responseContent) {
            console.error("[generateBillingCodesFlowLlama] Llama client returned empty content.");
            throw new Error("Llama billing code generation returned empty content.");
        }

        // Attempt to parse the JSON response
        let parsedResult: any;
        try {
            // Remove potential markdown code block fences if present
            const cleanedResponse = responseContent.replace(/^```json\s*|```$/g, '').trim();
            parsedResult = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error("[generateBillingCodesFlowLlama] Failed to parse Llama JSON response:", parseError);
            console.error("[generateBillingCodesFlowLlama] Raw Llama response:", responseContent); // Log the raw response
            throw new Error(`Llama response was not valid JSON. Response: ${responseContent.substring(0,100)}...`);
        }

        // Validate the parsed JSON against the Zod schema
        const validation = GenerateBillingCodesOutputSchema.safeParse(parsedResult);
        if (!validation.success) {
            console.error("[generateBillingCodesFlowLlama] Llama response failed Zod validation:", validation.error);
            console.error("[generateBillingCodesFlowLlama] Parsed Llama data:", parsedResult); // Log the parsed data
            // Return default empty structure on validation failure instead of throwing immediately
            console.warn("[generateBillingCodesFlowLlama] Returning empty billing codes due to validation failure.");
            return { billingCodes: [] };
            // throw new Error(`Llama response validation failed: ${validation.error.message}`);
        }

        console.log("[generateBillingCodesFlowLlama] Llama logic successful.");
        return validation.data; // Return the validated data

    } catch (error) {
        console.error("[generateBillingCodesFlowLlama] Error during Llama processing:", error);
        // Re-throw the error to be caught by the main exported function
        if (error instanceof Error && error.message.includes("Llama response was not valid JSON")) {
            // Return empty array if parsing failed, consistent with Genkit behavior
             console.warn("[generateBillingCodesFlowLlama] Returning empty billing codes due to JSON parsing error.");
             return { billingCodes: [] };
        }
        throw error; // Re-throw other errors
    }
}
