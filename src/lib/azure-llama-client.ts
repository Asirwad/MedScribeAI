/**
 * @fileOverview Client for interacting with Llama models via Azure AI Inference.
 * Uses the @azure-rest/ai-inference SDK.
 */

import ModelClient, { isUnexpected, type ChatResponseMessageOutput } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { 
    llmProvider, 
    azureAiEndpoint, 
    azureAiKey, 
    azureLlamaModelName 
} from '@/config/llm-config';

// Define the structure for Azure AI Inference chat messages
// Based on the example provided: { role:"system", content: "You are a helpful assistant." }
export interface AzureChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let azureModelClient: ReturnType<typeof ModelClient> | null = null;

if (llmProvider === 'LLAMA_AZURE' && azureAiEndpoint && azureAiKey) {
  try {
    azureModelClient = ModelClient(
      azureAiEndpoint,
      new AzureKeyCredential(azureAiKey)
    );
    console.log('[Azure Llama Client] ModelClient initialized for Azure AI Inference.');
  } catch (error) {
    console.error('[Azure Llama Client] Failed to initialize ModelClient for Azure AI Inference:', error);
  }
} else if (llmProvider === 'LLAMA_AZURE' && (!azureAiEndpoint || !azureAiKey)) {
  console.warn('[Azure Llama Client] LLAMA_AZURE provider selected, but Azure AI endpoint or key is missing. Azure Llama client will not function.');
}

/**
 * Sends a chat completion request to the configured Azure AI Inference endpoint for Llama.
 * Implements basic retry logic with exponential backoff for transient errors.
 *
 * @param messages An array of messages representing the conversation history and prompt.
 * @param maxRetries Maximum number of retry attempts for transient errors.
 * @param initialDelayMs Initial delay in milliseconds for retries.
 * @returns A promise resolving to the assistant's response content string.
 * @throws An error if the API call fails permanently or after retries.
 */
export async function azureLlamaChatCompletion(
    messages: AzureChatMessage[],
    maxRetries: number = 3,
    initialDelayMs: number = 1000
): Promise<string> {
    if (llmProvider !== 'LLAMA_AZURE') {
        throw new Error('Azure Llama client called when LLM provider is not set to LLAMA_AZURE.');
    }
    if (!azureModelClient) {
        console.error('[Azure Llama Client] ModelClient for Azure AI Inference is not initialized. Check configuration.');
        throw new Error('Azure Llama client (ModelClient) is not initialized. Azure AI endpoint or key might be missing or invalid.');
    }

    let attempts = 0;
    let delay = initialDelayMs;

    while (attempts <= maxRetries) {
        attempts++;
        try {
            console.log(`[Azure Llama Client] Attempt ${attempts}: Sending request. Model: ${azureLlamaModelName}`);
            const response = await azureModelClient.path("/chat/completions").post({
                body: {
                  messages: messages,
                  temperature: 0.7, // Default temperature, can be configured
                  top_p: 1.0,       // Default top_p
                  max_tokens: 1024, // Default max_tokens
                  model: azureLlamaModelName // Use the configured model name
                }
            });

            if (isUnexpected(response)) {
                // Log the full error response body if available
                console.error(`[Azure Llama Client] Azure API error response (status ${response.status}):`, response.body?.error || response.body);
                // Check if the error is retryable (e.g., server errors, rate limits)
                // For Azure, need to inspect response.status or response.body.error for specific retryable conditions.
                // Assuming 5xx errors and 429 (Too Many Requests) are retryable.
                const isAzureRetryable = response.status >= 500 || response.status === 429;

                if (isAzureRetryable && attempts < maxRetries) {
                    console.log(`[Azure Llama Client] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue; // Retry the loop
                }
                // Non-retryable error or max retries reached
                throw new Error(`Azure API request failed with status ${response.status}: ${response.body?.error?.message || 'Unknown Azure API error'}`);
            }
            
            console.log('[Azure Llama Client] API call successful.');
            
            // Ensure choices exist and have content
            const messageOutput = response.body.choices?.[0]?.message as ChatResponseMessageOutput | undefined;
            const content = messageOutput?.content;

            if (typeof content !== 'string' || !content.trim()) {
                console.warn('[Azure Llama Client] API response structure unexpected or content missing:', response.body);
                throw new Error('Invalid response structure or empty content received from Azure Llama API.');
            }

            return content.trim();

        } catch (error: any) {
            // Catch errors from client.path itself or re-thrown errors
            console.error(`[Azure Llama Client] Attempt ${attempts}: Error during API call:`, error.message);
            
            // Generic retry for network issues, if not already handled by specific status codes
            if (attempts < maxRetries && !(error.message && error.message.startsWith('Azure API request failed with status'))) {
                console.log(`[Azure Llama Client] Generic error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue; // Retry the loop
            } else {
                const finalErrorMessage = error.message || 'Unknown Azure Llama client error.';
                throw new Error(`Azure API request failed after ${attempts} attempts: ${finalErrorMessage}`);
            }
        }
    }
    // Should not be reached if maxRetries >= 0
    throw new Error('Azure Llama chat completion failed unexpectedly.');
}
