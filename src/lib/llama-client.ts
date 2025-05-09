/**
 * @fileOverview Client for interacting with an OpenAI-compatible Llama API endpoint.
 * Uses the OpenAI SDK for making requests.
 */

import OpenAI from 'openai';
import { llmProvider, llamaApiEndpoint, llamaApiKey, llamaModelName } from '@/config/llm-config';

// Define the structure for OpenAI-compatible chat messages
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Initialize the OpenAI client for Llama (if configured)
// The client is initialized once when the module is loaded.
let llamaOpenAIClient: OpenAI | null = null;

if (llmProvider === 'LLAMA' && llamaApiEndpoint && llamaApiKey) {
  try {
    llamaOpenAIClient = new OpenAI({
      apiKey: llamaApiKey,
      baseURL: llamaApiEndpoint, // This should be the base URL, e.g., "http://10.31.207.8:8000/v1"
    });
    console.log('[Llama Client] OpenAI SDK client initialized for Llama.');
  } catch (error) {
    console.error('[Llama Client] Failed to initialize OpenAI SDK for Llama:', error);
    // Depending on the error, you might want to prevent further operations or log more details
  }
} else if (llmProvider === 'LLAMA' && (!llamaApiEndpoint || !llamaApiKey)) {
  console.warn('[Llama Client] Llama provider selected, but API endpoint or key is missing. Llama client will not function.');
}


/**
 * Sends a chat completion request to the configured Llama API endpoint using the OpenAI SDK.
 * Implements basic retry logic with exponential backoff for transient errors.
 *
 * @param messages An array of messages representing the conversation history and prompt.
 * @param maxRetries Maximum number of retry attempts for transient errors.
 * @param initialDelayMs Initial delay in milliseconds for retries.
 * @returns A promise resolving to the assistant's response content string.
 * @throws An error if the API call fails permanently or after retries.
 */
export async function llamaChatCompletion(
    messages: OpenAIMessage[],
    maxRetries: number = 3,
    initialDelayMs: number = 1000
): Promise<string> {
    if (llmProvider !== 'LLAMA') {
        throw new Error('Llama client called when LLM provider is not set to LLAMA.');
    }
    if (!llamaOpenAIClient) {
        console.error('[Llama Client] OpenAI SDK client for Llama is not initialized. Check configuration.');
        throw new Error('Llama client (OpenAI SDK) is not initialized. API endpoint or key might be missing or invalid.');
    }

    let attempts = 0;
    let delay = initialDelayMs;

    while (attempts <= maxRetries) {
        attempts++;
        try {
            console.log(`[Llama Client] Attempt ${attempts}: Sending request with OpenAI SDK. Model: ${llamaModelName}`);
            const chatResponse = await llamaOpenAIClient.chat.completions.create({
                model: llamaModelName, // Use the configured Llama model name
                messages: messages,
                // stream: false, // Explicitly set stream to false if not streaming
                // temperature: 0.7, // Optional: Adjust temperature
                // max_tokens: 1024,  // Optional: Adjust max tokens
            });

            console.log('[Llama Client] API call successful with OpenAI SDK.');

            const content = chatResponse.choices[0]?.message?.content;

            if (!content) {
                 console.warn('[Llama Client] API response structure unexpected or content missing using OpenAI SDK:', chatResponse);
                 throw new Error('Invalid response structure received from Llama API via OpenAI SDK.');
            }

            return content.trim();

        } catch (error: any) {
            console.error(`[Llama Client] Attempt ${attempts}: OpenAI SDK error:`, error);

            // Check for OpenAI specific APIError or generic errors
            let isRetryable = false;
            if (error instanceof OpenAI.APIError) {
                console.error(`[Llama Client] OpenAI APIError: Status ${error.status}, Type ${error.type}, Message: ${error.message}`);
                // Retry on server errors (5xx) or rate limits (429)
                if (error.status && (error.status >= 500 || error.status === 429)) {
                    isRetryable = true;
                }
            } else {
                // For generic network errors, assume retryable unless it's the last attempt
                isRetryable = true;
            }


            if (isRetryable && attempts <= maxRetries) {
                console.log(`[Llama Client] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue; // Retry the loop
            } else {
                const finalErrorMessage = error.message || 'Unknown Llama client error with OpenAI SDK.';
                throw new Error(`API request failed after ${attempts} attempts: ${finalErrorMessage}`);
            }
        }
    }

     // Should not be reached if maxRetries >= 0, but satisfies TS compiler
    throw new Error('Llama chat completion failed unexpectedly with OpenAI SDK.');
}
