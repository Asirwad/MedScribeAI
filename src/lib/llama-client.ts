/**
 * @fileOverview Client for interacting with an OpenAI-compatible Llama API endpoint.
 */

import { llamaApiEndpoint, llamaApiKey, llamaModelName } from '@/config/llm-config';

// Define the structure for OpenAI-compatible chat messages
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Define the expected structure of a successful API response
interface LlamaChatCompletionResponse {
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
    // Include other potential fields if needed, like finish_reason
  }[];
  // Include other potential top-level fields if needed
}

// Define the structure for API errors
interface LlamaApiError {
  error: {
    message: string;
    type?: string;
    param?: string | null;
    code?: string | null;
  };
}

/**
 * Sends a chat completion request to the configured Llama API endpoint.
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
    if (!llamaApiEndpoint || !llamaApiKey) {
        console.error('[Llama Client] API endpoint or key is missing.');
        throw new Error('Llama API endpoint or key is not configured.');
    }

    const body = JSON.stringify({
        model: llamaModelName,
        messages: messages,
        // Add other parameters like temperature, max_tokens if needed
        // temperature: 0.7,
        // max_tokens: 1024,
    });

    let attempts = 0;
    let delay = initialDelayMs;

    while (attempts <= maxRetries) {
        attempts++;
        try {
            console.log(`[Llama Client] Attempt ${attempts}: Sending request to ${llamaApiEndpoint}`);
            const response = await fetch(llamaApiEndpoint + '/chat/completions', { // Ensure correct path
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${llamaApiKey}`,
                },
                body: body,
            });

            console.log(`[Llama Client] Attempt ${attempts}: Received status code ${response.status}`);

            if (!response.ok) {
                const errorData: LlamaApiError | string = await response.json().catch(() => response.text());
                const errorMessage = typeof errorData === 'string'
                    ? `API Error: ${response.status} ${response.statusText}. Response: ${errorData}`
                    : `API Error: ${response.status} ${response.statusText}. ${errorData?.error?.message || 'Unknown API error'}`;

                console.error(`[Llama Client] Attempt ${attempts} failed: ${errorMessage}`, errorData);

                // Retry only on specific server errors (e.g., 5xx) or rate limits (429)
                if (response.status >= 500 || response.status === 429) {
                    if (attempts > maxRetries) {
                         throw new Error(`API request failed after ${maxRetries + 1} attempts: ${errorMessage}`);
                    }
                    console.log(`[Llama Client] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue; // Retry the loop
                } else {
                    // Don't retry for client errors (4xx, except 429)
                    throw new Error(`API request failed: ${errorMessage}`);
                }
            }

            // Success
            const result = await response.json() as LlamaChatCompletionResponse;
            console.log('[Llama Client] API call successful.');

            if (!result.choices || result.choices.length === 0 || !result.choices[0].message?.content) {
                 console.warn('[Llama Client] API response structure unexpected or content missing:', result);
                 throw new Error('Invalid response structure received from Llama API.');
            }

            return result.choices[0].message.content.trim();

        } catch (error) {
            console.error(`[Llama Client] Attempt ${attempts}: Network or fetch error:`, error);
            if (attempts > maxRetries) {
                 const message = error instanceof Error ? error.message : 'Unknown fetch error';
                 throw new Error(`Network or fetch error after ${maxRetries + 1} attempts: ${message}`);
            }
            console.log(`[Llama Client] Retrying network/fetch error in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }

     // Should not be reached if maxRetries >= 0, but satisfies TS compiler
    throw new Error('Llama chat completion failed unexpectedly.');
}

// --- Helper to check provider ---
// (Imported from config, but adding here for clarity in this standalone example)
import { llmProvider } from '@/config/llm-config';
