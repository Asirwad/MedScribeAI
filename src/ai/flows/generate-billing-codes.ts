'use server';
/**
 * @fileOverview A billing code suggestion AI agent.
 * Supports Genkit/Gemini, Llama (OpenAI SDK), and Llama (Azure SDK) providers.
 *
 * - generateBillingCodes - A function that handles the billing code generation process.
 * - GenerateBillingCodesInput - The input type for the generateBillingCodes function.
 * - GenerateBillingCodesOutput - The return type for the generateBillingCodes function.
 */

import { z } from 'zod';
import { ai } from '@/ai/ai-instance';
import { llmProvider } from '@/config/llm-config';
import { llamaChatCompletion, type OpenAIMessage } from '@/lib/llama-client';
import { azureLlamaChatCompletion, type AzureChatMessage } from '@/lib/azure-llama-client'; // Import Azure Llama client


// --- Input and Output Schemas ---
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
  const validationResult = GenerateBillingCodesInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("[generateBillingCodes] Invalid input:", validationResult.error);
    throw new Error(`Invalid input for billing code generation: ${validationResult.error.message}`);
  }
  const validatedInput = validationResult.data;
  console.log(`[generateBillingCodes] Called with provider: ${llmProvider}`);

  try {
    if (llmProvider === 'GEMINI') {
      console.log("[generateBillingCodes] Using Genkit/Gemini provider.");
      return await generateBillingCodesFlowGenkit(validatedInput);
    } else if (llmProvider === 'LLAMA') {
      console.log("[generateBillingCodes] Using Llama (OpenAI SDK) provider.");
      return await generateBillingCodesFlowLlamaOpenAI(validatedInput);
    } else if (llmProvider === 'LLAMA_AZURE') {
      console.log("[generateBillingCodes] Using Llama (Azure SDK) provider.");
      return await generateBillingCodesFlowLlamaAzure(validatedInput);
    } else {
      console.error(`[generateBillingCodes] Unsupported LLM provider configured: ${llmProvider}`);
      throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }
  } catch (error) {
    console.error(`[generateBillingCodes] Error with ${llmProvider} provider:`, error);
    const message = error instanceof Error ? error.message : `Unknown error with ${llmProvider}`;
    // Default to empty billing codes on error to prevent breaking UI
    // Log the error for debugging but return a valid empty structure.
    return { billingCodes: [] };
    // throw new Error(`${llmProvider} billing code generation failed: ${message}`);
  }
}


// --- Common Prompt for JSON Output (Llama OpenAI & Azure) ---
const llamaJsonPromptSystem = 'You are a helpful AI assistant that responds strictly in JSON format. Do not include any markdown formatting or code blocks around the JSON output.';
const llamaJsonPromptUser = (soapNote: string) => `You are an expert medical billing coder. Given the following SOAP note, suggest appropriate billing codes (CPT and ICD-10 codes).

For each suggested code, provide:
1.  The 'code' itself (e.g., "99213", "M54.5").
2.  A brief 'description' of what the code represents (e.g., "Office outpatient visit, established patient, 20-29 minutes", "Low back pain").
3.  An 'estimatedBillAmountRange' (e.g., "$100 - $150", "$50 - $80"). Provide a typical, rough estimate.

Return the results **only** as a valid JSON object with a single key "billingCodes" containing an array of these structured code objects. Do not include any other text or explanations outside the JSON structure itself. Start the response directly with '{' and end it with '}'.

Example format:
{
  "billingCodes": [
    { "code": "99213", "description": "Office outpatient visit...", "estimatedBillAmountRange": "$100 - $150" },
    { "code": "M54.5", "description": "Low back pain", "estimatedBillAmountRange": "$50 - $80" }
  ]
}

SOAP Note:
${soapNote}
`;

// --- Helper to Parse and Validate Llama's JSON Output ---
async function parseAndValidateLlamaOutput(providerName: string, responseContent: string | null): Promise<GenerateBillingCodesOutput> {
    if (!responseContent) {
        console.error(`[${providerName}] Client returned empty content.`);
        // Return default empty structure on error.
        return { billingCodes: [] };
        // throw new Error(`${providerName} billing code generation returned empty content.`);
    }

    let parsedResult: any;
    try {
        const cleanedResponse = responseContent.replace(/^```json\s*|```$/g, '').trim();
        parsedResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
        console.error(`[${providerName}] Failed to parse JSON response:`, parseError);
        console.error(`[${providerName}] Raw response:`, responseContent.substring(0, 200) + '...');
        // Return default empty structure on error.
        return { billingCodes: [] };
        // throw new Error(`${providerName} response was not valid JSON. Response: ${responseContent.substring(0,100)}...`);
    }

    const validation = GenerateBillingCodesOutputSchema.safeParse(parsedResult);
    if (!validation.success) {
        console.error(`[${providerName}] Response failed Zod validation:`, validation.error);
        console.error(`[${providerName}] Parsed data:`, parsedResult);
        // Return default empty structure on validation failure.
        console.warn(`[${providerName}] Returning empty billing codes due to validation failure.`);
        return { billingCodes: [] };
    }
    console.log(`[${providerName}] Logic successful.`);
    return validation.data;
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
   const result = { billingCodes: output?.billingCodes ?? [] };
    const validation = GenerateBillingCodesOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error("[generateBillingCodesFlowGenkit] Genkit output validation failed:", validation.error);
        return { billingCodes: [] };
    }
   console.log("[generateBillingCodesFlowGenkit] Genkit flow successful.");
   return validation.data;
});


// --- Llama (OpenAI SDK) Implementation ---
async function generateBillingCodesFlowLlamaOpenAI(input: GenerateBillingCodesInput): Promise<GenerateBillingCodesOutput> {
    console.log("[generateBillingCodesFlowLlamaOpenAI] Executing Llama (OpenAI SDK) logic with input:", input);
    const messages: OpenAIMessage[] = [
        { role: 'system', content: llamaJsonPromptSystem },
        { role: 'user', content: llamaJsonPromptUser(input.soapNote) },
    ];
    const responseContent = await llamaChatCompletion(messages);
    return parseAndValidateLlamaOutput("LlamaOpenAI", responseContent);
}

// --- Llama (Azure SDK) Implementation ---
async function generateBillingCodesFlowLlamaAzure(input: GenerateBillingCodesInput): Promise<GenerateBillingCodesOutput> {
    console.log("[generateBillingCodesFlowLlamaAzure] Executing Llama (Azure SDK) logic with input:", input);
    const messages: AzureChatMessage[] = [
        { role: 'system', content: llamaJsonPromptSystem },
        { role: 'user', content: llamaJsonPromptUser(input.soapNote) },
    ];
    const responseContent = await azureLlamaChatCompletion(messages);
    return parseAndValidateLlamaOutput("LlamaAzure", responseContent);
}
